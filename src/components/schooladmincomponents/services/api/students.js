import { apiFetch, extractErrorMessage, getTenantHandle } from '../../../../js/lib/api'

export async function getStudents(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/api/students?${queryString}` : '/api/students'

    return await apiFetch(url)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch students.'))
  }
}

export async function getStudent(id) {
  try {
    return await apiFetch(`/api/students/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch student.'))
  }
}

export async function saveStudent(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/students/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save student.'))
  }
}

export async function updateStudent(id, payload) {
  try {
    return await apiFetch(`/api/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update student.'))
  }
}

export async function createStudent(payload) {
  try {
    return await apiFetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create student.'))
  }
}

export async function revokeStudent(id) {
  try {
    return await apiFetch(`/api/students/${id}/revoke`, { method: 'PATCH' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to revoke student.'))
  }
}

export async function deleteStudent(id) {
  try {
    return await apiFetch(`/api/students/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete student.'))
  }
}

export async function toggleActive(id) {
  try {
    return await apiFetch(`/api/students/${id}/toggle-active`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to toggle student active status.'))
  }
}

const authHeaders = () => {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function importStudents(file, { dryRun = true, overwriteExisting = null } = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dry_run', dryRun ? 'true' : 'false')

    if (overwriteExisting !== null) {
      formData.append('overwrite_existing', overwriteExisting)
    }

    const headers = {
      ...authHeaders(),
    }

    const tenantHandle = getTenantHandle()
    if (tenantHandle) {
      headers['X-Tenant'] = tenantHandle
    }

    const response = await fetch('/api/students/import', {
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
    throw new Error(extractErrorMessage(error, 'Unable to import students.'))
  }
}

export async function getImportTemplate() {
  try {
    const headers = {
      ...authHeaders(),
    }

    const tenantHandle = getTenantHandle()
    if (tenantHandle) {
      headers['X-Tenant'] = tenantHandle
    }

    const response = await fetch('/api/students/import-template', {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || ''
      const body = contentType.includes('application/json') ? await response.json() : await response.text()
      throw new Error(extractErrorMessage(body, 'Unable to download import template.'))
    }

    return await response.blob()
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to download import template.'))
  }
}

export async function resetPassword(id) {
  try {
    return await apiFetch(`/api/students/${id}/reset-password`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reset student password.'))
  }
}

export async function restoreStudent(id) {
  try {
    return await apiFetch(`/api/students/${id}/restore`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to restore student.'))
  }
}
