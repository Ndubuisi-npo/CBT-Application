import { defineStore } from 'pinia'
import { loginSuperAdmin } from '../services/api/auth'

export const useSuperAdminAuthStore = defineStore('super-admin-auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
  }),
  actions: {
    async login(payload) {
      this.loading = true
      try {
        const response = await loginSuperAdmin(payload)
        this.user = response.user
        this.token = response.token
        return response
      } finally {
        this.loading = false
      }
    },
  },
})
