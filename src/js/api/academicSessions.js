import { apiFetch, extractErrorMessage } from '../lib/api'

/**
 * Academic Sessions Management
 * Protected Routes - Requires: Authorization: Bearer <token>
 */

/**
 * GET /api/academic-sessions - List all academic sessions
 */
export async function fetchAcademicSessions() {
  try {
    return await apiFetch('/api/academic-sessions')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load academic sessions.'))
  }
}

/**
 * POST /academic-sessions - Create a new session
 * Body: { name, start_date, end_date, ...etc }
 */
export async function createAcademicSession(payload) {
  try {
    return await apiFetch('/academic-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create academic session.'))
  }
}

/**
 * GET /academic-sessions/{id} - Get session details
 */
export async function getAcademicSession(id) {
  try {
    return await apiFetch(`/academic-sessions/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch academic session.'))
  }
}

/**
 * PATCH /academic-sessions/{id} - Update a session
 */
export async function updateAcademicSession(id, payload) {
  try {
    return await apiFetch(`/academic-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update academic session.'))
  }
}

/**
 * DELETE /academic-sessions/{id} - Delete a session
 */
export async function deleteAcademicSession(id) {
  try {
    return await apiFetch(`/academic-sessions/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete academic session.'))
  }
}

/**
 * POST /academic-sessions/{id}/set-current - Set as the active academic year
 */
export async function setCurrentAcademicSession(id) {
  try {
    return await apiFetch(`/academic-sessions/${id}/set-current`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to set current academic session.'))
  }
}

/**
 * Terms Management
 */

/**
 * GET /academic-sessions/{sessionId}/terms - List terms for a session
 */
export async function fetchSessionTerms(sessionId) {
  try {
    return await apiFetch(`/academic-sessions/${sessionId}/terms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load terms.'))
  }
}

/**
 * POST /academic-sessions/{sessionId}/terms - Create a term
 */
export async function createSessionTerm(sessionId, payload) {
  try {
    return await apiFetch(`/academic-sessions/${sessionId}/terms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create term.'))
  }
}

/**
 * PATCH /academic-sessions/{sessionId}/terms/{id} - Update a term
 */
export async function updateSessionTerm(sessionId, termId, payload) {
  try {
    return await apiFetch(`/academic-sessions/${sessionId}/terms/${termId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update term.'))
  }
}

/**
 * DELETE /academic-sessions/{sessionId}/terms/{id} - Delete a term
 */
export async function deleteSessionTerm(sessionId, termId) {
  try {
    return await apiFetch(`/academic-sessions/${sessionId}/terms/${termId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete term.'))
  }
}

/**
 * POST /academic-sessions/{sessionId}/terms/{id}/set-current - Set as the active term
 */
export async function setCurrentSessionTerm(sessionId, termId) {
  try {
    return await apiFetch(`/academic-sessions/${sessionId}/terms/${termId}/set-current`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to set current term.'))
  }
}
