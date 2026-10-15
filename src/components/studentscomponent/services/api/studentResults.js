import { apiFetch } from '../../../../js/lib/api'

/**
 * Fetch all results for the current student.
 */
export async function getStudentResults() {
  const response = await apiFetch('/api/students/results')
  return Array.isArray(response) ? response : (response?.data || [])
}

/**
 * Fetch detailed result for a specific attempt.
 * @param {string|number} attemptId
 */
export async function getAttemptResultDetail(attemptId) {
  const response = await apiFetch(`/api/student/exams/attempts/${attemptId}/result`)
  return response?.data ?? response
}

/**
 * Fetch all results for a specific student (teacher view).
 * @param {string|number} studentId
 */
export async function getStudentResultsForTeacher(studentId) {
  const response = await apiFetch(`/api/students/${studentId}/results`)
  return Array.isArray(response) ? response : (response?.data || [])
}

/**
 * Fetch detailed result for a specific attempt (teacher view).
 * @param {string|number} attemptId
 */
export async function getAttemptResultDetailForTeacher(attemptId) {
  const response = await apiFetch(`/api/exams/attempts/${attemptId}/result`)
  return response?.data ?? response
}
