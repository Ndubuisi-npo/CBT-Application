import { apiFetch, extractErrorMessage, setApiToken, clearApiState } from '../../../js/lib/api'

export async function loginSuperAdmin(payload) {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    
    // Store token for authenticated requests
    if (response.token) {
      setApiToken(response.token)
    }
    
    return response
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Login failed.'))
  }
}

export async function getCurrentSuperAdmin() {
  try {
    return await apiFetch('/api/auth/me')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch admin profile.'))
  }
}

export async function logoutSuperAdmin() {
  try {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' })
    clearApiState()
    return response
  } catch (error) {
    clearApiState() // Clear anyway even if logout fails
    throw new Error(extractErrorMessage(error, 'Logout failed.'))
  }
}
