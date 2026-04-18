import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getTeachers() {
  try {
    return await apiFetch('/api/teachers')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teachers.'))
  }
}

export async function getTeacher(id) {
  try {
    return await apiFetch(`/api/teachers/${id}`)
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
    return await apiFetch(`/api/teachers/${id}/revoke`, { method: 'PATCH' })
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
