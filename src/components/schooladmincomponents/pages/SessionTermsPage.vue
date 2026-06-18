<template>
  <div class="space-y-6">
    <SectionCard :title="`Terms for ${session?.name || '...'}`" subtitle="Manage academic terms for this session.">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create" variant="primary" size="sm" />
      </template>
      <SkeletonRows v-if="sessionsStore.loading" :columns="4" />
      <div v-else-if="currentTerms.length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No terms found</h3>
        <p class="text-slate-600 mb-6">Get started by creating your first term for {{ session?.name || 'this session' }}.</p>
      </div>
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="term in paginatedTerms" :key="term.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900 text-nowrap">{{ term.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.startDate || term.start_date || '-') }}</td>
                <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.endDate || term.end_date || '-') }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editTerm(term)" variant="outline" size="xs" />
                    <AppButton 
                      :text="termStatus(term) === 'Current' ? 'Deactivate' : 'Activate'" 
                      @click="toggleTerm(term.id)" 
                      :variant="termStatus(term) === 'Current' ? 'danger' : 'warning'" 
                      size="xs" 
                      :processing="toggleLoading.has(term.id)"
                      :disabled="toggleLoading.has(term.id)"
                      :loadingText="termStatus(term) === 'Current' ? 'Deactivating...' : 'Activating...'"
                    />
                    <AppButton 
                      text="Delete" 
                      @click="deleteTerm(term.id)" 
                      variant="danger" 
                      size="xs" 
                      :processing="deleteLoading.has(term.id)"
                      :disabled="deleteLoading.has(term.id)"
                      loadingText="Deleting..."
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
          <div class="text-sm text-slate-600">Showing {{ startIndex }} to {{ endIndex }} of {{ currentTerms.length }} terms</div>
          <div class="flex gap-2">
            <AppButton 
              text="Previous" 
              @click="previousPage" 
              variant="outline" 
              size="xs"
              :disabled="currentPage === 1"
            />
            <div class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">Page {{ currentPage }} of {{ totalPages }}</div>
            <AppButton 
              text="Next" 
              @click="nextPage" 
              variant="outline" 
              size="xs"
              :disabled="currentPage === totalPages"
            />
          </div>
        </div>
      </div>
    </SectionCard>
    <TermModal :show="showModal" :term="selectedTerm" @close="closeModal" @submit="submitTerm" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import TermModal from '../components/TermModal.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const route = useRoute()
const headings = ['Term Name', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedTerm = ref(null)

// Loading states
const deleteLoading = ref(new Set())
const toggleLoading = ref(new Set())

// Pagination state
const itemsPerPage = 10
const currentPage = ref(1)

const sessionId = computed(() => route.params.id)
const session = computed(() => sessionsStore.sessions.find(s => s.id === sessionId.value))
const currentTerms = computed(() => sessionsStore.terms[sessionId.value] || [])

// Pagination computed properties
const totalPages = computed(() => Math.ceil(currentTerms.value.length / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, currentTerms.value.length))
const paginatedTerms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return currentTerms.value.slice(start, end)
})

onMounted(async () => {
  try {
    await sessionsStore.fetchSessions()
    if (sessionId.value) {
      await sessionsStore.fetchTerms(sessionId.value)
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

watch(() => sessionId.value, async (newId) => {
  if (newId) {
    currentPage.value = 1
    await sessionsStore.fetchTerms(newId)
  }
})

// Modal functions
const openModal = () => {
  selectedTerm.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTerm.value = null
}

const editTerm = (term) => {
  selectedTerm.value = term
  showModal.value = true
}

const submitTerm = async (termData) => {
  try {
    await sessionsStore.saveTerm(sessionId.value, termData)
    uiStore.addToast({ title: 'Term saved', message: 'Academic term has been saved.', variant: 'success' })
    
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
    await sessionsStore.fetchTerms(sessionId.value) // Refresh to get updated list
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save term.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}

const termStatus = (term) => (term.current ? 'Current' : 'Not current')

const toggleTerm = async (termId) => {
  const term = currentTerms.value.find(t => t.id === termId)
  const isActive = termStatus(term) === 'Current'
  toggleLoading.value = new Set([...toggleLoading.value, termId])

  try {
    if (isActive) {
      // Deactivate - set is_current to false
      await sessionsStore.saveTerm(sessionId.value, { 
        id: termId,
        is_current: false 
      })
      uiStore.addToast({ title: 'Term deactivated', message: 'Academic term has been deactivated.', variant: 'success' })
    } else {
      // Activate - use set-current endpoint
      await sessionsStore.activateTerm(sessionId.value, termId)
      uiStore.addToast({ title: 'Term activated', message: 'Current academic term updated.', variant: 'success' })
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: isActive ? 'Failed to deactivate term.' : 'Failed to activate term.', variant: 'error' })
  } finally {
    toggleLoading.value = new Set([...toggleLoading.value].filter(id => id !== termId))
  }
}

const deleteTerm = async (termId) => {
  if (!confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, termId])
  
  try {
    await sessionsStore.deleteTerm(sessionId.value, termId)
    uiStore.addToast({ title: 'Term deleted', message: 'Academic term has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete term.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== termId))
  }
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}</script>
