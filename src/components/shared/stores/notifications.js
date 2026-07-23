import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadNotificationCount as apiFetchUnreadCount,
  markNotificationRead as apiMarkNotificationRead,
  markNotificationUnread as apiMarkNotificationUnread,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
} from '../services/api/notifications'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { extractErrorMessage } from '../../../js/lib/api'

// Categories recognised by the redesigned Notifications UI. Anything else
// falls back to 'general' so unexpected backend categories don't break cards.
export const NOTIFICATION_CATEGORIES = ['announcements', 'system', 'messages', 'students', 'teachers', 'exams', 'general']

// Backend severity (`data.type`: success | danger | warning | info) doesn't
// map onto our category system (that's about *what* the notification is
// about — students/exams/etc. — which this backend doesn't send). Instead
// we use it to drive the priority badge, since "danger" notifications
// (e.g. account deactivated) genuinely deserve the "High" flag.
const SEVERITY_TO_PRIORITY = {
  danger: 'high',
  warning: 'high',
  success: 'normal',
  info: 'normal',
}

/**
 * Normalize a notification coming from the API into the shape the UI
 * expects.
 *
 * Confirmed real payload shape (Laravel's standard notifications table):
 *   {
 *     id: "538f0945-...",
 *     type: "App\\Notifications\\InAppNotification",   // PHP class name, not a UI category
 *     data: { title, message, type: "success"|"danger", action },
 *     read_at: null | "2026-...",
 *     created_at: "2026-07-15T17:38:36.000000Z",
 *     ...
 *   }
 *
 * There is no per-notification `category` or `roles` field — the backend
 * scopes the whole list to the authenticated user already, so `roles`
 * naturally comes out empty and is treated as "applies to everyone" by
 * matchesRole() above.
 */
function normalizeNotification(raw) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {}
  const severity = raw.priority || data.priority || data.type || null

  return {
    id: raw.id,
    title: raw.title || data.title || 'Notification',
    description: raw.message || data.message || data.body || raw.description || '',
    category: raw.category || data.category || 'general',
    roles: raw.roles || (data.role ? [data.role] : []),
    unread: raw.unread !== undefined ? !!raw.unread : raw.read_at == null,
    time: raw.time || (raw.created_at ? new Date(raw.created_at).toLocaleTimeString() : ''),
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    priority: SEVERITY_TO_PRIORITY[severity] || 'normal',
    sender: raw.sender || data.sender || 'System',
    link: raw.link || data.link || data.action || null,
    archived: !!raw.archived,
  }
}

/**
 * The list endpoint may come back as a bare array, a Laravel paginator
 * envelope (`{ current_page, data: [...], last_page, total, ... }` — this
 * is the confirmed real shape, apiFetch already unwraps one `{ data }`
 * level off the top), or a flatter `{ notifications: [...] }`. Handle all
 * three defensively, and — critically — surface the pagination metadata
 * instead of discarding it, so fetchNotificationsList() can walk every
 * page instead of silently stopping after the first 20.
 */
function extractListAndMeta(response) {
  if (Array.isArray(response)) {
    return { list: response, meta: null }
  }
  if (response && Array.isArray(response.data)) {
    const list = response.data
    return {
      list,
      meta: {
        currentPage: response.current_page ?? 1,
        lastPage: response.last_page ?? 1,
        perPage: response.per_page ?? list.length,
        total: response.total ?? list.length,
      },
    }
  }
  if (response && Array.isArray(response.notifications)) {
    return { list: response.notifications, meta: null }
  }
  return { list: [], meta: null }
}

/** The unread-count endpoint shape isn't fixed to a single key — read defensively. */
function extractCount(response) {
  if (typeof response === 'number') return response
  if (response && typeof response.count === 'number') return response.count
  if (response && typeof response.unread_count === 'number') return response.unread_count
  if (response && typeof response.total === 'number') return response.total
  return 0
}

/**
 * The backend's /notifications response is already scoped to the
 * authenticated user (no per-notification `roles` field is sent — see the
 * real payload shape this was built against). So a notification with an
 * empty `roles` array should be treated as "applies to whoever it belongs
 * to" rather than filtered out. Only exclude it if it explicitly lists
 * roles that don't include this one.
 */
function matchesRole(notification, role) {
  if (!role) return true
  if (!notification.roles || notification.roles.length === 0) return true
  return notification.roles.includes(role)
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])
  // Server-sourced unread count (GET /notifications/unread-count) — this is
  // the source of truth for the bell badge since it reflects notifications
  // the client may not have fetched into `notifications` yet.
  const unreadCount = ref(0)
  const isLoadingList = ref(false)
  const isLoadingCount = ref(false)
  const hasLoadedList = ref(false)
  // Server-reported total, kept mainly as a sanity check against
  // notifications.value.length after a full fetch (they should match).
  const serverTotal = ref(0)

  // Local, non-authoritative fallback (useful before the first fetch
  // resolves, or if the count endpoint is ever unavailable).
  const totalUnread = computed(() => (hasLoadedList.value || unreadCount.value > 0 ? unreadCount.value : notifications.value.filter((n) => n.unread && !n.archived).length))

  const unreadByRole = (role) =>
    notifications.value.filter((n) => n.unread && !n.archived && matchesRole(n, role)).length

  const unreadByCategory = (category, role = null) =>
    notifications.value.filter((n) => {
      const matchesCategory = n.category === category
      return n.unread && !n.archived && matchesCategory && matchesRole(n, role)
    }).length

  const notificationsForRole = (role) =>
    notifications.value.filter((n) => matchesRole(n, role) && !n.archived)

  function notifyError(message) {
    try {
      useSchoolAdminUiStore().addToast({ title: 'Notifications', message, variant: 'error' })
    } catch {
      // UI store unavailable (e.g. called outside a mounted app) — fail silently.
    }
  }

  /**
   * GET /notifications — fetch the *complete* notification list.
   *
   * The backend paginates (20/page by default). The Notifications page
   * does its own client-side search/category/unread filtering on top of
   * whatever's in `notifications.value` (same pattern StudentsPage.vue and
   * TeachersPage.vue already use for their lists), which only produces
   * correct results if the full history is loaded — otherwise a search
   * could miss matches that exist on page 2+. So this walks every page
   * the backend reports via `last_page` and concatenates them, rather
   * than keeping only the first page and silently dropping the rest.
   *
   * A safety cap (MAX_PAGES) guards against an unexpected/broken paginator
   * response causing a runaway loop.
   */
  const MAX_PAGES = 50 // 50 * 20/page = 1,000 notifications — a generous ceiling
  const fetchNotificationsList = async (params = {}) => {
    isLoadingList.value = true
    try {
      let page = 1
      let lastPage = 1
      const all = []

      do {
        const response = await apiFetchNotifications({ ...params, page })
        const { list, meta } = extractListAndMeta(response)
        all.push(...list)
        lastPage = meta?.lastPage ?? 1
        serverTotal.value = meta?.total ?? all.length
        page += 1
      } while (page <= lastPage && page <= MAX_PAGES)

      notifications.value = all.map(normalizeNotification).filter(Boolean)
      hasLoadedList.value = true
      return notifications.value
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load notifications.'))
      throw error
    } finally {
      isLoadingList.value = false
    }
  }

  /** GET /notifications/unread-count — refresh just the badge count. */
  const fetchUnreadCount = async () => {
    isLoadingCount.value = true
    try {
      const response = await apiFetchUnreadCount()
      unreadCount.value = extractCount(response)
      return unreadCount.value
    } catch {
      // Non-fatal — the bell just keeps showing its last known count.
      return unreadCount.value
    } finally {
      isLoadingCount.value = false
    }
  }

  /** Convenience: load both the list and the count together. */
  const initialize = async () => {
    await Promise.allSettled([fetchNotificationsList(), fetchUnreadCount()])
  }

  const prependNotification = (notification) => {
    notifications.value.unshift({
      priority: 'normal', // 'low' | 'normal' | 'high'
      sender: notification.sender || 'System',
      archived: false,
      unread: true,
      ...notification,
    })
    // A freshly-pushed realtime notification is unread by definition.
    unreadCount.value += 1
  }

  /**
   * PATCH /notifications/read-all
   * Optimistically clears everything locally, then confirms with the API.
   * On failure we re-sync the count from the server rather than trying to
   * guess which items should roll back.
   */
  const markAllRead = async () => {
    const previousCount = unreadCount.value
    notifications.value.forEach((n) => { n.unread = false })
    unreadCount.value = 0
    try {
      await apiMarkAllNotificationsRead()
    } catch (error) {
      unreadCount.value = previousCount
      notifyError(extractErrorMessage(error, 'Unable to mark all notifications as read.'))
      void fetchUnreadCount()
    }
  }

  /**
   * PATCH /notifications/{id}/read
   * PATCH /notifications/{id}/unread
   *
   * Signature kept backwards-compatible with the existing "Mark Read /
   * Mark Unread" toggle button: `unread` is the value to set.
   */
  const markRead = async (id, unread = false) => {
    const notification = notifications.value.find((n) => n.id === id)
    const wasUnread = notification?.unread

    if (unread) {
      // Marking back as unread — call the API endpoint.
      if (notification) notification.unread = true
      if (wasUnread === false) unreadCount.value += 1

      try {
        await apiMarkNotificationUnread(id)
      } catch (error) {
        if (notification) notification.unread = wasUnread ?? false
        if (wasUnread === false) unreadCount.value -= 1
        notifyError(extractErrorMessage(error, 'Unable to mark notification as unread.'))
      }
      return
    }

    if (notification) notification.unread = false
    if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)

    try {
      await apiMarkNotificationRead(id)
    } catch (error) {
      if (notification) notification.unread = wasUnread ?? true
      if (wasUnread) unreadCount.value += 1
      notifyError(extractErrorMessage(error, 'Unable to mark notification as read.'))
    }
  }

  /**
   * Bulk "mark read/unread" for a selected subset (used by the Notifications page
   * bulk-action bar). No dedicated bulk-subset endpoint exists, so this
   * calls PATCH /notifications/{id}/read or PATCH /notifications/{id}/unread
   * for each id and reconciles the count from the server if any of them fail.
   */
  const markManyRead = async (ids, unread = false) => {
    const idSet = new Set(ids)

    if (unread) {
      // Mark as unread - call API for each
      const targets = notifications.value.filter((n) => idSet.has(n.id) && !n.unread)
      targets.forEach((n) => { n.unread = true })
      unreadCount.value += targets.length

      const results = await Promise.allSettled(targets.map((n) => apiMarkNotificationUnread(n.id)))
      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length) {
        notifyError(`Unable to mark ${failures.length} notification(s) as unread.`)
        void fetchUnreadCount()
      }
      return
    }

    // Mark as read
    const targets = notifications.value.filter((n) => idSet.has(n.id) && n.unread)
    targets.forEach((n) => { n.unread = false })
    unreadCount.value = Math.max(0, unreadCount.value - targets.length)

    const results = await Promise.allSettled(targets.map((n) => apiMarkNotificationRead(n.id)))
    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length) {
      notifyError(`Unable to mark ${failures.length} notification(s) as read.`)
      void fetchUnreadCount()
    }
  }

  const deleteNotification = async (id) => {
    const notification = notifications.value.find((n) => n.id === id)
    const wasUnread = notification?.unread

    // Optimistically remove from local state
    notifications.value = notifications.value.filter((n) => n.id !== id)
    if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)

    try {
      await apiDeleteNotification(id)
    } catch (error) {
      // Roll back on failure
      if (notification) {
        notifications.value.push(notification)
        notifications.value.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        })
      }
      if (wasUnread) unreadCount.value += 1
      notifyError(extractErrorMessage(error, 'Unable to delete notification.'))
    }
  }

  const deleteMany = async (ids) => {
    const idSet = new Set(ids)
    const targets = notifications.value.filter((n) => idSet.has(n.id))
    const wasUnreadCount = targets.filter((n) => n.unread).length

    // Optimistically remove from local state
    notifications.value = notifications.value.filter((n) => !idSet.has(n.id))
    unreadCount.value = Math.max(0, unreadCount.value - wasUnreadCount)

    const results = await Promise.allSettled(targets.map((n) => apiDeleteNotification(n.id)))
    const failures = results.filter((r) => r.status === 'rejected')

    if (failures.length) {
      // Roll back failed deletions
      const failedIds = new Set()
      targets.forEach((n, i) => {
        if (results[i].status === 'rejected') failedIds.add(n.id)
      })

      const restored = targets.filter((n) => failedIds.has(n.id))
      notifications.value.push(...restored)
      notifications.value.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })

      const restoredUnreadCount = restored.filter((n) => n.unread).length
      unreadCount.value += restoredUnreadCount

      notifyError(`Unable to delete ${failures.length} notification(s).`)
    }
  }

  const archiveNotification = (id, archived = true) => {
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.archived = archived
  }

  const archiveMany = (ids, archived = true) => {
    const idSet = new Set(ids)
    notifications.value.forEach((n) => { if (idSet.has(n.id)) n.archived = archived })
  }

  return {
    notifications,
    unreadCount,
    isLoadingList,
    isLoadingCount,
    hasLoadedList,
    serverTotal,
    totalUnread,
    unreadByRole,
    unreadByCategory,
    notificationsForRole,
    fetchNotificationsList,
    fetchUnreadCount,
    initialize,
    prependNotification,
    markAllRead,
    markRead,
    markManyRead,
    deleteNotification,
    deleteMany,
    archiveNotification,
    archiveMany,
  }
})
