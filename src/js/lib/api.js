const DEFAULT_BASE_URL = 'https://your-central-domain.onrender.com'

function normalizeOrigin(rawBaseUrl) {
  const value = (rawBaseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  return value
}

const origin = normalizeOrigin(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = origin

let authToken = ''
let tenantSlug = ''

// Initialize from localStorage on module load
export function initializeApiState() {
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const savedTenant = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null
  
  if (savedToken) {
    authToken = savedToken
  }
  if (savedTenant) {
    tenantSlug = savedTenant
  }
}

export function setApiToken(token) {
  authToken = token || ''
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('authToken', token)
  }
}

export function setTenantSlug(slug) {
  tenantSlug = slug || ''
  if (typeof window !== 'undefined' && slug) {
    localStorage.setItem('tenantSlug', slug)
  }
}

export function clearApiState() {
  authToken = ''
  tenantSlug = ''
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('tenantSlug')
  }
}

export async function apiFetch(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  // Allow skipping tenant header for public endpoints
  if (tenantSlug && !options.skipTenantHeader) {
    headers['X-Tenant'] = tenantSlug
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data, 'Something went wrong.'))
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

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}
