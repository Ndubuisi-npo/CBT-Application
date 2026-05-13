import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getStudents() {
  try {
    return await apiFetch('/api/students')
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

export async function importStudents(formData) {
  try {
    return await apiFetch('/api/students/import', {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to import students.'))
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
