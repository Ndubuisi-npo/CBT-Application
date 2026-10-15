import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

/**
 * Add an option to a question.
 *
 * Per the PDF contract:
 *   - MCQ/TrueFalse: is_correct is accepted and required
 *   - FITB: is_correct MUST NOT be sent — server returns HTTP 422 if present
 *
 * Pass { type } in payload so we can strip is_correct for FITB.
 */
export async function createQuestionOption(questionId, payload) {
  try {
    const { type, ...rest } = payload
    const body = { ...rest }
    // Strip is_correct for fill_in_blank to prevent HTTP 422
    if (type === 'fill_in_blank') {
      delete body.is_correct
    }
    return await apiFetch(`/api/questions/${questionId}/options`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create question option.'))
  }
}

/**
 * Update an existing option.
 * Same is_correct stripping logic as createQuestionOption for FITB.
 */
export async function updateQuestionOption(questionId, optionId, payload) {
  try {
    const { type, ...rest } = payload
    const body = { ...rest }
    if (type === 'fill_in_blank') {
      delete body.is_correct
    }
    return await apiFetch(`/api/questions/${questionId}/options/${optionId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
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
