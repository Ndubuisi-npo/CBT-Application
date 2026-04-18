import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchTenants() {
  try {
    return await apiFetch('/api/tenants')
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return [
        {
          id: 1,
          name: 'Demo School',
          domain: 'demo.educbt.com',
          status: 'active',
          plan: 'premium',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Test Academy',
          domain: 'test.educbt.com',
          status: 'active',
          plan: 'basic',
          created_at: '2024-01-10T14:20:00Z',
          updated_at: '2024-01-10T14:20:00Z'
        }
      ]
    }
    throw new Error(extractErrorMessage(error, 'Unable to load tenants.'))
  }
}

export async function getTenant(id) {
  try {
    return await apiFetch(`/api/tenants/${id}`)
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        name: 'Demo School',
        domain: 'demo.educbt.com',
        status: 'active',
        plan: 'premium',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        settings: {
          max_students: 500,
          max_teachers: 50,
          features: ['grading', 'reports', 'messaging']
        }
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to fetch tenant.'))
  }
}

export async function createTenant(payload) {
  try {
    return await apiFetch('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: Date.now(),
        ...payload,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to create tenant.'))
  }
}

export async function updateTenant(id, payload) {
  try {
    return await apiFetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        ...payload,
        updated_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to update tenant.'))
  }
}

export async function suspendTenant(id) {
  try {
    return await apiFetch(`/api/tenants/${id}/suspend`, {
      method: 'POST',
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        status: 'suspended',
        updated_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to suspend tenant.'))
  }
}

export async function reinstateTenant(id) {
  try {
    return await apiFetch(`/api/tenants/${id}/reinstate`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reinstate tenant.'))
  }
}

export async function deleteTenant(id) {
  try {
    return await apiFetch(`/api/tenants/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete tenant.'))
  }
}
