const DEFAULT_BASE_URL = 'https://cbt-application-ufyd.onrender.com'

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

// Initialize from localStorage on module load
export function initializeApiState() {
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  if (savedToken) {
    authToken = savedToken
  }
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

function getTenantHandle() {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname.split(':')[0] // Strip port
  const parts = hostname.split('.')

  // Local dev: lek.localhost:3000 → "lek"
  if (hostname.includes('localhost') || hostname.includes('127.')) {
    return parts.length > 1 && parts[0] !== 'www' ? parts[0] : null
  }

  // Production: lek.yourapp.com → "lek"
  return parts.length > 2 && parts[0] !== 'www' ? parts[0] : null
}

export async function apiFetch(path, options = {}) {
  const tenantHandle = getTenantHandle()
  const baseUrl = tenantHandle ? window.location.origin : API_BASE_URL

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  
  if (tenantHandle) {
    headers['X-Tenant'] = tenantHandle // Fallback for central domain
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  // // Auto-logout on 401
  // if (response.status === 401) {
  //   clearApiState()
  //   const handle = getTenantHandle()
  //   const loginPath = handle ? `/${handle}/login` : '/super-admin/login'
  //   if (typeof window !== 'undefined') {
  //     window.location.href = loginPath
  //   }
  //   return
  // }

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
