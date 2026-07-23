import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

/**
 * REST endpoints for the notifications feature. Prefixed with /api to match
 * every other service in the codebase (see e.g. services/api/activities.js,
 * services/api/students.js) — apiFetch() already attaches the bearer token,
 * tenant header, and unwraps a Laravel `{ data: ... }` envelope.
 *
 *   GET    /api/notifications
 *   GET    /api/notifications/unread-count
 *   PATCH  /api/notifications/{id}/read
 *   PATCH  /api/notifications/{id}/unread
 *   PATCH  /api/notifications/read-all
 *   DELETE /api/notifications/{id}
 */

/** Fetch the notification list (optionally paginated/filtered via params). */
export async function fetchNotifications(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications'
    return await apiFetch(url)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch notifications.'))
  }
}

/** Fetch just the unread count — cheap to poll, used for the bell badge. */
export async function fetchUnreadNotificationCount() {
  try {
    return await apiFetch('/api/notifications/unread-count')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch unread notification count.'))
  }
}

export async function markNotificationUnread(id) {
  try {
    return await apiFetch(`/api/notifications/${id}/unread`, { method: 'PATCH' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to mark notification as unread.'))
  }
}

/** Mark a single notification as read. */
export async function markNotificationRead(id) {
  try {
    return await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to mark notification as read.'))
  }
}

/** Mark every notification for the current user as read. */
export async function markAllNotificationsRead() {
  try {
    return await apiFetch('/api/notifications/read-all', { method: 'PATCH' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to mark all notifications as read.'))
  }
}

export async function deleteNotification(id) {
  try {
    return await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete notification.'))
  }
}