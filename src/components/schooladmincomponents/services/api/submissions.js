import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'
import { getAuthUser } from '../../../../js/lib/auth'

/**
 * Submission service — a teacher's paper for one subject, authored inside
 * an AssessmentSchedule's question window (§5.4). Kept as the class name
 * "Submission" per the spec (Locked Decision — table is teacher_submissions,
 * relation is schedule() not assessment()).
 *
 * Status vocab is UNCHANGED by the refactor: draft -> submitted ->
 * changes_requested (loops back to draft-editable) | approved.
 *
 * Known error codes: 409 window closed / teacher not assigned to subject at
 * the assessment's class level / already authored for that subject on this
 * schedule; 422 marks cap exceeded on add-question.
 */

export async function getSubmissions(scheduleId, params = {}) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/submissions`, { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch submissions.'))
  }
}

/**
 * There is no `/my-submission` endpoint. The teacher UI models one
 * submission per subject per schedule, so list the schedule's submissions
 * and pick the one owned by the authenticated teacher (or matching the
 * chosen subject, if provided). No match means no submission yet for that
 * subject → show the create form.
 */
export async function getMySubmission(scheduleId, subjectId = null) {
  try {
    const list = await getSubmissions(scheduleId)
    const submissions = Array.isArray(list) ? list : (list?.data ?? [])
    if (!submissions.length) return null

    const user = getAuthUser()
    const candidateIds = [user?.id, user?.teacher_id, user?.teacher?.id]
      .filter((value) => value != null)
      .map(String)

    const owned = candidateIds.length
      ? submissions.filter((s) => {
          const ownerIds = [s.teacher_id, s.teacher?.id, s.teacher?.user_id, s.user_id]
            .filter((value) => value != null)
            .map(String)
          return ownerIds.some((id) => candidateIds.includes(id))
        })
      : []

    const mine = subjectId
      ? owned.find((s) => String(s.subject_id ?? s.subject?.id) === String(subjectId)) || null
      : owned[0] || null

    if (!mine) return null

    // The list endpoint is summary-only — fetch the detail endpoint for the
    // full question/option payload the teacher workspace needs.
    return await getSubmission(mine.id)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch your submission.'))
  }
}

/** payload: { subject_id, title, description? } */
export async function createSubmission(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create submission.'))
  }
}

export async function getSubmission(submissionId, params = {}) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}`, { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch submission.'))
  }
}

export async function updateSubmission(submissionId, payload) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update submission.'))
  }
}

/** payload: { type, content, marks, image_url?, explanation?, options?: [{ label, content, is_correct }] } */
export async function addQuestion(submissionId, payload) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to add question.'))
  }
}

export async function deleteQuestion(submissionId, questionId) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}/questions/${questionId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete question.'))
  }
}

export async function submitForReview(submissionId) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}/submit-for-review`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to submit for review.'))
  }
}

/* --------------------------------------------------------------------------
 * Admin review
 * ------------------------------------------------------------------------ */

/** payload: { comment } */
export async function requestChanges(submissionId, payload) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to request changes.'))
  }
}

export async function approveSubmission(submissionId) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}/approve`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to approve submission.'))
  }
}
