/**
 * @deprecated Use unified auth from '../../../js/lib/auth' instead.
 * This composable is kept for backward compatibility during migration.
 *
 * Migration guide:
 * - Import login/logout from '../../../js/lib/auth' directly
 * - Import getAuthUser() for current user
 * - Import getAuthRole() for user role
 *
 * Example:
 *   import { login, logout, getAuthUser, getAuthRole, isAuthenticated } from '../../../js/lib/auth'
 */
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
