import { apiFetch, extractErrorMessage } from '../lib/api'

/**
 * Subjects & Teacher Assignments
 * Protected Routes - Requires: Authorization: Bearer <token>
 */

/**
 * GET /api/subjects - List all subjects
 */
export async function fetchSubjects() {
  try {
    return await apiFetch('/api/subjects')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load subjects.'))
  }
}

/**
 * POST /api/subjects - Create a new subject
 */
export async function createSubject(payload) {
  try {
    return await apiFetch('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create subject.'))
  }
}

/**
 * GET /api/subjects/{id} - Get subject details
 */
export async function getSubject(id) {
  try {
    return await apiFetch(`/api/subjects/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch subject.'))
  }
}

/**
 * PATCH /api/subjects/{id} - Update a subject
 */
export async function updateSubject(id, payload) {
  try {
    return await apiFetch(`/api/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update subject.'))
  }
}

/**
 * DELETE /api/subjects/{id} - Delete a subject
 */
export async function deleteSubject(id) {
  try {
    return await apiFetch(`/api/subjects/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete subject.'))
  }
}

/**
 * POST /api/subjects/{id}/assign-teacher - Assign a teacher to a subject
 */
export async function assignTeacherToSubject(subjectId, payload) {
  try {
    return await apiFetch(`/api/subjects/${subjectId}/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to assign teacher to subject.'))
  }
}

/**
 * DELETE /api/subjects/{id}/assignments/{assignmentId} - Remove a teacher assignment
 */
export async function removeTeacherAssignment(subjectId, assignmentId) {
  try {
    return await apiFetch(`/api/subjects/${subjectId}/assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to remove teacher assignment.'))
  }
}
