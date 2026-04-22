/**
 * @deprecated These functions are deprecated. Use unified auth from '../../../../js/lib/auth' instead.
 *
 * Migration guide:
 * - loginSchoolAdmin() → import { login } from '../../../../js/lib/auth'
 * - getCurrentUser() → import { getAuthUser } from '../../../../js/lib/auth'
 * - logoutSchoolAdmin() → import { logout } from '../../../../js/lib/auth'
 */
import { apiFetch, extractErrorMessage, clearApiState } from '../../../../js/lib/api'

export async function loginSchoolAdmin(payload) {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    })

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
    clearApiState()
    throw new Error(extractErrorMessage(error, 'Logout failed.'))
  }
}
