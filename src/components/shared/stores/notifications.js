import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Categories recognised by the redesigned Notifications UI. Anything else
// falls back to 'general' so unexpected backend categories don't break cards.
export const NOTIFICATION_CATEGORIES = ['announcements', 'system', 'messages', 'students', 'teachers', 'exams', 'general']

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])

  const totalUnread = computed(() => notifications.value.filter((n) => n.unread && !n.archived).length)

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

  const prependNotification = (notification) => {
    notifications.value.unshift({
      priority: 'normal', // 'low' | 'normal' | 'high'
      sender: notification.sender || 'System',
      archived: false,
      ...notification,
    })
  }

  const markAllRead = () => {
    notifications.value.forEach((n) => {
      n.unread = false
    })
  }

  const markRead = (id, unread = false) => {
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.unread = unread
  }

  const markManyRead = (ids, unread = false) => {
    const idSet = new Set(ids)
    notifications.value.forEach((n) => { if (idSet.has(n.id)) n.unread = unread })
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
    totalUnread,
    unreadByRole,
    unreadByCategory,
    notificationsForRole,
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
