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
    const body = {}

    body.class_level_id = payload.class_level_id || payload.className || payload.class || ''
    if (!body.class_level_id) throw new Error('class_level_id is required')

    body.content = (payload.content || payload.question_text || '').trim()
    if (!body.content) throw new Error('content is required')

    body.type = payload.type || 'Multiple Choice'

    if (payload.subject_id) body.subject_id = payload.subject_id
    else if (payload.subject) body.subject_id = payload.subject

    if (payload.default_marks !== undefined || payload.marks !== undefined || payload.points !== undefined) {
      body.default_marks = Number(payload.default_marks ?? payload.marks ?? payload.points)
    }


    // Always include options array
    body.options = Array.isArray(payload.options) ? payload.options : []

    return await apiFetch('/api/questions', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create question.'))
  }
}

export async function updateQuestion(id, payload) {
  try {
    // Use PUT per API spec; accept partial fields
    const body = {}
    if (payload.content !== undefined) body.content = payload.content
    if (payload.default_marks !== undefined) body.default_marks = payload.default_marks
    else if (payload.marks !== undefined) body.default_marks = payload.marks
    if (payload.image_url !== undefined) body.image_url = payload.image_url
    if (payload.is_active !== undefined) body.is_active = payload.is_active
    if (payload.status !== undefined) body.status = payload.status
    if (payload.subject_id !== undefined) body.subject_id = payload.subject_id
    else if (payload.subject !== undefined) body.subject_id = payload.subject
    if (payload.topic_id !== undefined) body.topic_id = payload.topic_id
    else if (payload.topic !== undefined) body.topic = payload.topic
    if (payload.class_level_id !== undefined) body.class_level_id = payload.class_level_id
    else if (payload.className !== undefined) body.class_level_id = payload.className
    // Always include options array if provided
    if (payload.options !== undefined) body.options = Array.isArray(payload.options) ? payload.options : []

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
    // payload: { question_id: string, marks_override?: number|null }
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
