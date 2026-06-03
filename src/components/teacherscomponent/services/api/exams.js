/**
 * Teacher Exam API Service
 *
 * Teacher Exam API Service
 * Lifecycle: draft → live → concluded.
 */
import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

// ─── CRUD ────────────────────────────────────────────────────────────────────

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

// ─── LIFECYCLE ACTIONS ───────────────────────────────────────────────────────

export async function startSession(id) {
  try {
    return await apiFetch(`/api/exams/${id}/start-session`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to start exam session.'))
  }
}

export async function endSession(id) {
  try {
    return await apiFetch(`/api/exams/${id}/end-session`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to end exam session.'))
  }
}

/**
 * any → locked
 * Teacher locks/freezes exam.
 */
export async function lockExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}/lock`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to lock exam.'))
  }
}

/**
 * locked → draft
 * Teacher unlocks exam back to draft.
 */
export async function unlockExam(id) {
  try {
    return await apiFetch(`/api/exams/${id}/unlock`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to unlock exam.'))
  }
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

export async function getExamQuestions(examId) {
  try {
    return await apiFetch(`/api/exams/${examId}/questions`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch exam questions.'))
  }
}

export async function addQuestionToExam(examId, payload) {
  // payload: { question_id, marks, order }
  try {
    return await apiFetch(`/api/exams/${examId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to add question to exam.'))
  }
}

export async function removeQuestionFromExam(examId, examQuestionId) {
  try {
    return await apiFetch(`/api/exams/${examId}/questions/${examQuestionId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to remove question from exam.'))
  }
}

export async function updateExamQuestion(examId, examQuestionId, payload) {
  // payload: { marks?, order? }
  try {
    return await apiFetch(`/api/exams/${examId}/questions/${examQuestionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update exam question.'))
  }
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function getClassStudentsForAttendance(examId) {
  try {
    return await apiFetch(`/api/exams/${examId}/attendance/class-students`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class students.'))
  }
}

export async function saveAttendance(examId, attendance) {
  // attendance: [{ student_id, status: 'present' | 'absent' }]
  try {
    return await apiFetch(`/api/exams/${examId}/attendance/batch`, {
      method: 'POST',
      body: JSON.stringify({ attendance }),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save attendance.'))
  }
}

export async function startStudentAttempt(examId) {
  // Called by teacher (impersonating student) or by student directly
  try {
    return await apiFetch(`/api/student/exams/${examId}/start`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to start student attempt.'))
  }
}

// ─── MONITORING ───────────────────────────────────────────────────────────────

export async function getStudentAttempts(examId) {
  try {
    return await apiFetch(`/api/exams/${examId}/attempts`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch student attempts.'))
  }
}

export async function forceSubmitAttempt(attemptId) {
  try {
    return await apiFetch(`/api/student/exams/attempts/${attemptId}/force-submit`, {
      method: 'POST',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to force submit attempt.'))
  }
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────

export async function getExamResults(examId) {
  try {
    return await apiFetch(`/api/exams/${examId}/results`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch exam results.'))
  }
}

export async function getAttemptResult(attemptId) {
  try {
    return await apiFetch(`/api/student/exams/attempts/${attemptId}/result`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch attempt result.'))
  }
}

// ─── METADATA (kept for teacher use) ─────────────────────────────────────────

export async function getSubjects(params = {}) {
  try {
    return await apiFetch('/api/subjects', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch subjects.'))
  }
}

export async function getClassLevels() {
  try {
    return await apiFetch('/api/class-levels')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class levels.'))
  }
}

export async function getClassArms(classLevelId) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class arms.'))
  }
}

export async function getAcademicSessions() {
  try {
    return await apiFetch('/api/academic-sessions')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch academic sessions.'))
  }
}

export async function getTerms(sessionId) {
  try {
    return await apiFetch(`/api/academic-sessions/${sessionId}/terms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch terms.'))
  }
}

export async function getQuestionBank(params = {}) {
  try {
    return await apiFetch('/api/questions', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch question bank.'))
  }
}
