<template>
  <div class="space-y-6">
    <SectionCard title="Academic Sessions" subtitle="Manage session timelines and activate the current school year.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton @click="openModal()" :icon="Plus" text="Create Session" variant="primary" />
        </div>
      </template>
      <SkeletonRows v-if="sessionsStore.loading" :columns="5" />
      <div v-else-if="sessionsStore.sessions.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Calendar class="h-12 w-12 text-slate-400" />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">No Academic Sessions</h3>
        <p class="mt-2 text-slate-600">Get started by creating your first academic session to manage your school year timeline.</p>
        <div class="mt-8">
          <AppButton @click="openModal()" :icon="Plus" text="Create Your First Session" variant="primary" size="lg" />
        </div>
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
              <tr v-for="session in sessionsStore.sessions" :key="session.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ session.name }}</td>
                <td class="px-5 py-4 text-nowrap"><StatusBadge :status="sessionStatus(session)" /></td>
                <td class="px-5 py-4 text-sm text-nowrap text-slate-600">{{ fmtDate(session.startDate || session.start_date || '-') }}</td>
                <td class="px-5 py-4 text-sm text-nowrap text-slate-600">{{ fmtDate(session.endDate || session.end_date || '-') }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="openModal(session)" variant="outline" size="xs" />
                    <ActionButton tag="RouterLink" :to="`/school-admin/terms/${session.id}`" text="Terms" variant="primary" size="xs" />
                    <AppButton 
                      :text="sessionStatus(session) === 'Current' ? 'Deactivate' : 'Activate'" 
                      @click="toggleSession(session.id)" 
                      :variant="sessionStatus(session) === 'Current' ? 'danger' : 'success'" 
                      size="xs"
                      :loadingText="sessionStatus(session) === 'Current' ? 'Deactivating...' : 'Activating...'"
                      :processing="toggleLoading.has(session.id)"
                      :disabled="toggleLoading.has(session.id)"
                    />
                    <AppButton 
                      text="Delete" 
                      @click="deleteSession(session.id)" 
                      variant="danger" 
                      size="xs"
                      loadingText="Deleting..."
                      :processing="deleteLoading.has(session.id)"
                      :disabled="deleteLoading.has(session.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SessionModal 
      :show="showModal" 
      :session="selectedSession"
      @close="closeModal"
      @submit="submitSession"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Calendar, Plus } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import SessionModal from '../components/SessionModal.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const headings = ['Session Name', 'Status', 'Start Date', 'End Date', 'Actions']
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

// Modal state
const showModal = ref(false)
const selectedSession = ref(null)

// Loading states
const toggleLoading = ref(new Set())
const deleteLoading = ref(new Set())

onMounted(async () => {
  try {
    await sessionsStore.fetchSessions()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load sessions. Please check your connection.', variant: 'error' })
  }
})

const closeModal = () => {
  showModal.value = false
  selectedSession.value = null
}

const openModal = (session) => {
  selectedSession.value = session
  showModal.value = true
}

const reset = () => {
  selectedSession.value = null
}

const sessionStatus = (session) => (session.current ? 'Current' : 'Not current')

const toggleSession = async (id) => {
  const session = sessionsStore.sessions.find(s => s.id === id)
  const isActive = sessionStatus(session) === 'Current'
  
  toggleLoading.value = new Set([...toggleLoading.value, id])
  
  try {
    if (isActive) {
      // Deactivate - set is_current to false
      await sessionsStore.saveSession({ 
        id,
        is_current: false 
      })
      uiStore.addToast({ title: 'Session deactivated', message: 'Academic session has been deactivated.', variant: 'success' })
    } else {
      // Activate - use set-current endpoint
      await sessionsStore.activateSession(id)
      uiStore.addToast({ title: 'Session activated', message: 'Current academic session updated.', variant: 'success' })
    }
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: isActive ? 'Failed to deactivate session.' : 'Failed to activate session.', variant: 'error' })
  } finally {
    toggleLoading.value = new Set([...toggleLoading.value].filter(loadingId => loadingId !== id))
  }
}

const deleteSession = async (id) => {
  if (!confirm('Are you sure you want to delete this academic session? This action cannot be undone and will also delete all associated terms.')) {
    return
  }
  
  deleteLoading.value = new Set([...deleteLoading.value, id])
  
  try {
    await sessionsStore.deleteSession(id)
    uiStore.addToast({ title: 'Session deleted', message: 'Academic session has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete session.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter(loadingId => loadingId !== id))
  }
}

const submitSession = async (sessionData) => {
  try {
    const payload = {
      name: sessionData.name,
      start_date: sessionData.startDate,
      end_date: sessionData.endDate,
      is_current: sessionData.isCurrent
    }
    
    // If setting as current, ensure is_current is true
    if (sessionData.isCurrent) {
      payload.is_current = true
    }

    if (sessionData.id) {
      await sessionsStore.saveSession({ id: sessionData.id, ...payload })
    } else {
      await sessionsStore.createSession(payload)
    }
    
    uiStore.addToast({ title: 'Session saved', message: 'Academic session has been saved.', variant: 'success' })
    // Close modal after a short delay to ensure toast is visible
    setTimeout(() => {
      closeModal()
    }, 100)
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to save session.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}
</script>
