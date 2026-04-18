import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getSessions() {
  try {
    return await apiFetch('/api/academic-sessions')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch academic sessions.'))
  }
}

export async function getSession(id) {
  try {
    return await apiFetch(`/api/academic-sessions/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch session.'))
  }
}

export async function saveSession(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/academic-sessions/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch('/api/academic-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save session.'))
  }
}

export async function updateSession(id, payload) {
  try {
    return await apiFetch(`/api/academic-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update session.'))
  }
}

export async function createSession(payload) {
  try {
    return await apiFetch('/api/academic-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create session.'))
  }
}

export async function deleteSession(id) {
  try {
    return await apiFetch(`/api/academic-sessions/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete session.'))
  }
}

export async function activateSession(id) {
  try {
    return await apiFetch(`/api/academic-sessions/${id}/set-current`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to activate session.'))
  }
}

export async function getTerms(sessionId) {
  try {
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch terms.'))
  }
}

export async function getTerm(sessionId, termId) {
  try {
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms/${termId}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch term.'))
  }
}

export async function saveTerm(sessionId, payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/academic-sessions/${sessionId}/terms/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save term.'))
  }
}

export async function deleteTerm(sessionId, termId) {
  try {
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms/${termId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete term.'))
  }
}

export async function activateTerm(sessionId, termId) {
  try {
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms/${termId}/set-current`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to activate term.'))
  }
}
