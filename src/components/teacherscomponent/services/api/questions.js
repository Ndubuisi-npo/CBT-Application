import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'
import { isChoiceBased, isFillInBlank, buildOptionPayload, detectContentFormat } from '../../../../types/question'

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

/**
 * Create a question.
 *
 * Per the PDF:
 *   - MCQ/TrueFalse: options array with is_correct
 *   - FITB: options array WITHOUT is_correct (server treats all as acceptable answers)
 *
 * The caller must pass `type` as one of: 'mcq' | 'true_false' | 'fill_in_blank'
 */
export async function createQuestion(payload) {
  try {
    const type = payload.type || 'mcq'

    const content = (payload.content || payload.question_text || '').trim()
    const body = {
      type,
      content,
      class_level_id: payload.class_level_id || '',
      content_format: detectContentFormat(content),
    }

    if (!body.content) throw new Error('content is required')
    if (!body.class_level_id) throw new Error('class_level_id is required')

    if (payload.subject_id) body.subject_id = payload.subject_id

    if (payload.is_active !== undefined) body.is_active = payload.is_active
    if (payload.status !== undefined) body.status = payload.status

    // Build type-correct options payload
    const rawOptions = Array.isArray(payload.options) ? payload.options : []
    body.options = buildOptionPayload(type, rawOptions)

    return await apiFetch('/api/questions', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create question.'))
  }
}

/**
 * Update a question.
 * Applies the same type-based options logic as createQuestion.
 */
export async function updateQuestion(id, payload) {
  try {
    const body = {}

    if (payload.content !== undefined) {
      body.content = payload.content
      body.content_format = detectContentFormat(payload.content)
    }
    if (payload.type !== undefined) body.type = payload.type
    if (payload.image_url !== undefined) body.image_url = payload.image_url
    if (payload.is_active !== undefined) body.is_active = payload.is_active
    if (payload.status !== undefined) body.status = payload.status
    if (payload.subject_id !== undefined) body.subject_id = payload.subject_id
    if (payload.class_level_id !== undefined) body.class_level_id = payload.class_level_id

    // Type-aware options payload
    if (payload.options !== undefined) {
      const type = payload.type || 'mcq'
      const rawOptions = Array.isArray(payload.options) ? payload.options : []
      body.options = buildOptionPayload(type, rawOptions)
    }

    return await apiFetch(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update question.'))
  }
}

export async function addQuestionToExam(examId, payload) {
  try {
    const body = { question_id: payload.question_id }
    if (payload.marks_override !== undefined) body.marks_override = payload.marks_override
    return await apiFetch(`/api/exams/${examId}/questions`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to add question to exam.'))
  }
}

export async function updateExamQuestion(examId, questionId, payload) {
  try {
    const body = {}
    if (payload.marks_override !== undefined) body.marks_override = payload.marks_override
    return await apiFetch(`/api/exams/${examId}/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update exam question.'))
  }
}

export async function deleteQuestion(id) {
  try {
    return await apiFetch(`/api/questions/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete question.'))
  }
}

export async function cloneQuestionsFromTerm(payload) {
  try {
    return await apiFetch('/api/questions/clone-from-term', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to clone questions from term.'))
  }
}

export async function restoreQuestion(id) {
  try {
    return await apiFetch(`/api/questions/${id}/restore`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to restore question.'))
  }
}

export async function getTeacherSubjects(teacherId) {
  try {
    return await apiFetch(`/api/teachers/${teacherId}/subjects`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teacher subjects.'))
  }
}

export async function getTeacherClasses(teacherId) {
  try {
    return await apiFetch(`/api/teachers/${teacherId}/classes`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teacher classes.'))
  }
}
