import { apiFetch, extractErrorMessage, setApiToken, clearApiState } from '../lib/api'

/**
 * School User Authentication
 * POST /auth/login - School User authentication
 * Body: { email, password }
 * Returns: { token, user }
 */
export async function loginSchoolUser(payload) {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),

    })
    
    // Store token for subsequent requests
    if (response.token) {
      setApiToken(response.token)
    }
    
    return response
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Login failed.'))
  }
}

/**
 * GET /auth/me - Get current user profile, role, and permissions
 */
export async function getCurrentUserProfile() {
  try {
    return await apiFetch('/api/auth/me')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch user profile.'))
  }
}

/**
 * POST /auth/logout - Invalidate current user session
 */
export async function logoutSchoolUser() {
  try {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' })
    clearApiState()
    return response
  } catch (error) {
    clearApiState() // Clear anyway even if logout fails
    throw new Error(extractErrorMessage(error, 'Logout failed.'))
  }
}
