import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getSubjects() {
  try {
    return await apiFetch('/api/subjects')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch subjects.'))
  }
}

export async function getSubject(id) {
  try {
    return await apiFetch(`/api/subjects/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch subject.'))
  }
}

export async function saveSubject(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/subjects/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save subject.'))
  }
}

export async function deleteSubject(id) {
  try {
    return await apiFetch(`/api/subjects/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete subject.'))
  }
}

export async function assignTeacher(subjectId, payload) {
  try {
    return await apiFetch(`/api/subjects/${subjectId}/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to assign teacher.'))
  }
}

export async function removeAssignment(subjectId, assignmentId) {
  try {
    return await apiFetch(`/api/subjects/${subjectId}/assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to remove assignment.'))
  }
}
