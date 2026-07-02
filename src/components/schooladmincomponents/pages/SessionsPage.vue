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
        <AppButton :icon="Plus" text="Create Session" variant="primary" size="sm" @click="openModal()" />
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white">
      <SkeletonRows v-if="sessionsStore.loading" :columns="5" />

      <div v-else-if="!sessionsStore.sessions.length" class="px-5 py-16 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Calendar class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">No academic sessions</h3>
        <p class="mt-1.5 text-sm text-slate-500">Create your first session to begin managing your school year.</p>
        <div class="mt-5">
          <AppButton :icon="Plus" text="Create First Session" variant="primary" size="sm" @click="openModal()" />
        </div>
      </div>

      <div v-else class="overflow-x-auto">
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
                <div class="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100" @click="openModal(session)">Edit</button>
                  <RouterLink :to="`/school-admin/terms/${session.id}`" class="rounded-lg px-2.5 py-1 text-xs font-medium text-[#0B1F3A] ring-1 ring-slate-200 transition hover:bg-slate-100">Terms</RouterLink>
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium transition ring-1"
                    :class="sessionStatus(session) === 'Current' ? 'text-red-600 ring-red-200 hover:bg-red-50' : 'text-emerald-600 ring-emerald-200 hover:bg-emerald-50'"
                    :disabled="toggleLoading.has(session.id)"
                    @click="toggleSession(session.id)"
                  >{{ toggleLoading.has(session.id) ? '…' : sessionStatus(session) === 'Current' ? 'Deactivate' : 'Activate' }}</button>
                  <button class="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50" :disabled="deleteLoading.has(session.id)" @click="deleteSession(session.id)">{{ deleteLoading.has(session.id) ? '…' : 'Delete' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="sessionsStore.sessions.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ startIndex }}–{{ endIndex }} of {{ sessionsStore.sessions.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ currentPage }} / {{ totalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <SessionModal :show="showModal" :session="selectedSession" @close="closeModal" @submit="submitSession" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, CheckSquare, ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StatusBadge from '../components/StatusBadge.vue'
import SessionModal from '../components/SessionModal.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminUiStore } from '../stores/ui'
import { fmtDate } from '@/lib/helpers'

const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const isSelectMode = ref(false)
const selectedSessions = ref(new Set())
const showModal = ref(false)
const selectedSession = ref(null)
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
  try {
    const payload = { name: data.name, start_date: data.startDate ?? data.start_date, end_date: data.endDate ?? data.end_date, is_current: Boolean(data.isCurrent ?? data.is_current) }
    data.id ? await sessionsStore.saveSession({ id: data.id, ...payload }) : await sessionsStore.createSession(payload)
    uiStore.addToast({ title: 'Session saved', message: 'Academic session saved.', variant: 'success' })
    setTimeout(closeModal, 100)
  } catch { uiStore.addToast({ title: 'Error', message: 'Failed to save session.', variant: 'error' }); setTimeout(closeModal, 100) }
}

onMounted(async () => {
  try { await sessionsStore.fetchSessions() }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to load sessions.', variant: 'error' }) }
})
</script>
