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
      token.value = response.token ?? response.access_token ?? ''
      setApiToken(token.value)
      user.value = await fetchCurrentUser()
      return { ...response, user: user.value, role: user.value?.role ?? user.value?.type }
    } finally {
      loading.value = false
    }
  }

  const fetchCurrentUser = async () => {
    loading.value = true
    try {
      const response = await getCurrentSuperAdmin()
      user.value = response?.data ?? response?.user ?? response?.admin ?? response
      return user.value
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await logoutSuperAdmin()
    } catch (error) {
      // Logout API call failed
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
