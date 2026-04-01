import { defineStore } from 'pinia'

export const useSuperAdminUiStore = defineStore('super-admin-ui', {
  state: () => ({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    isDarkMode: false,
    toasts: [],
  }),
  actions: {
    toggleSidebar() {
      if (window.innerWidth < 1024) {
        this.mobileSidebarOpen = !this.mobileSidebarOpen
        return
      }

      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },
    addToast(toast) {
      const item = {
        id: Date.now() + Math.random(),
        title: toast.title,
        message: toast.message,
        variant: toast.variant || 'success',
      }

      this.toasts = [item, ...this.toasts].slice(0, 4)
      window.setTimeout(() => {
        this.toasts = this.toasts.filter((entry) => entry.id !== item.id)
      }, 3200)
    },
  },
})
