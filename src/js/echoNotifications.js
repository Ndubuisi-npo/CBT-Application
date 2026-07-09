import { getAuthUser, getAuthRole, getTenantSlug } from './lib/auth'
import { useNotificationStore } from '../components/shared/stores/notifications'

const buildChannelName = (user) => {
  if (!user || !user.id) return null

  const tenantSlug = getTenantSlug() || user.tenant_id || user.tenantId || user.tenant?.id
  return tenantSlug
    ? `tenant.${tenantSlug}.users.${user.id}`
    : `superadmin.${user.id}`
}

export function initializeRealtimeNotifications() {
  if (typeof window === 'undefined' || !window.Echo) {
    console.warn('[Realtime Notifications] window.Echo is not available.')
    return
  }

  const user = getAuthUser()
  const channelName = buildChannelName(user)

  if (!channelName) {
    console.warn('[Realtime Notifications] No authenticated user available to subscribe notifications.')
    return
  }

  try {
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

    console.info('[Realtime Notifications] Subscribed to channel', channelName)
  } catch (error) {
    console.warn('[Realtime Notifications] Failed to subscribe:', error)
  }
}
