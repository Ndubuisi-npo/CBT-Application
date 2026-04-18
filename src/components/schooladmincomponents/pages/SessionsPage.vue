<template>
  <div class="space-y-6">
    <SectionCard title="Academic Sessions" subtitle="Manage session timelines and activate the current school year.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton @click="openModal()" :icon="Plus" text="Create Session" variant="primary" />
        </div>
      </template>
      <SkeletonRows v-if="sessionsStore.loading" :columns="5" />
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
import { Plus } from 'lucide-vue-next'
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
    console.error('Error loading sessions:', error)
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
    console.log('Session data received in page:', sessionData)
    
    const payload = {
      name: sessionData.name,
      start_date: sessionData.start_date,
      end_date: sessionData.end_date,
      is_current: false ,
    }
    
    if (sessionData.is_current === true) {
      payload.is_current = true
    }
       
    console.log('📤 Payload:', payload)

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
    console.error('Session form error:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to save session.', variant: 'error' })
    // Close modal after error toast as well
    setTimeout(() => {
      closeModal()
    }, 100)
  }
}
</script>
