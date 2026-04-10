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

export async function apiFetch(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
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

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}
