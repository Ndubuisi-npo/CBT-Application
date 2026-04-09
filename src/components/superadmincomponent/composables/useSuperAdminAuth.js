import { ref } from 'vue'
import { loginSuperAdmin } from '../api/auth'
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

  return {
    user,
    token,
    loading,
    login,
  }
}
