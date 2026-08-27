import { apiFetch } from '../../../../js/lib/api'

/**
 * Fetch all exam results for a specific student (teacher view).
 */
export async function getStudentResultsForTeacher(studentId) {
  const response = await apiFetch(`/api/students/${studentId}/results`)
  return Array.isArray(response) ? response : (response?.data || [])
}

/**
 * Fetch detailed result for a specific attempt (teacher view).
 */
export async function getAttemptResultDetailForTeacher(examId, attemptId) {
  const response = await apiFetch(`/api/exams/${examId}/grading/attempts/${attemptId}/result`)
  return response?.data ?? response
}
