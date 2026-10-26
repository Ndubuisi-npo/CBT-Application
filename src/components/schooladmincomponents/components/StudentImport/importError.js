export function getImportError(error, fallback) {
  let payload = error?.response?.data ?? error?.data ?? error?.body ?? error
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      return { message: payload.trim() || fallback, details: [] }
    }
  }

  const message = [
    payload?.message,
    payload?.error,
    error?.message,
  ].find((value) => typeof value === 'string' && value.trim()) || fallback

  const validationErrors = payload?.errors ?? error?.errors
  const details = []
  const appendDetails = (value, prefix = '') => {
    if (typeof value === 'string' && value.trim()) {
      details.push(prefix ? `${prefix}: ${value}` : value)
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => appendDetails(item, prefix))
      return
    }
    if (!value || typeof value !== 'object') return

    const rowPrefix = value.row !== undefined ? `Row ${value.row}` : prefix
    const nestedErrors = value.errors
    if (nestedErrors && typeof nestedErrors === 'object') {
      for (const [field, fieldErrors] of Object.entries(nestedErrors)) {
        appendDetails(fieldErrors, [rowPrefix, field].filter(Boolean).join(' · '))
      }
      return
    }

    for (const [field, fieldErrors] of Object.entries(value)) {
      appendDetails(fieldErrors, [rowPrefix, field].filter(Boolean).join(' · '))
    }
  }
  appendDetails(validationErrors)

  return { message, details }
}
