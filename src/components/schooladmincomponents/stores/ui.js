import { defineStore } from 'pinia'

export const useSchoolAdminUiStore = defineStore('school-admin-ui', {
  state: () => ({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    toasts: [],
  }),
  actions: {
    toggleSidebar() {
      if (window.innerWidth < 1024) {
        this.mobileSidebarOpen = !this.mobileSidebarOpen
        return
      }
      this.sidebarCollapsed = !this.sidebarCollapsed
      try {
        localStorage.setItem('sa_sidebar_collapsed', String(this.sidebarCollapsed))
      } catch {}
    },
    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },
    initSidebar() {
      try {
        const saved = localStorage.getItem('sa_sidebar_collapsed')
        if (saved !== null) this.sidebarCollapsed = saved === 'true'
      } catch {}
    },
    addToast(toast) {
      const item = {
        id: Date.now() + Math.random(),
        title: toast.title || '',
        message: toast.message || '',
        variant: toast.variant || 'success',
      }
      this.toasts = [item, ...this.toasts].slice(0, 5)
      window.setTimeout(() => {
        this.toasts = this.toasts.filter((entry) => entry.id !== item.id)
      }, 4000)
    },
    removeToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
