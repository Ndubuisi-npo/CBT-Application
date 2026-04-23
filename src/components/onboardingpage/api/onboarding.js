import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function checkHandle(handle) {
  try {
    // Get all tenants and check if handle exists
    const response = await apiFetch('/api/super-admin/tenants')
    
    // Tenants are directly in the response array, not in response.data
    const tenants = Array.isArray(response) ? response : response.data || []
    
    const handleExists = tenants.some(tenant => tenant.handle === handle)
    
    return {
      available: !handleExists,
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
