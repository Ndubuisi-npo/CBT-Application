import { apiFetch } from '../../../../js/lib/api'
import { buildAnswerPayload } from '../../../../types/question'

const getQuestionCountValue = (exam = {}) => {
  const explicit = [
    exam.question_count,
    exam.questions_count,
    exam.questionsCount,
    exam.questionCount,
    exam.total_questions,
    exam.totalQuestions,
  ].find((value) => value != null && value !== '')

  if (explicit != null && explicit !== '') {
    const parsed = Number(explicit)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return Array.isArray(exam.questions) ? exam.questions.length : 0
}

const normalizeExam = (exam = {}) => ({
  ...exam,
  id: exam.id,
  title: exam.title || exam.name || 'Exam',
  subject: exam.subject?.name || exam.subject || exam.subject_name || exam.subjectTitle || '',
  className: exam.class_arm?.name || exam.class_arm_name || exam.class_name || exam.className || exam.class || '',
  duration: Number(exam.duration_minutes || exam.duration || exam.durationMinutes || exam.time_limit || 0) || 0,
  status: exam.status || (exam.is_active ? 'Live' : 'Draft') || 'Draft',
  instructions: exam.instructions || exam.instructions_text || exam.instruction || '',
  remaining_attempts: exam.remaining_attempts ?? exam.remainingAttempts ?? exam.remaining_attempts_count ?? null,
  start_time: exam.start_time || exam.startTime || exam.scheduled_start || null,
  question_count: getQuestionCountValue(exam),
  questionCount: getQuestionCountValue(exam),
  questions: Array.isArray(exam.questions) ? exam.questions : [],
})

const getExamPayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') return null

  if (payload.exam && typeof payload.exam === 'object') return payload.exam

  if (payload.data && typeof payload.data === 'object') {
    if (payload.data.exam && typeof payload.data.exam === 'object') return payload.data.exam
    if (payload.data.id || payload.data.title || payload.data.instructions || payload.data.question_count != null) {
      return payload.data
    }
  }

  if (payload.id || payload.title || payload.instructions || payload.question_count != null || payload.questions != null) {
    return payload
  }

  return null
}

export async function getAvailableExams(params = {}) {
  const response = await apiFetch('/api/student/exams/available', { params })
  const exams = Array.isArray(response) ? response : response?.data || []
  return exams.map(normalizeExam)
}

export async function getStudentExam(examId) {
  try {
    const single = await apiFetch(`/api/student/exams/${examId}`)
    const examPayload = getExamPayload(single)
    if (examPayload) {
      return normalizeExam(examPayload)
    }
  } catch {
    // Fall through to available list lookup
  }

  const response = await apiFetch('/api/student/exams/available')
  const exams = Array.isArray(response) ? response : response?.data || []
  const found = exams.find((e) => String(e.id) === String(examId))
  if (!found) throw new Error('Exam not found or not available.')
  return normalizeExam(found)
}

export async function startStudentExam(examId) {
  return await apiFetch(`/api/student/exams/${examId}/start`, { method: 'POST' })
}

export async function getStudentExamAttempt(examId) {
  return await apiFetch(`/api/student/exams/${examId}/attempt`)
}

export async function getStudentExamQuestions(attemptId) {
  const response = await apiFetch(`/api/student/exams/attempts/${attemptId}/questions`)
  return Array.isArray(response) ? response : response?.data || []
}

/**
 * Save a single answer.
 *
 * Per the PDF contract:
 *   - MCQ/TrueFalse: send { selected_option_ids, time_spent_seconds }
 *   - FITB:          send { text_answer, time_spent_seconds }
 * Never include both keys — server returns HTTP 422.
 *
 * @param {string} attemptId
 * @param {string} questionId
 * @param {{ type: string, answer: string|string[]|null, time_spent_seconds?: number }} payload
 */
export async function saveStudentAnswer(attemptId, questionId, payload) {
  const { type, answer, time_spent_seconds } = payload

  // Build type-correct payload — prevents 422 errors
  const body = buildAnswerPayload(type, answer, time_spent_seconds ?? null)

  return await apiFetch(`/api/student/exams/attempts/${attemptId}/answers/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/**
 * Bulk-save answers.
 *
 * Validates each answer in the array against its question's type before sending.
 * A single offending item would fail the entire batch (per PDF spec).
 *
 * @param {string} attemptId
 * @param {Array<{ question_id: string, type: string, answer: string|string[]|null, time_spent_seconds?: number }>} answers
 */
export async function bulkSaveAnswers(attemptId, answers) {
  const body = {
    answers: answers.map(({ question_id, type, answer, time_spent_seconds }) => ({
      question_id,
      ...buildAnswerPayload(type, answer, time_spent_seconds ?? null),
    })),
  }
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/bulk-save`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getTimeRemaining(attemptId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/time-remaining`)
}

export async function submitStudentAttempt(attemptId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/submit`, { method: 'POST' })
}

export async function flagQuestion(attemptId, questionId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/flag/${questionId}`, {
    method: 'POST',
  })
}

export async function getAttemptResult(attemptId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/result`)
}
