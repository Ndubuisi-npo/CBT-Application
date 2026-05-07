import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getExams(params = {}) {
  try {
    return await apiFetch('/api/exams', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch exams.'))
  }
}

export async function getExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch exam.'))
  }
}

export async function createExam(payload) {
  try {
    return await apiFetch('/api/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create exam.'))
  }
}

export async function updateExam(id, payload) {
  try {
    return await apiFetch(`/api/exams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update exam.'))
  }
}

export async function deleteExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete exam.'))
  }
}

export async function publishExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}/publish`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to publish exam.'))
  }
}

export async function unpublishExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}/unpublish`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to unpublish exam.'))
  }
}

export async function generateQuestions(payload) {
  try {
    return await apiFetch('/api/exams/generate-questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to generate questions.'))
  }
}

export async function getExamResults(id) {
  try {
    return await apiFetch(`/api/exams/${id}/results`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch exam results.'))
  }
}
