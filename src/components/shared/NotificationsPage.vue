<!--
  NotificationsPage.vue
  ────────────────────────────────────────────────────────────────────────
  Shared notification center used by School Admin, Teacher, and Student
  roles (see router: SchoolAdminNotifications / TeachersNotifications /
  StudentNotifications all point here).

  Data note: the list and unread count are fetched from the backend
  (GET /notifications, GET /notifications/unread-count — see
  stores/notifications.js + services/api/notifications.js) and merged with
  realtime pushes over Laravel Echo (src/js/echoNotifications.js).
  Mark-read and mark-all-read persist via PATCH /notifications/{id}/read
  and PATCH /notifications/read-all. Delete and archive have no backend
  endpoint yet, so those stay session-local on the Pinia store.
-->
<template>
  <div class="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Notification Center</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
          <p class="mt-1 text-sm text-slate-500">Your latest alerts and updates across exams, students, teachers, and sessions.</p>
        </div>
        <AppButton :icon="CheckCheck" text="Mark all as read" variant="outline" size="sm" :disabled="!roleNotifications.length" @click="notificationStore.markAllRead()" />
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <AppStatCard label="Unread" :value="stats.unread" :icon="MailWarning" icon-bg="bg-[#D4AF37]/10" icon-color="text-[#D4AF37]" />
        <AppStatCard label="Today" :value="stats.today" :icon="CalendarClock" icon-bg="bg-blue-50" icon-color="text-blue-600" />
        <AppStatCard label="Announcements" :value="stats.announcements" :icon="Megaphone" icon-bg="bg-purple-50" icon-color="text-purple-600" />
        <AppStatCard label="System Alerts" :value="stats.system" :icon="ShieldAlert" icon-bg="bg-amber-50" icon-color="text-amber-600" />
        <AppStatCard label="Messages" :value="stats.messages" :icon="MessageSquare" icon-bg="bg-emerald-50" icon-color="text-emerald-600" />
      </div>

      <!-- Filters -->
      <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div class="relative lg:col-span-2">
            <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search notifications…"
              class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
          <AppSelect v-model="filters.category" placeholder="All Categories" :options="categoryOptions" />
          <AppSelect v-model="filters.readState" placeholder="Read & Unread" :options="[{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]" />
          <AppSelect v-model="filters.priority" placeholder="All Priorities" :options="[{ value: 'high', label: 'High Priority' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }]" />
          <AppSelect v-model="filters.date" placeholder="Any Time" :options="[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This Week' }]" />
        </div>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="text-xs font-medium text-slate-500 underline decoration-dotted transition hover:text-slate-700"
            @click="resetFilters"
          >Clear filters</button>
          <div class="ml-auto flex items-center gap-1.5 text-xs">
            <span class="text-slate-500">Sort:</span>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 font-medium transition"
              :class="filters.sort === 'newest' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="filters.sort = 'newest'"
            >Newest</button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 font-medium transition"
              :class="filters.sort === 'oldest' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="filters.sort = 'oldest'"
            >Oldest</button>
          </div>
        </div>
      </div>

      <!-- Bulk action bar -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        leave-active-class="transition-all duration-100 ease-in"
        enter-from-class="opacity-0 -translate-y-1"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="selectedIds.size" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3">
          <p class="text-sm font-medium text-slate-700">{{ selectedIds.size }} selected</p>
          <div class="flex flex-wrap items-center gap-2">
            <AppButton text="Mark Read" variant="outline" size="xs" @click="bulkMarkRead" />
            <AppButton text="Archive" variant="outline" size="xs" @click="bulkArchive" />
            <AppButton text="Delete" variant="danger" size="xs" @click="bulkDelete" />
            <button type="button" class="text-xs font-medium text-slate-500 hover:text-slate-700" @click="selectedIds = new Set()">Clear</button>
          </div>
        </div>
      </Transition>

      <!-- Select-all row -->
      <div v-if="filteredNotifications.length" class="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
          :checked="areAllFilteredSelected"
          @change="toggleSelectAll($event.target.checked)"
        />
        <span class="text-xs text-slate-500">Select all ({{ filteredNotifications.length }})</span>
      </div>

      <!-- Loading state -->
      <div v-if="notificationStore.isLoadingList && !filteredNotifications.length" class="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B1F3A]" aria-hidden="true" />
        Loading notifications…
      </div>

      <!-- Notification list -->
      <div v-else-if="filteredNotifications.length" class="space-y-3">
        <article
          v-for="notification in pagedNotifications"
          :key="notification.id"
          class="group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
          :class="notification.unread ? 'border-slate-200 bg-[#0B1F3A]/[0.03]' : 'border-slate-100 opacity-80'"
        >
          <span v-if="notification.unread" class="absolute inset-y-0 left-0 w-1 bg-[#D4AF37]" aria-hidden="true" />

          <div class="flex items-start gap-3 pl-2">
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
              :checked="selectedIds.has(notification.id)"
              @change="toggleSelect(notification.id, $event.target.checked)"
            />

            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="categoryMeta(notification.category).bg">
              <component :is="categoryMeta(notification.category).icon" class="h-5 w-5" :class="categoryMeta(notification.category).color" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="truncate text-sm" :class="notification.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'">{{ notification.title }}</h2>
                    <span v-if="notification.priority === 'high'" class="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">High</span>
                    <span v-else-if="notification.priority === 'low'" class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Low</span>
                    <span v-if="notification.unread" class="inline-flex items-center rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">New</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-600">{{ notification.description }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>{{ notification.sender }}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{{ notification.time }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <AppButton v-if="notification.link?.to" text="View" variant="outline" size="xs" @click="goTo(notification)" />
                <AppButton
                  :text="notification.unread ? 'Mark Read' : 'Mark Unread'"
                  variant="outline"
                  size="xs"
                  @click="notificationStore.markRead(notification.id, !notification.unread)"
                />
                <AppButton text="Delete" variant="danger" size="xs" @click="notificationStore.deleteNotification(notification.id)" />
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty state -->
      <AppEmptyState
        v-else
        :icon="hasActiveFilters ? SearchX : BellOff"
        :title="hasActiveFilters ? 'No matching notifications' : 'You\u2019re all caught up'"
        :description="hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'New alerts about exams, students, teachers, and sessions will show up here.'"
        class="py-16"
      >
        <template v-if="hasActiveFilters" #actions>
          <AppButton text="Clear Filters" variant="outline" size="sm" @click="resetFilters" />
        </template>
      </AppEmptyState>

      <!-- Pagination — only shown once the list is actually rendering and
           spans more than one page (kept outside the loading/list/empty
           v-if chain above since it's an independent, always-optional element). -->
      <PaginationControls
        v-if="!notificationStore.isLoadingList && totalFiltered > PER_PAGE"
        :page="currentPage"
        :start="paginationRange.start"
        :end="paginationRange.end"
        :total="totalFiltered"
        :per-page="PER_PAGE"
        @change="goToPage"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellOff, CalendarClock, CheckCheck, FileText, GraduationCap, MailWarning,
  Megaphone, MessageSquare, Search, SearchX, ShieldAlert, UserCog, Bell,
} from 'lucide-vue-next'
import AppButton from './AppButton.vue'
import AppSelect from './AppSelect.vue'
import AppStatCard from './AppStatCard.vue'
import AppEmptyState from './AppEmptyState.vue'
import PaginationControls from './components/PaginationControls.vue'
import { useNotificationStore } from './stores/notifications'
import { getAuthRole } from '../../js/lib/auth'

const router = useRouter()
const notificationStore = useNotificationStore()

const role = computed(() => getAuthRole() || 'student')
const roleNotifications = computed(() => notificationStore.notificationsForRole(role.value))

// Always fetch the latest from the server when the notification center is
// opened, rather than relying solely on whatever was primed at app boot.
onMounted(() => {
  void notificationStore.fetchNotificationsList()
})

// ── Category presentation ───────────────────────────────────────────────
const CATEGORY_META = {
  announcements: { icon: Megaphone, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Announcements' },
  system: { icon: ShieldAlert, bg: 'bg-amber-50', color: 'text-amber-600', label: 'System' },
  messages: { icon: MessageSquare, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Messages' },
  students: { icon: GraduationCap, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Students' },
  teachers: { icon: UserCog, bg: 'bg-indigo-50', color: 'text-indigo-600', label: 'Teachers' },
  exams: { icon: FileText, bg: 'bg-rose-50', color: 'text-rose-600', label: 'Exams' },
  general: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-500', label: 'General' },
}
const categoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META.general
const categoryOptions = Object.entries(CATEGORY_META).map(([value, meta]) => ({ value, label: meta.label }))

// ── Filters ──────────────────────────────────────────────────────────────
const filters = reactive({
  search: '',
  category: '',
  readState: '',
  priority: '',
  date: '',
  sort: 'newest',
})

const hasActiveFilters = computed(() =>
  !!(filters.search || filters.category || filters.readState || filters.priority || filters.date),
)

const resetFilters = () => {
  filters.search = ''
  filters.category = ''
  filters.readState = ''
  filters.priority = ''
  filters.date = ''
}

const isToday = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}
const isThisWeek = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return d >= weekAgo && d <= now
}

const filteredNotifications = computed(() => {
  const q = filters.search.trim().toLowerCase()
  let list = roleNotifications.value.filter((n) => {
    if (q && !(`${n.title} ${n.description}`.toLowerCase().includes(q))) return false
    if (filters.category && n.category !== filters.category) return false
    if (filters.readState === 'unread' && !n.unread) return false
    if (filters.readState === 'read' && n.unread) return false
    if (filters.priority && (n.priority || 'normal') !== filters.priority) return false
    if (filters.date === 'today' && !isToday(n.createdAt)) return false
    if (filters.date === 'week' && !isThisWeek(n.createdAt)) return false
    return true
  })
  list = [...list].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return filters.sort === 'oldest' ? aTime - bTime : bTime - aTime
  })
  return list
})

// ── Pagination ───────────────────────────────────────────────────────────
// The store now fetches the notification history in full (walking every
// backend page — see fetchNotificationsList() in stores/notifications.js),
// so search/category/unread filters above always run against the complete
// set. Pagination is then applied client-side on the *filtered* results,
// same pattern StudentsPage.vue/TeachersPage.vue already use.
const PER_PAGE = 20
const currentPage = ref(1)

const totalFiltered = computed(() => filteredNotifications.value.length)

const pagedNotifications = computed(() =>
  filteredNotifications.value.slice((currentPage.value - 1) * PER_PAGE, currentPage.value * PER_PAGE),
)

const paginationRange = computed(() => {
  if (!totalFiltered.value) return { start: 0, end: 0 }
  const start = (currentPage.value - 1) * PER_PAGE + 1
  const end = Math.min(currentPage.value * PER_PAGE, totalFiltered.value)
  return { start, end }
})

const goToPage = (page) => {
  const lastPage = Math.max(1, Math.ceil(totalFiltered.value / PER_PAGE))
  currentPage.value = Math.min(Math.max(1, page), lastPage)
}

// Changing a filter can shrink the result set out from under the current
// page (e.g. you're on page 3, then a search narrows it to one page) —
// snap back to page 1 whenever the filters themselves change...
watch(filters, () => { currentPage.value = 1 }, { deep: true })
// ...and clamp defensively if the total shrinks for any other reason
// (marking items read while an "unread" filter is active, deleting, etc.).
watch(totalFiltered, (total) => {
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE))
  if (currentPage.value > lastPage) currentPage.value = lastPage
})

// ── Summary stats ────────────────────────────────────────────────────────
const stats = computed(() => ({
  unread: roleNotifications.value.filter((n) => n.unread).length,
  today: roleNotifications.value.filter((n) => isToday(n.createdAt)).length,
  announcements: roleNotifications.value.filter((n) => n.category === 'announcements').length,
  system: roleNotifications.value.filter((n) => n.category === 'system').length,
  messages: roleNotifications.value.filter((n) => n.category === 'messages').length,
}))

// ── Selection & bulk actions ─────────────────────────────────────────────
const selectedIds = ref(new Set())

const areAllFilteredSelected = computed(() =>
  filteredNotifications.value.length > 0 && filteredNotifications.value.every((n) => selectedIds.value.has(n.id)),
)

const toggleSelect = (id, checked) => {
  const next = new Set(selectedIds.value)
  checked ? next.add(id) : next.delete(id)
  selectedIds.value = next
}

const toggleSelectAll = (checked) => {
  const next = new Set()
  if (checked) filteredNotifications.value.forEach((n) => next.add(n.id))
  selectedIds.value = next
}

const bulkMarkRead = () => {
  notificationStore.markManyRead(Array.from(selectedIds.value), false)
  selectedIds.value = new Set()
}
const bulkArchive = () => {
  notificationStore.archiveMany(Array.from(selectedIds.value), true)
  selectedIds.value = new Set()
}
const bulkDelete = () => {
  if (!confirm(`Delete ${selectedIds.value.size} notification(s)? This cannot be undone.`)) return
  notificationStore.deleteMany(Array.from(selectedIds.value))
  selectedIds.value = new Set()
}

const goTo = (notification) => {
  notificationStore.markRead(notification.id, false)
  router.push(notification.link.to)
}
</script>
