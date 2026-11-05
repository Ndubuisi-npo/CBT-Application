import { getApiToken, getTenantHandle } from '../../../../js/lib/api'
import { getImportProgressCount } from './importProgress'

function parseFrameData(data) {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Consume the import progress server-sent event stream.
 *
 * EventSource cannot send the Authorization / X-Tenant headers this API needs,
 * so the frames are read from a normal fetch() body stream instead.
 *
 * @param {string} importJobId
 * @param {{ onUpdate?: (payload: object) => void, onDone?: (payload: object) => void, onError?: (error: Error) => void }} handlers
 * @returns {() => void} unsubscribe
 */
export function subscribeToImportProgress(importJobId, { onUpdate, onDone, onError } = {}) {
  if (!importJobId) return () => {}

  const controller = new AbortController()
  const headers = { Accept: 'text/event-stream' }
  const token = getApiToken()
  const tenantHandle = getTenantHandle()

  if (token) headers.Authorization = `Bearer ${token}`
  if (tenantHandle) headers['X-Tenant'] = tenantHandle

  const handleFrame = (event, rawData) => {
    const payload = parseFrameData(rawData)
    if (!payload) return false

    if (event === 'done' || event === 'complete' || event === 'completed') {
      onDone?.(payload)
      return true
    }

    if (event === 'error' || event === 'failed') {
      onError?.(new Error(payload.message || 'The import job failed.'))
      return true
    }

    if (getImportProgressCount(payload) !== null || event === 'progress' || event === 'snapshot' || event === 'message') {
      onUpdate?.(payload)
    }

    return false
  }

  ;(async () => {
    const response = await fetch(`/api/imports/${encodeURIComponent(importJobId)}/stream`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })

    if (!response.ok || !response.body) {
      throw new Error(`Could not follow the import progress (HTTP ${response.status}).`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const processFrame = (chunk) => {
      let event = 'message'
      const dataLines = []

      for (const line of chunk.split(/\r\n|\r|\n/)) {
        if (line.startsWith(':')) continue

        const separator = line.indexOf(':')
        const field = separator === -1 ? line : line.slice(0, separator)
        const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '')

        if (field === 'event') event = value
        else if (field === 'data') dataLines.push(value)
      }

      return dataLines.length > 0 && handleFrame(event, dataLines.join('\n'))
    }

    const processAvailableFrames = () => {
      const boundaryPattern = /\r\n\r\n|\n\n|\r\r/
      let boundary = boundaryPattern.exec(buffer)

      while (boundary) {
        const chunk = buffer.slice(0, boundary.index)
        buffer = buffer.slice(boundary.index + boundary[0].length)
        if (processFrame(chunk)) return true
        boundary = boundaryPattern.exec(buffer)
      }

      return false
    }

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      if (processAvailableFrames()) {
        controller.abort()
        return
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) processFrame(buffer)
  })().catch((error) => {
    if (error?.name !== 'AbortError') onError?.(error)
  })

  return () => controller.abort()
}
