import Echo from 'laravel-echo'
import { getAuthUser, getAuthRole, getAuthToken, getTenantSlug } from './lib/auth'
import { useNotificationStore } from '../components/shared/stores/notifications'

const buildChannelName = (user) => {
  if (!user || !user.id) return null

  const tenantSlug = getTenantSlug() || user.tenant_id || user.tenantId || user.tenant?.id
  return tenantSlug
    ? `tenant.${tenantSlug}.users.${user.id}`
    : `superadmin.${user.id}`
}

let activeChannelName = null

/**
 * Lazily instantiates window.Echo (deferred from bootstrap.js so the auth
 * token, only available after initializeAuthState(), is ready) and
 * subscribes the current user to their private notification channel.
 *
 * Guests must never reach this far: callers are expected to check
 * isAuthenticated()/getAuthUser() before invoking this (see main.js and
 * lib/auth.js's login()). The token/channelName guard below is a defensive
 * second line, not the primary gate, so it stays silent for the guest case
 * instead of warning.
 *
 * Safe to call multiple times (e.g. after login/logout) - it tears down any
 * previous subscription first.
 */
export function initializeRealtimeNotifications() {
  if (typeof window === 'undefined') return

  const token = getAuthToken()
  const user = getAuthUser()
  const channelName = buildChannelName(user)

  if (!token || !user || !channelName) {
    // No authenticated user - nothing to subscribe to. Not a warning: this
    // is the expected state for guests on public pages.
    return
  }

  // (Re)instantiate Echo so the auth header always reflects the current token.
  if (window.Echo) {
    try {
      if (activeChannelName) window.Echo.leave(activeChannelName)
      window.Echo.disconnect()
    } catch (error) {
      console.warn('[Realtime Notifications] Failed to tear down previous Echo connection:', error)
    }
  }

  if (!window.Pusher) {
    console.warn('[Realtime Notifications] window.Pusher is not available; check src/js/bootstrap.js.')
    return
  }

  try {
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: window.__PUSHER_APP_KEY__,
      cluster: window.__PUSHER_APP_CLUSTER__,
      forceTLS: true,
      authEndpoint: '/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    })

    const channel = window.Echo.private(channelName)

    channel.notification((notification) => {
      const notificationStore = useNotificationStore()
      const role = getAuthRole()
      const formatted = {
        id: notification.id || `${Date.now()}-${Math.random()}`,
        title: notification.title || notification.data?.title || notification.type || 'Notification',
        description: notification.message || notification.data?.message || notification.data?.body || '',
        category: notification.category || notification.data?.category || 'general',
        roles: role ? [role] : [],
        unread: true,
        time: notification.time || notification.data?.time || new Date().toLocaleTimeString(),
        createdAt: notification.created_at || notification.data?.created_at || new Date().toISOString(),
        priority: notification.priority || notification.data?.priority || 'normal',
        sender: notification.sender || notification.data?.sender || 'System',
        link: notification.link || notification.data?.link || { to: '/notifications' },
      }

      notificationStore.prependNotification(formatted)
    })

    activeChannelName = channelName
    console.info('[Realtime Notifications] Subscribed to channel', channelName)
  } catch (error) {
    console.warn('[Realtime Notifications] Failed to subscribe:', error)
  }
}

/** Destroys the realtime subscription and the Echo instance itself - call this on logout. */
export function teardownRealtimeNotifications() {
  if (typeof window === 'undefined' || !window.Echo) return
  try {
    if (activeChannelName) window.Echo.leave(activeChannelName)
    window.Echo.disconnect()
  } catch (error) {
    console.warn('[Realtime Notifications] Failed to disconnect Echo:', error)
  } finally {
    // The Echo instance must only exist for logged-in users - drop the
    // reference entirely rather than leaving a disconnected instance around
    // (it may still hold the previous user's auth token in its config).
    window.Echo = null
    activeChannelName = null
  }
}
