import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getQuestions(params = {}) {
  try {
    return await apiFetch('/api/questions', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch questions.'))
  }
}

export async function getQuestion(id) {
  try {
    return await apiFetch(`/api/questions/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch question.'))
  }
}

export async function createQuestion(payload) {
  try {
    return await apiFetch('/api/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create question.'))
  }
}

export async function updateQuestion(id, payload) {
  try {
    return await apiFetch(`/api/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update question.'))
  }
}

export async function deleteQuestion(id) {
  try {
    return await apiFetch(`/api/questions/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete question.'))
  }
}

export async function restoreQuestion(id) {
  try {
    return await apiFetch(`/api/questions/${id}/restore`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to restore question.'))
  }
}

