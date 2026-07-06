import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])

  const totalUnread = computed(() => notifications.value.filter((n) => n.unread).length)

  const unreadByRole = (role) =>
    notifications.value.filter((n) => n.unread && n.roles.includes(role)).length

  const unreadByCategory = (category, role = null) =>
    notifications.value.filter((n) => {
      const matchesCategory = n.category === category
      const matchesRole = role ? n.roles.includes(role) : true
      return n.unread && matchesCategory && matchesRole
    }).length

  const notificationsForRole = (role) =>
    notifications.value.filter((n) => n.roles.includes(role))

  const prependNotification = (notification) => {
    notifications.value.unshift(notification)
  }

  const markAllRead = () => {
    notifications.value.forEach((n) => {
      n.unread = false
    })
  }

  return {
    notifications,
    totalUnread,
    unreadByRole,
    unreadByCategory,
    notificationsForRole,
    prependNotification,
    markAllRead,
  }
})
