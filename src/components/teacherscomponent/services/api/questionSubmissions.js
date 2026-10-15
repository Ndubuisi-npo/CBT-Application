import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

/**
 * Question submission service.
 *
 * A lightweight, per-question review workflow: a teacher submits a single
 * question against an assessment (scoped to a session/term/subject); a
 * reviewer works through a review trail until it's accepted.
 *
 * This is distinct from the existing multi-question "submission builder"
 * (services/api/assessments.js — createSubmission/addQuestion/etc., which
 * models one submission holding many questions under a marks cap). Kept in
 * its own file/store so neither workflow's contract leaks into the other.
 *
 * Request shape (create):   { session_id, term_id, subject_id, question }
 * Response shape (record):  { id, session, term, subject, teacher,
 *                              submitted_at, status, reviews, question }
 *   status:  'accepted' | 'in_review' | 'changes_requested'
 *   reviews: [{ date, reviewed_by, review }]
 */

const BASE = (assessmentId) => `/api/assessments/${assessmentId}/question-submissions`

export async function getQuestionSubmissions(assessmentId, params = {}) {
  try {
    return await apiFetch(BASE(assessmentId), { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch submissions.'))
  }
}

export async function createQuestionSubmission(assessmentId, payload) {
  try {
    return await apiFetch(BASE(assessmentId), {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to submit your question.'))
  }
}
