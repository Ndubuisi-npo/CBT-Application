import { apiFetch } from '../../../../js/lib/api'

/**
 * Stage A — start an SEB-enabled exam.
 * Backend returns a seb_launch_url; the browser hands off to the SEB client
 * by navigating to it directly (never via Vue Router — see StudentDashboard).
 *
 * @param {string|number} examId
 * @returns {Promise<{ seb_launch_url: string }>}
 */
export async function startSebExam(examId) {
  return await apiFetch(`/api/exams/${examId}/start`, {
    method: 'POST',
  })
}

/**
 * Stage C — exchange the short-lived launch token for a durable session
 * token. The temporary token is sent as a one-off Authorization header
 * (never touching the global/default header) and must not be persisted
 * or reused after this call resolves.
 *
 * @param {string} attemptId
 * @param {string} temporaryToken
 * @returns {Promise<{ token: string, user?: object, role?: string }>}
 */
export async function verifySebSession(attemptId, temporaryToken) {
  return await apiFetch('/api/seb/verify', {
    params: { attempt_id: attemptId },
    headers: { Authorization: `Bearer ${temporaryToken}` },
    // A failed/expired temporary token should surface as an in-page error
    // state on /seb-entry, not force a redirect to /login.
    skipAuthRedirect: true,
  })
}
