import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchTenants() {
  try {
    return await apiFetch('/api/super-admin/tenants')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load tenants.'))
  }
}

export async function getTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}`)
  } catch (error) {
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
    throw new Error(extractErrorMessage(error, 'Unable to create tenant.'))
  }
}

export async function updateTenant(id, payload) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update tenant.'))
  }
}

export async function suspendTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}/suspend`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to suspend tenant.'))
  }
}

export async function reinstateTenant(id) {
  try {
    return await apiFetch(`/api/super-admin/tenants/${id}/reinstate`, {
      method: 'POST',
    })
  } catch (error) {
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
