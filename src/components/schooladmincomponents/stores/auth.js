import { defineStore } from 'pinia'
import { loginSchoolAdmin, logoutSchoolAdmin } from '../services/api/auth'
import { setApiToken } from '../../../js/lib/api'

const STORAGE_KEY = 'school-admin-auth'

const readPersistedAuth = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
    }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      user: null,
      token: null,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return {
      user: null,
      token: null,
    }
  }
}

export const useSchoolAdminAuthStore = defineStore('school-admin-auth', {
  state: () => ({
    ...readPersistedAuth(),
    loading: false,
  }),
  actions: {
    persist() {
      if (typeof window === 'undefined') return

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: this.user,
          token: this.token,
        }),
      )
    },
    async login(payload) {
      this.loading = true
      try {
        const response = await loginSchoolAdmin(payload)
        this.user = response.user
        this.token = response.token
        setApiToken(this.token)
        this.persist()
        return response
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await logoutSchoolAdmin()
      } catch (error) {
        console.error('Logout API call failed:', error)
      }
      this.user = null
      this.token = null
      setApiToken(null)

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
