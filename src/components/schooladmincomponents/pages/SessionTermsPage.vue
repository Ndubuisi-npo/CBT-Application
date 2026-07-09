<template>
  <div class="space-y-6">
    <SectionCard :title="`Terms for ${session?.name || '...'}`" subtitle="Manage academic terms for this session.">
      <template #header>
        <AppButton @click="openModal()" :icon="Plus" text="Create" variant="primary" size="sm" />
      </template>
      <SkeletonRows v-if="sessionsStore.loading" :columns="4" class="hidden lg:block" />
      <div v-if="sessionsStore.loading" class="grid gap-3 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="currentTerms.length === 0"
        :icon="CalendarRange"
        title="No terms found"
        :description="`Get started by creating your first term for ${session?.name || 'this session'}.`"
      />

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 bg-white">
              <thead class="bg-slate-50">
                <tr>
                  <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="term in paginatedTerms" :key="term.id" class="group transition hover:bg-slate-50/80">
                  <td class="px-5 py-4 font-semibold text-slate-900 text-nowrap">{{ term.name }}</td>
                  <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.startDate || term.start_date) || 'N/A' }}</td>
                  <td class="px-5 py-4 text-sm text-slate-600 text-nowrap">{{ fmtDate(term.endDate || term.end_date) || 'N/A' }}</td>
                  <td class="px-5 py-4">
                    <ResponsiveTableActions :actions="termActions(term)" :entity-label="term.name" always-visible />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
            <div class="text-sm text-slate-600">Showing {{ startIndex }} to {{ endIndex }} of {{ currentTerms.length }} terms</div>
            <div class="flex gap-2">
              <AppButton text="Previous" @click="previousPage" variant="outline" size="xs" :disabled="currentPage === 1" />
              <div class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">Page {{ currentPage }} of {{ totalPages }}</div>
              <AppButton text="Next" @click="nextPage" variant="outline" size="xs" :disabled="currentPage === totalPages" />
            </div>
          </div>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="space-y-3 lg:hidden">
          <div class="grid gap-3 sm:grid-cols-2">
            <ResponsiveDataCard
              v-for="term in paginatedTerms"
              :key="term.id"
              avatar-color="bg-slate-100 text-slate-600"
              :avatar-text="(term.name || '?').slice(0, 2).toUpperCase()"
              :title="term.name"
              :fields="[
                { label: 'Start Date', value: fmtDate(term.startDate || term.start_date) || 'N/A' },
                { label: 'End Date', value: fmtDate(term.endDate || term.end_date) || 'N/A' },
              ]"
            >
              <template #badge>
                <AppBadge :label="termStatus(term)" :variant="termStatus(term) === 'Current' ? 'success' : 'default'" />
              </template>
              <template #actions>
                <ResponsiveTableActions :actions="termActions(term)" :entity-label="term.name" always-visible />
              </template>
            </ResponsiveDataCard>
          </div>
          <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <AppButton text="Previous" @click="previousPage" variant="outline" size="xs" :disabled="currentPage === 1" />
            <span class="text-xs font-medium text-slate-600">Page {{ currentPage }} of {{ totalPages }}</span>
            <AppButton text="Next" @click="nextPage" variant="outline" size="xs" :disabled="currentPage === totalPages" />
          </div>
        </div>
      </template>
    </SectionCard>
    <TermFormDrawer :show="showModal" :term="selectedTerm" :saving="savingTerm" @close="closeModal" @submit="submitTerm" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarRange, Pencil, Plus, Power, Trash2 } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import AppBadge from '../../shared/AppBadge.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import TermFormDrawer from '../components/TermFormDrawer.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'
import { isNameTakenError } from '../../../js/lib/api'

const route = useRoute()
const headings = ['Term Name', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedTerm = ref(null)
const savingTerm = ref(false)

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

const termStatus = (term) => (term.current || term.is_current ? 'Current' : 'Not current')

const termActions = (term) => [
  { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => editTerm(term) },
  {
    key: 'toggle',
    label: termStatus(term) === 'Current' ? 'Deactivate' : 'Activate',
    icon: Power,
    variant: termStatus(term) === 'Current' ? 'danger' : 'warning',
    loading: toggleLoading.value.has(term.id),
    onClick: () => toggleTerm(term.id),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    loading: deleteLoading.value.has(term.id),
    loadingLabel: 'Deleting…',
    onClick: () => deleteTerm(term.id),
  },
]

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
  savingTerm.value = true
  try {
    await sessionsStore.saveTerm(sessionId.value, termData)
    uiStore.addToast({ title: 'Term saved', message: 'Academic term has been saved.', variant: 'success' })
    closeModal()
    await sessionsStore.fetchTerms(sessionId.value)
  } catch (error) {
    if (isNameTakenError(error)) {
      uiStore.addToast({ title: 'Name taken', message: 'Name has already been taken.', variant: 'error' })
    } else {
      uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save term.', variant: 'error' })
    }
  } finally {
    savingTerm.value = false
  }
}

const toggleTerm = async (termId) => {
  const term = currentTerms.value.find(t => t.id === termId)
  const isActive = termStatus(term) === 'Current'
  toggleLoading.value = new Set([...toggleLoading.value, termId])

  try {
    if (isActive) {
      await sessionsStore.saveTerm(sessionId.value, { id: termId, is_current: false })
      uiStore.addToast({ title: 'Term deactivated', message: 'Academic term has been deactivated.', variant: 'success' })
    } else {
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
}
</script>
