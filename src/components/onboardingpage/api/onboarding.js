import { extractErrorMessage, unauthenticatedFetch } from '../../../js/lib/api'

export async function checkHandle(handle) {
  try {
    // Check handle availability by passing it as a query parameter
    const response = await unauthenticatedFetch('/api/super-admin/tenants', {
      params: { handle }
    })
    
    return {
      available: response.available,
      handle: handle
    }
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
