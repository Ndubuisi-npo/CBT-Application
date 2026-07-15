import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadNotificationCount as apiFetchUnreadCount,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
} from '../services/api/notifications'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { extractErrorMessage } from '../../../js/lib/api'

// Categories recognised by the redesigned Notifications UI. Anything else
// falls back to 'general' so unexpected backend categories don't break cards.
export const NOTIFICATION_CATEGORIES = ['announcements', 'system', 'messages', 'students', 'teachers', 'exams', 'general']

/**
 * Normalize a notification coming from the API into the shape the UI
 * expects. Laravel's default `notifications` table stores `type` + a JSON
 * `data` column + `read_at`, so we read from both that shape and a flatter
 * custom shape defensively (same tolerance echoNotifications.js already
 * uses for the realtime/pushed notifications, so REST and websocket items
 * end up looking identical in the store).
 */
function normalizeNotification(raw) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {}

  return {
    id: raw.id,
    title: raw.title || data.title || raw.type || 'Notification',
    description: raw.message || data.message || data.body || raw.description || '',
    category: raw.category || data.category || 'general',
    roles: raw.roles || (data.role ? [data.role] : []),
    unread: raw.unread !== undefined ? !!raw.unread : raw.read_at == null,
    time: raw.time || (raw.created_at ? new Date(raw.created_at).toLocaleTimeString() : ''),
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    priority: raw.priority || data.priority || 'normal',
    sender: raw.sender || data.sender || 'System',
    link: raw.link || data.link || null,
    archived: !!raw.archived,
  }
}

/**
 * The list endpoint may come back as a bare array, a Laravel API Resource
 * envelope (`{ data: [...] }` — already unwrapped once by apiFetch, but
 * paginated responses nest an extra level), or `{ notifications: [...] }`.
 * Handle all three defensively, same pattern used by the students/teachers
 * stores elsewhere in the app.
 */
function extractList(response) {
  if (Array.isArray(response)) return response
  if (response && Array.isArray(response.data)) return response.data
  if (response && Array.isArray(response.notifications)) return response.notifications
  return []
}

/** The unread-count endpoint shape isn't fixed to a single key — read defensively. */
function extractCount(response) {
  if (typeof response === 'number') return response
  if (response && typeof response.count === 'number') return response.count
  if (response && typeof response.unread_count === 'number') return response.unread_count
  if (response && typeof response.total === 'number') return response.total
  return 0
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

  // Local, non-authoritative fallback (useful before the first fetch
  // resolves, or if the count endpoint is ever unavailable).
  const totalUnread = computed(() => (hasLoadedList.value || unreadCount.value > 0 ? unreadCount.value : notifications.value.filter((n) => n.unread && !n.archived).length))

  const unreadByRole = (role) =>
    notifications.value.filter((n) => n.unread && !n.archived && n.roles.includes(role)).length

  const unreadByCategory = (category, role = null) =>
    notifications.value.filter((n) => {
      const matchesCategory = n.category === category
      const matchesRole = role ? n.roles.includes(role) : true
      return n.unread && !n.archived && matchesCategory && matchesRole
    }).length

  const notificationsForRole = (role) =>
    notifications.value.filter((n) => n.roles.includes(role) && !n.archived)

  function notifyError(message) {
    try {
      useSchoolAdminUiStore().addToast({ title: 'Notifications', message, variant: 'error' })
    } catch {
      // UI store unavailable (e.g. called outside a mounted app) — fail silently.
    }
  }

  /** GET /notifications — fetch the notification list. */
  const fetchNotificationsList = async (params = {}) => {
    isLoadingList.value = true
    try {
      const response = await apiFetchNotifications(params)
      notifications.value = extractList(response).map(normalizeNotification).filter(Boolean)
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
   *
   * Signature kept backwards-compatible with the existing "Mark Read /
   * Mark Unread" toggle button: `unread` is the value to set. There is no
   * "mark unread" endpoint, so switching back to unread is a local-only
   * UI action; only the read direction calls the API.
   */
  const markRead = async (id, unread = false) => {
    const notification = notifications.value.find((n) => n.id === id)
    const wasUnread = notification?.unread

    if (unread) {
      // Marking back as unread — no backend endpoint for this, local only.
      if (notification) notification.unread = true
      if (wasUnread === false) unreadCount.value += 1
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
   * Bulk "mark read" for a selected subset (used by the Notifications page
   * bulk-action bar). No dedicated bulk-subset endpoint exists, so this
   * calls PATCH /notifications/{id}/read for each id and reconciles the
   * count from the server if any of them fail.
   */
  const markManyRead = async (ids, unread = false) => {
    const idSet = new Set(ids)

    if (unread) {
      notifications.value.forEach((n) => { if (idSet.has(n.id)) n.unread = true })
      return
    }

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

  const deleteNotification = (id) => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  const deleteMany = (ids) => {
    const idSet = new Set(ids)
    notifications.value = notifications.value.filter((n) => !idSet.has(n.id))
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
