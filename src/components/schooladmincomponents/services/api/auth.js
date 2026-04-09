import { apiFetch, extractErrorMessage, setTenantSlug, setApiToken, clearApiState } from '../../../../js/lib/api'

export async function loginSchoolAdmin(payload, tenantSlug) {
  try {
    if (tenantSlug) {
      setTenantSlug(tenantSlug)
    }
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipTenantHeader: true, // Login is public, doesn't need X-Tenant yet
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

export async function getCurrentUser() {
  try {
    return await apiFetch('/api/auth/me')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch user profile.'))
  }
}

export async function logoutSchoolAdmin() {
  try {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' })
    clearApiState()
    return response
  } catch (error) {
    clearApiState() // Clear anyway even if logout fails
    throw new Error(extractErrorMessage(error, 'Logout failed.'))
  }
}
