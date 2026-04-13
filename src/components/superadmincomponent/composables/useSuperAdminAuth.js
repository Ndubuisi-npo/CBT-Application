import { ref } from 'vue'
import { loginSuperAdmin, getCurrentSuperAdmin, logoutSuperAdmin } from '../api/auth'
import { setApiToken } from '../../../js/lib/api'

const user = ref(null)
const token = ref('')
const loading = ref(false)

export function useSuperAdminAuth() {
  const login = async (payload) => {
    loading.value = true

    try {
      const response = await loginSuperAdmin(payload)
      user.value = response.user ?? response.admin ?? null
      token.value = response.token ?? response.access_token ?? ''
      setApiToken(token.value)
      return response
    } finally {
      loading.value = false
    }
  }

  const fetchCurrentUser = async () => {
    loading.value = true
    try {
      user.value = await getCurrentSuperAdmin()
      return user.value
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await logoutSuperAdmin()
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
    user.value = null
    token.value = ''
    setApiToken(null)
  }

  return {
    user,
    token,
    loading,
    login,
    logout,
    fetchCurrentUser,
  }
}
