import { apiFetch, extractErrorMessage, getTenantHandle } from '../../../../js/lib/api'

export async function getTeachers(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/api/teachers?${queryString}` : '/api/teachers'
    return await apiFetch(url)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teachers.'))
  }
}

export async function getTeacher(id, params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/api/teachers/${id}?${queryString}` : `/api/teachers/${id}`
    return await apiFetch(url)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teacher.'))
  }
}

export async function saveTeacher(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/teachers/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save teacher.'))
  }
}

export async function updateTeacher(id, payload) {
  try {
    return await apiFetch(`/api/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update teacher.'))
  }
}

export async function createTeacher(payload) {
  try {
    return await apiFetch('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create teacher.'))
  }
}

export async function revokeTeacher(id) {
  try {
    return await apiFetch(`/api/teachers/${id}/revoke`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to revoke teacher.'))
  }
}

export async function deleteTeacher(id) {
  try {
    return await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete teacher.'))
  }
}

export async function toggleActive(id) {
  try {
    return await apiFetch(`/api/teachers/${id}/toggle-active`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to toggle teacher active status.'))
  }
}

export async function resetPassword(id) {
  try {
    return await apiFetch(`/api/teachers/${id}/reset-password`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reset teacher password.'))
  }
}

export async function restoreTeacher(id) {
  try {
    return await apiFetch(`/api/teachers/${id}/restore`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to restore teacher.'))
  }
}

const authHeaders = () => {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function importTeachers(file, { dryRun = true, overwriteExisting = null } = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dry_run', dryRun ? 'true' : 'false')

    if (overwriteExisting !== null) {
      const overwriteValue = overwriteExisting === 'update' || overwriteExisting === true ? 'true' : 'false'
      formData.append('overwrite_existing', overwriteValue)
    }

    const headers = {
      ...authHeaders(),
    }

    const tenantHandle = getTenantHandle()
    if (tenantHandle) {
      headers['X-Tenant'] = tenantHandle
    }

    const response = await fetch('/api/teachers/import', {
      method: 'POST',
      headers,
      body: formData,
    })

    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await response.json() : await response.text()

    return {
      ok: response.ok,
      status: response.status,
      body,
    }
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to import teachers.'))
  }
}

export async function getTeacherImportTemplate() {
  try {
    const headers = {
      ...authHeaders(),
    }

    const tenantHandle = getTenantHandle()
    if (tenantHandle) {
      headers['X-Tenant'] = tenantHandle
    }

    const response = await fetch('/api/teachers/import-template', {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || ''
      const body = contentType.includes('application/json') ? await response.json() : await response.text()
      throw new Error(extractErrorMessage(body, 'Unable to download teacher import template.'))
    }

    return await response.blob()
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to download teacher import template.'))
  }
}
