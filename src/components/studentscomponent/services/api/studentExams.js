import { apiFetch } from '../../../../js/lib/api'

const normalizeExam = (exam = {}) => ({
  ...exam,                                    // preserve all raw fields (class_level, scheduled_start, etc.)
  id: exam.id,
  title: exam.title || exam.name || 'Exam',
  subject: exam.subject?.name || exam.subject || exam.subject_name || exam.subjectTitle || '',
  className: exam.class_arm?.name || exam.class_arm_name || exam.class_name || exam.className || exam.class || '',
  duration: Number(exam.duration_minutes || exam.duration || exam.durationMinutes || exam.time_limit || 0) || 0,
  status: exam.status || (exam.is_active ? 'Live' : 'Draft') || 'Draft',
  instructions: exam.instructions || exam.instructions_text || exam.instruction || '',
  remaining_attempts: exam.remaining_attempts ?? exam.remainingAttempts ?? exam.remaining_attempts_count ?? null,
  start_time: exam.start_time || exam.startTime || exam.scheduled_start || null,
  questions: Array.isArray(exam.questions) ? exam.questions : [],
})

export async function getAvailableExams(params = {}) {
  const response = await apiFetch('/api/student/exams/available', { params })
  const exams = Array.isArray(response) ? response : response?.data || []
  return exams.map(normalizeExam)
}

export async function getStudentExam(examId) {
  // Try the direct exam detail endpoint first
  try {
    const single = await apiFetch(`/api/student/exams/${examId}`)
    if (single && (single.id || single.data?.id)) {
      return normalizeExam(single.data ?? single)
    }
  } catch {
    // Fall through to available list lookup
  }

  // Fall back: search within the available list
  const response = await apiFetch('/api/student/exams/available')
  const exams = Array.isArray(response) ? response : response?.data || []
  const found = exams.find((e) => String(e.id) === String(examId))
  if (!found) throw new Error('Exam not found or not available.')
  return normalizeExam(found)
}

export async function startStudentExam(examId) {
  // spec: POST /api/student/exams/{examId}/start
  return await apiFetch(`/api/student/exams/${examId}/start`, {
    method: 'POST',
  })
}

export async function getStudentExamAttempt(examId) {
  // spec: GET /api/student/exams/{examId}/attempt — returns 404 if no attempt
  return await apiFetch(`/api/student/exams/${examId}/attempt`)
}

export async function getStudentExamQuestions(attemptId) {
  // spec: GET /api/student/exams/attempts/{attemptId}/questions
  const response = await apiFetch(`/api/student/exams/attempts/${attemptId}/questions`)
  return Array.isArray(response) ? response : response?.data || []
}

export async function saveStudentAnswer(attemptId, questionId, payload) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/answers/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function bulkSaveAnswers(attemptId, payload) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/bulk-save`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getTimeRemaining(attemptId) {
  const response = await apiFetch(`/api/student/exams/attempts/${attemptId}/time-remaining`)
  return response
}

export async function submitStudentAttempt(attemptId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/submit`, {
    method: 'POST',
  })
}

export async function flagQuestion(attemptId, questionId) {
  return await apiFetch(`/api/student/exams/attempts/${attemptId}/flag/${questionId}`, {
    method: 'POST',
  })
}

export async function getAttemptResult(attemptId) {
  const response = await apiFetch(`/api/student/exams/attempts/${attemptId}/result`)
  return response
}
