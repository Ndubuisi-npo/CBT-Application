const DEFAULT_BASE_URL = 'https://cbt-application-ufyd.onrender.com'

// Root domain tenant subdomains are generated under, e.g. a handle of
// "greenfield" resolves to "greenfield.educbt.name.ng". Centralized here so
// nothing else in the frontend hardcodes a domain (localhost or otherwise).
export const TENANT_ROOT_DOMAIN = 'educbt.name.ng'

/**
 * Builds a full tenant URL for the given website handle, e.g.
 * buildTenantUrl('greenfield') -> 'https://greenfield.educbt.name.ng/login'
 * buildTenantUrl('greenfield', '/student/dashboard') -> 'https://greenfield.educbt.name.ng/student/dashboard'
 */
export function buildTenantUrl(handle, path = '/login') {
  const cleanHandle = (handle || '').trim().toLowerCase()
  if (!cleanHandle) return null

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `https://${cleanHandle}.${TENANT_ROOT_DOMAIN}${cleanPath}`
}

function normalizeOrigin(rawBaseUrl) {
  // In development, use /api (vite proxy handles it)
  // In production, use the full URL
  if (import.meta.env.DEV) {
    return ''
  }
  const value = (rawBaseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  return value
}

const origin = normalizeOrigin(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = origin

let authToken = ''
const DEFAULT_TIMEOUT_MS = 30000

function readStoredAuthToken() {
  if (typeof window === 'undefined') return ''
  const token = localStorage.getItem('authToken')
  return typeof token === 'string' ? token : ''
}

function syncAuthTokenFromStorage() {
  authToken = readStoredAuthToken()
  return authToken
}

// Initialize from localStorage on module load
export function initializeApiState() {
  syncAuthTokenFromStorage()
}

export function setApiToken(token) {
  authToken = token || ''
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }
}

export function clearApiState() {
  authToken = ''
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
  }
}

export function getApiToken() {
  return authToken || syncAuthTokenFromStorage()
}

export function getTenantHandle() {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname.split(':')[0]
  const parts = hostname.split('.')

  if (hostname.includes('localhost') || hostname.includes('127.')) {
    return parts.length > 1 && parts[0] !== 'www' ? parts[0] : null
  }

  return parts.length > 2 && parts[0] !== 'www' ? parts[0] : null
}

export async function apiFetch(path, options = {}) {
  const tenantHandle = getTenantHandle()
  const baseUrl = tenantHandle ? window.location.origin : API_BASE_URL

  // Serialize query params if provided
  let fullPath = path
  if (options.params && typeof options.params === 'object') {
    const qs = new URLSearchParams(
      Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) fullPath = `${path}?${qs}`
  }

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  }

  const isFormData = options.body instanceof FormData
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const activeToken = getApiToken()
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`
  }

  if (tenantHandle) {
    headers['X-Tenant'] = tenantHandle
  }

  const { params: _params, timeoutMs = DEFAULT_TIMEOUT_MS, responseType, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null

  let response
  try {
    response = await fetch(`${baseUrl}${fullPath}`, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal || controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please try again shortly.')
    }
    throw error
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }

  // Auto-logout on 401
  if (response.status === 401) {
    clearApiState()
    try {
      const { clearAuth } = await import('./auth')
      clearAuth()
    } catch {
      // Ignore cleanup failures and continue with the redirect flow.
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please log in again.')
  }

  if (responseType === 'blob') {
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : await response.text()
      const error = new Error(extractErrorMessage(data))
      error.status = response.status
      error.data = data
      throw error
    }
    return await response.blob()
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data))
    error.status = response.status
    error.data = data
    if (
      response.status === 403 &&
      /^\/api\/(?:questions|exams)(?:\/|$)/.test(path) &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new CustomEvent('cbt:authorization-forbidden', {
        detail: {
          message: 'You are not authorized to modify content for this class level or subject.',
          path,
        },
      }))
    }
    throw error
  }

  return data?.data ?? data
}

export async function unauthenticatedFetch(path, options = {}) {
  const tenantHandle = getTenantHandle()
  const baseUrl = tenantHandle ? window.location.origin : API_BASE_URL

  let fullPath = path
  if (options.params && typeof options.params === 'object') {
    const qs = new URLSearchParams(
      Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) fullPath = `${path}?${qs}`
  }

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  }

  const isFormData = options.body instanceof FormData
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const { params: _params, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null

  let response
  try {
    response = await fetch(`${baseUrl}${fullPath}`, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal || controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please try again shortly.')
    }
    throw error
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data))
    error.status = response.status
    error.data = data
    throw error
  }

  return data?.data ?? data
}

export function extractErrorMessage(error, fallback = 'Something went wrong.') {
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}

export function isNameTakenError(error) {
  if (!error) return false
  // Prefer explicit HTTP 409 Conflict
  if (typeof error.status === 'number' && error.status === 409) return true

  const msg = (error?.data?.message || error?.message || '') + ''
  const lower = msg.toLowerCase()
  if (!lower) return false

  return (
    lower.includes('taken') ||
    lower.includes('already exists') ||
    lower.includes('already taken') ||
    lower.includes('duplicate') ||
    lower.includes('already been taken')
  )
}
