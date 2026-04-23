import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchTenants() {
  try {
    return await apiFetch('/api/super-admin/tenants')
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        data: [
          {
            id: "1",
            name: 'Demo School',
            handle: 'demo',
            school_type: 'Secondary School',
            logo: null,
            is_active: true,
            contact: {
              email: 'demo@school.com',
              phone: '+234000000000',
              address: '123 Demo Street',
              city: 'Demo City',
              state: 'Demo State'
            },
            subscription: {
              status: 'active',
              plan: {
                id: 'plan-1',
                name: 'Premium'
              },
              trial_ends_at: '2024-02-15T10:30:00Z',
              ends_at: '2024-03-15T10:30:00Z'
            },
            onboarding_completed_at: '2024-01-15T10:30:00Z',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: "2",
            name: 'Test Academy',
            handle: 'test',
            school_type: 'Primary School',
            logo: null,
            is_active: true,
            contact: {
              email: 'test@academy.com',
              phone: '+234000000001',
              address: '456 Test Avenue',
              city: 'Test City',
              state: 'Test State'
            },
            subscription: {
              status: 'trial',
              plan: {
                id: 'plan-2',
                name: 'Basic'
              },
              trial_ends_at: '2024-02-10T14:20:00Z',
              ends_at: null
            },
            onboarding_completed_at: '2024-01-10T14:20:00Z',
            created_at: '2024-01-10T14:20:00Z'
          }
        ],
        links: {
          first: 'string',
          last: 'string',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          links: [],
          path: '/api/super-admin/tenants',
          per_page: 10,
          to: 2,
          total: 2
        }
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to load tenants.'))
  }
}

export async function getTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}`)
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        name: 'Demo School',
        handle: 'demo',
        school_type: 'Secondary School',
        logo: null,
        is_active: true,
        contact: {
          email: 'demo@school.com',
          phone: '+234000000000',
          address: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State'
        },
        subscription: {
          status: 'active',
          plan: {
            id: 'plan-1',
            name: 'Premium'
          },
          trial_ends_at: '2024-02-15T10:30:00Z',
          ends_at: '2024-03-15T10:30:00Z'
        },
        onboarding_completed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to fetch tenant.'))
  }
}

export async function createTenant(payload) {
  try {
    return await apiFetch('/api/super-admin/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: Date.now().toString(),
        name: payload.name,
        handle: payload.name.toLowerCase().replace(/\s+/g, '-'),
        school_type: 'Secondary School',
        logo: null,
        is_active: true,
        contact: {
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          state: payload.state
        },
        subscription: {
          status: 'trial',
          plan: {
            id: payload.plan_id,
            name: 'Trial Plan'
          },
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at: null
        },
        onboarding_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to create tenant.'))
  }
}

export async function updateTenant(id, payload) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        name: payload.name,
        handle: payload.name?.toLowerCase().replace(/\s+/g, '-') || 'demo',
        school_type: 'Secondary School',
        logo: null,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        contact: {
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          state: payload.state
        },
        subscription: {
          status: 'active',
          plan: {
            id: 'plan-1',
            name: 'Premium'
          },
          trial_ends_at: '2024-02-15T10:30:00Z',
          ends_at: '2024-03-15T10:30:00Z'
        },
        onboarding_completed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to update tenant.'))
  }
}

export async function suspendTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}/suspend`, {
      method: 'POST',
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        name: 'Demo School',
        handle: 'demo',
        school_type: 'Secondary School',
        logo: null,
        is_active: false,
        contact: {
          email: 'demo@school.com',
          phone: '+234000000000',
          address: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State'
        },
        subscription: {
          status: 'suspended',
          plan: {
            id: 'plan-1',
            name: 'Premium'
          },
          trial_ends_at: '2024-02-15T10:30:00Z',
          ends_at: '2024-03-15T10:30:00Z'
        },
        onboarding_completed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to suspend tenant.'))
  }
}

export async function reinstateTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}/reinstate`, {
      method: 'POST',
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        name: 'Demo School',
        handle: 'demo',
        school_type: 'Secondary School',
        logo: null,
        is_active: true,
        contact: {
          email: 'demo@school.com',
          phone: '+234000000000',
          address: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State'
        },
        subscription: {
          status: 'active',
          plan: {
            id: 'plan-1',
            name: 'Premium'
          },
          trial_ends_at: '2024-02-15T10:30:00Z',
          ends_at: '2024-03-15T10:30:00Z'
        },
        onboarding_completed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to reinstate tenant.'))
  }
}

export async function deleteTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete tenant.'))
  }
}
