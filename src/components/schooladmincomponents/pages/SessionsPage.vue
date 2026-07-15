<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Academic Sessions</h1>
        <p class="mt-1 text-sm text-slate-500">Manage session timelines and activate the current school year.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton v-if="selectedSessions.size" text="Delete Selected" variant="danger" size="sm" @click="deleteSelected" />
        <AppButton v-if="isSelectMode" text="Cancel" variant="ghost" size="sm" @click="cancelSelectMode" />
        <AppButton v-if="!isSelectMode" :icon="CheckSquare" text="Select" variant="ghost" size="sm" @click="startSelectMode" />
        <AppButton data-tour="create-session-btn" :icon="Plus" text="Create Session" variant="primary" size="sm" @click="openModal()" />
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white">
      <SkeletonRows v-if="sessionsStore.loading" :columns="5" class="hidden lg:block" />
      <div v-if="sessionsStore.loading" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="!sessionsStore.sessions.length"
        :icon="Calendar"
        title="No academic sessions"
        description="Create your first session to begin managing your school year."
        class="m-4 border-0"
      >
        <template #actions>
          <AppButton :icon="Plus" text="Create First Session" variant="primary" size="sm" @click="openModal()" />
        </template>
      </AppEmptyState>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50">
                <th v-if="isSelectMode" class="w-10 px-5 py-3">
                  <input type="checkbox" :checked="areAllSelected" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleSelectAll($event.target.checked)" />
                </th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Session Name</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Start Date</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">End Date</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Terms</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="session in paginatedSessions" :key="session.id" class="group transition hover:bg-slate-50/70">
                <td v-if="isSelectMode" class="px-5 py-3.5">
                  <input type="checkbox" :checked="selectedSessions.has(session.id)" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleItemSelection(session.id, $event.target.checked)" />
                </td>
                <td class="px-5 py-3.5 font-semibold text-slate-900">{{ session.name }}</td>
                <td class="px-5 py-3.5"><StatusBadge :status="sessionStatus(session)" /></td>
                <td class="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">{{ fmtDate(session.startDate || session.start_date || 'N/A') }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">{{ fmtDate(session.endDate || session.end_date || 'N/A') }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ getTermsCount(session) }}</td>
                <td class="px-5 py-3.5">
                  <ResponsiveTableActions :actions="sessionActions(session)" :entity-label="session.name" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="session in paginatedSessions"
            :key="session.id"
            avatar-color="bg-[#0B1F3A]/10 text-[#0B1F3A]"
            :avatar-text="(session.name || '?').slice(0, 2).toUpperCase()"
            :title="session.name"
            :fields="[
              { label: 'Start Date', value: fmtDate(session.startDate || session.start_date || 'N/A') },
              { label: 'End Date', value: fmtDate(session.endDate || session.end_date || 'N/A') },
              { label: 'Terms', value: getTermsCount(session) },
            ]"
          >
            <template #badge>
              <StatusBadge :status="sessionStatus(session)" />
            </template>
            <template #actions>
              <ResponsiveTableActions :actions="sessionActions(session)" :entity-label="session.name" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>

      <div v-if="sessionsStore.sessions.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ startIndex }}–{{ endIndex }} of {{ sessionsStore.sessions.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ currentPage }} / {{ totalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <SessionFormDrawer :show="showModal" :session="selectedSession" :saving="savingSession" @close="closeModal" @submit="submitSession" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, CheckSquare, ChevronLeft, ChevronRight, Pencil, Plus, Power, Trash2 } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import SessionFormDrawer from '../components/SessionFormDrawer.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const router = useRouter()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const isSelectMode = ref(false)
const selectedSessions = ref(new Set())
const showModal = ref(false)
const selectedSession = ref(null)
const savingSession = ref(false)
const toggleLoading = ref(new Set())
const deleteLoading = ref(new Set())
const itemsPerPage = 10
const currentPage = ref(1)

const areAllSelected = computed(() =>
  sessionsStore.sessions.length > 0 && sessionsStore.sessions.every((s) => selectedSessions.value.has(s.id)),
)
const totalPages = computed(() => Math.max(1, Math.ceil(sessionsStore.sessions.length / itemsPerPage)))
const startIndex = computed(() => sessionsStore.sessions.length ? (currentPage.value - 1) * itemsPerPage + 1 : 0)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, sessionsStore.sessions.length))
const paginatedSessions = computed(() => sessionsStore.sessions.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

const sessionStatus = (s) => (s.current || s.is_current ? 'Current' : 'Not current')
const getTermsCount = (s) => {
  const t = Array.isArray(s.terms) ? s.terms : Array.isArray(s.terms?.data) ? s.terms.data : sessionsStore.terms?.[s.id]
  return Array.isArray(t) ? `${t.length} term${t.length !== 1 ? 's' : ''}` : 'N/A'
}

const sessionActions = (session) => [
  { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openModal(session) },
  { key: 'terms', label: 'Terms', icon: Calendar, onClick: () => router.push(`/school-admin/terms/${session.id}`) },
  {
    key: 'toggle',
    label: sessionStatus(session) === 'Current' ? 'Deactivate' : 'Activate',
    icon: Power,
    variant: sessionStatus(session) === 'Current' ? 'danger' : 'success',
    loading: toggleLoading.value.has(session.id),
    onClick: () => toggleSession(session.id),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    loading: deleteLoading.value.has(session.id),
    loadingLabel: 'Deleting…',
    onClick: () => deleteSession(session.id),
  },
]

const startSelectMode = () => { isSelectMode.value = true; selectedSessions.value = new Set() }
const cancelSelectMode = () => { isSelectMode.value = false; selectedSessions.value = new Set() }
const toggleSelectAll = (checked) => {
  const next = new Set(); if (checked) sessionsStore.sessions.forEach((s) => next.add(s.id)); selectedSessions.value = next
}
const toggleItemSelection = (id, checked) => {
  const next = new Set(selectedSessions.value); checked ? next.add(id) : next.delete(id); selectedSessions.value = next
}

const openModal = (s) => { selectedSession.value = s || null; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedSession.value = null }

const deleteSelected = async () => {
  const ids = Array.from(selectedSessions.value)
  if (!confirm(`Delete ${ids.length} session(s)? This cannot be undone.`)) return
  try {
    ids.forEach((id) => deleteLoading.value.add(id))
    for (const id of ids) await sessionsStore.deleteSession(id)
    cancelSelectMode()
    uiStore.addToast({ title: 'Sessions deleted', message: `${ids.length} session(s) deleted.`, variant: 'success' })
  } catch { uiStore.addToast({ title: 'Error', message: 'Failed to delete sessions.', variant: 'error' }) }
  finally { deleteLoading.value = new Set() }
}

const toggleSession = async (id) => {
  const session = sessionsStore.sessions.find((s) => s.id === id)
  const isActive = sessionStatus(session) === 'Current'
  toggleLoading.value = new Set([...toggleLoading.value, id])
  try {
    if (isActive) { await sessionsStore.saveSession({ id, is_current: false }); uiStore.addToast({ title: 'Deactivated', message: 'Session deactivated.', variant: 'success' }) }
    else { await sessionsStore.activateSession(id); uiStore.addToast({ title: 'Activated', message: 'Session set as current.', variant: 'success' }) }
  } catch { uiStore.addToast({ title: 'Error', message: 'Failed to update session.', variant: 'error' }) }
  finally { toggleLoading.value = new Set([...toggleLoading.value].filter((x) => x !== id)) }
}

const deleteSession = async (id) => {
  if (!confirm('Delete this session? All associated terms will also be deleted.')) return
  deleteLoading.value = new Set([...deleteLoading.value, id])
  try { await sessionsStore.deleteSession(id); uiStore.addToast({ title: 'Deleted', message: 'Session deleted.', variant: 'success' }) }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to delete session.', variant: 'error' }) }
  finally { deleteLoading.value = new Set([...deleteLoading.value].filter((x) => x !== id)) }
}

const submitSession = async (data) => {
  savingSession.value = true
  try {
    const { id, ...payload } = data
    const apiPayload = { name: payload.name, start_date: payload.startDate, end_date: payload.endDate, is_current: payload.isCurrent }
    id ? await sessionsStore.saveSession({ id, ...apiPayload }) : await sessionsStore.createSession(apiPayload)
    uiStore.addToast({ title: 'Session saved', message: 'Academic session saved.', variant: 'success' })
    closeModal()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error?.response?.data?.message || error?.message || 'Failed to save session.', variant: 'error' })
  } finally {
    savingSession.value = false
  }
}

onMounted(async () => {
  try { await sessionsStore.fetchSessions() }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to load sessions.', variant: 'error' }) }
})
</script>
