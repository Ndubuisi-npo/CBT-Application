import { defineStore } from 'pinia'
import { loginSchoolAdmin, logoutSchoolAdmin } from '../services/api/auth'
import { setApiToken, setTenantSlug } from '../../../js/lib/api'

const STORAGE_KEY = 'school-admin-auth'

const readPersistedAuth = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      tenant: null,
    }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      user: null,
      token: null,
      tenant: null,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return {
      user: null,
      token: null,
      tenant: null,
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
          tenant: this.tenant,
        }),
      )
    },
    async login(payload, tenantSlug) {
      this.loading = true
      try {
        const response = await loginSchoolAdmin(payload, tenantSlug)
        this.user = response.user
        this.token = response.token
        this.tenant = response.tenant
        setApiToken(this.token)
        if (this.tenant?.slug) {
          setTenantSlug(this.tenant.slug)
        } else if (tenantSlug) {
          setTenantSlug(tenantSlug)
        }
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
      this.tenant = null
      setApiToken(null)
      setTenantSlug(null)

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
