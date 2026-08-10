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

function normalizeAuthUser(response, fallbackUser = null) {
  return response?.user ?? response?.admin ?? response ?? fallbackUser
}

export function clearAuth() {
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
    timeoutMs: 30000,
    body: JSON.stringify({
      identifier: credentials.email || credentials.identifier,
      password: credentials.password,
    }),
  })

  const user = response.user ?? response.admin ?? response.profile ?? null
  const token = response.token ?? response.access_token ?? response.auth_token ?? null
  const role = response.role
    ?? user?.role
    ?? user?.role_name
    ?? user?.role?.name
    ?? null

  if (!token) {
    throw new Error('Login response did not include an authentication token.')
  }

  const expiresAt = Date.now() + ((response.expires_in || 28800) * 1000)

  authState = {
    user,
    token,
    role: role, 
    tenantSlug: response.tenant_slug || null,
    expiresAt,
  }

  persistAuth(authState)
  setApiToken(authState.token)

  // Reconnect realtime notifications for the newly authenticated user.
  // Dynamic import avoids a static circular dependency, since
  // echoNotifications.js itself imports getAuthUser/getAuthToken/etc. from
  // this module.
  try {
    const { initializeRealtimeNotifications } = await import('../echoNotifications')
    initializeRealtimeNotifications()
  } catch {
    // Realtime notifications are a non-critical enhancement - never block login on this.
  }

  return authState
}

export async function refreshAuthUser() {
  const response = await apiFetch('/api/auth/me')
  authState = {
    ...authState,
    user: normalizeAuthUser(response, authState.user),
  }
  persistAuth(authState)
  return authState.user
}

export async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Logout API call failed - clear local state anyway
  }

  // Destroy/disconnect Echo completely on logout. Centralized here (rather
  // than left to each caller) so every logout path - ProfileDropdown,
  // settings pages, forced-logout-after-password-change, exam leave, etc. -
  // is guaranteed to tear down the realtime connection.
  try {
    const { teardownRealtimeNotifications } = await import('../echoNotifications')
    teardownRealtimeNotifications()
  } catch {
    // Non-critical - never block logout on this.
  }

  clearAuth()
  clearApiState()
}

export function getAuthUser() {
  return authState.user
}

export function getDisplayName(user = null) {
  const u = user || authState.user
  if (!u) return 'Admin'

  const first = u?.first_name || u?.firstName || u?.user?.first_name || ''
  const last = u?.last_name || u?.lastName || u?.user?.last_name || ''

  const full = `${first} ${last}`.trim()
  if (full) return full

  return u?.name || u?.full_name || u?.email || 'Admin'
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
