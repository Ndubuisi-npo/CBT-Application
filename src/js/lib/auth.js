import { apiFetch, clearApiState, setApiToken } from './api'

const STORAGE_KEY = 'cbt_auth'

function readAuthFromStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const authData = JSON.parse(raw)

    if (authData.expiresAt && Date.now() > authData.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return authData
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

let authState = {
  user: null,
  token: null,
  role: null,
  tenantSlug: null,
  expiresAt: null,
}

export function initializeAuthState() {
  const stored = readAuthFromStorage()

  if (stored) {
    authState = {
      user: stored.user,
      token: stored.token,
      role: stored.role,
      tenantSlug: stored.tenantSlug,
      expiresAt: stored.expiresAt,
    }
    setApiToken(stored.token)
  }
}

function persistAuth(authData) {
  if (typeof window === 'undefined') return

  const data = {
    user: authData.user,
    token: authData.token,
    role: authData.role,
    tenantSlug: authData.tenantSlug,
    expiresAt: authData.expiresAt,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.localStorage.setItem('authToken', authData.token)
}

function clearAuth() {
  authState = {
    user: null,
    token: null,
    role: null,
    tenantSlug: null,
    expiresAt: null,
  }

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem('authToken')
  }
}

export async function login(credentials) {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  const expiresAt = Date.now() + ((response.expires_in || 28800) * 1000)

  authState = {
    user: response.user ?? response.admin ?? null,
    token: response.token,
    role: response.role || 'super_admin',
    tenantSlug: response.tenant_slug || null,
    expiresAt,
  }

  persistAuth(authState)
  setApiToken(authState.token)

  return authState
}

export async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Logout API call failed - clear local state anyway
  }

  clearAuth()
  clearApiState()
}

export function getAuthUser() {
  return authState.user
}

export function getAuthRole() {
  return authState.role
}

export function getAuthToken() {
  return authState.token
}

export function getTenantSlug() {
  return authState.tenantSlug
}

export function isAuthenticated() {
  if (!authState.token) {
    return false
  }

  if (authState.expiresAt && Date.now() > authState.expiresAt) {
    clearAuth()
    return false
  }

  return true
}

export async function forgotPassword(email) {
  return await apiFetch('/api/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyOtp(email, otp) {
  return await apiFetch('/api/password/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export async function resetPassword(resetToken, password, passwordConfirmation) {
  return await apiFetch('/api/password/reset', {
    method: 'POST',
    body: JSON.stringify({
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    }),
  })
}

export function getAuthState() {
  return { ...authState }
}