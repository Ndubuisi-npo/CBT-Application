import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function checkHandle(handle) {
  try {
    return await apiFetch(`/api/onboarding/check-handle?handle=${encodeURIComponent(handle)}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to check handle availability.'))
  }
}

export async function registerOnboarding(payload) {
  try {
    return await apiFetch('/api/onboarding/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to complete registration.'))
  }
}
