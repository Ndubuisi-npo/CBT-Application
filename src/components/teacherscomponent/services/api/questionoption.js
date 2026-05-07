import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function createQuestionOption(questionId, payload) {
  try {
    return await apiFetch(`/api/questions/${questionId}/options`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create question option.'))
  }
}

export async function updateQuestionOption(questionId, optionId, payload) {
  try {
    return await apiFetch(`/api/questions/${questionId}/options/${optionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update question option.'))
  }
}

export async function deleteQuestionOption(questionId, optionId) {
  try {
    return await apiFetch(`/api/questions/${questionId}/options/${optionId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete question option.'))
  }
}

export async function reorderQuestionOptions(questionId, payload) {
  try {
    return await apiFetch(`/api/questions/${questionId}/options/reorder`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reorder question options.'))
  }
}
