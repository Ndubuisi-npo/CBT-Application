import { apiFetch } from '../../../../js/lib/api'

/**
 * Tell the backend which exam the student is about to start inside Safe
 * Exam Browser (SEB). The backend is expected to temporarily associate this
 * exam with the authenticated student so it can later be resolved via
 * getCurrentSebExam() once SEB has launched.
 *
 * @param {string|number} examId
 */
export async function startSebExam(examId) {
  return await apiFetch('/api/student/seb/start', {
    method: 'POST',
    body: JSON.stringify({ examId }),
  })
}

/**
 * Ask the backend which exam the currently authenticated student is
 * authorized to take inside the active SEB session.
 *
 * Expected response shape: { examId: string }
 *
 * @returns {Promise<{ examId?: string|number }>}
 */
export async function getCurrentSebExam() {
  return await apiFetch('/api/student/seb/current-exam')
}
