import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'
import { getAuthUser } from '../../../../js/lib/auth'

/**
 * Assessment lifecycle service.
 *
 * Single seam between the assessment UI and the backend: every call goes
 * through apiFetch (NOT axios) and unwraps the shared response envelope
 * ({ success, message, data }) automatically. Endpoint paths match the
 * backend integration guide (assessment-system-frontend-guide.md §7); if the
 * backend's final route prefixes differ, ONLY this file changes.
 *
 * Lifecycle:
 *   assessment: draft -> open -> submissions_closed -> active -> completed
 *               (reopen: submissions_closed -> open, with a new deadline)
 *   submission: draft -> submitted -> approved
 *               (request-changes: submitted -> changes_requested -> submitted)
 */

/* --------------------------------------------------------------------------
 * Assessments (school admin)
 * ------------------------------------------------------------------------ */

export async function getAssessments(params = {}) {
  try {
    return await apiFetch('/api/assessments', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch assessments.'))
  }
}

export async function getAssessment(id) {
  try {
    return await apiFetch(`/api/assessments/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch assessment.'))
  }
}

export async function createAssessment(payload) {
  try {
    return await apiFetch('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create assessment.'))
  }
}

export async function updateAssessment(id, payload) {
  try {
    return await apiFetch(`/api/assessments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update assessment.'))
  }
}

export async function deleteAssessment(id) {
  try {
    return await apiFetch(`/api/assessments/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete assessment.'))
  }
}

/* Transitions. All are body-less except reopen (see §4/§7). The timing windows
 * they gate on (submission_closes_at, student_starts_at/ends_at) are captured
 * at create/edit time because PATCH is draft-only — there is no way to set them
 * once the assessment leaves draft. */

export async function openAssessment(id) {
  try {
    return await apiFetch(`/api/assessments/${id}/open`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to open assessment.'))
  }
}

export async function closeSubmissions(id) {
  try {
    return await apiFetch(`/api/assessments/${id}/close-submissions`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to close submissions.'))
  }
}

export async function reopenAssessment(id, payload) {
  try {
    return await apiFetch(`/api/assessments/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reopen assessment.'))
  }
}

export async function activateAssessment(id) {
  try {
    return await apiFetch(`/api/assessments/${id}/activate`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to activate assessment.'))
  }
}

export async function completeAssessment(id) {
  try {
    return await apiFetch(`/api/assessments/${id}/complete`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to complete assessment.'))
  }
}

/* --------------------------------------------------------------------------
 * Teacher submissions
 * ------------------------------------------------------------------------ */

export async function getTeacherAssessments(params = {}) {
  try {
    return await apiFetch('/api/assessments', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch assessments.'))
  }
}

/**
 * There is no `/my-submission` endpoint. The teacher UI models one submission
 * per assessment, so we list the assessment's submissions and pick the one
 * owned by the authenticated teacher. When we can identify the user but find no
 * match, the teacher simply has no submission yet (return null → show the
 * create form). Only when we cannot identify the user at all do we fall back to
 * the first item, trusting the teacher-scoped visibility rule (§7).
 *
 * NOTE: confirm the user↔teacher id mapping with the backend — teacher_id may
 * live in a different id space than the auth user id.
 */
export async function getMySubmission(assessmentId) {
  try {
    const list = await getSubmissions(assessmentId)
    const submissions = Array.isArray(list) ? list : (list?.data ?? [])
    if (!submissions.length) return null

    const user = getAuthUser()
    const candidateIds = [user?.id, user?.teacher_id, user?.teacher?.id]
      .filter((value) => value != null)
      .map(String)

    let mine = null

    if (candidateIds.length) {
      mine = submissions.find((s) => {
        const ownerIds = [s.teacher_id, s.teacher?.id, s.teacher?.user_id, s.user_id]
          .filter((value) => value != null)
          .map(String)
        return ownerIds.some((id) => candidateIds.includes(id))
      })
    }

    if (!mine) {
      // The list endpoint is summary-only and does not include the nested
      // question list/options needed by the teacher question builder.
      // If we cannot identify a teacher-owned submission from the index,
      // keep the UI in the “no submission yet” state instead of returning a
      // partial record that cannot render questions.
      return null
    }

    // Fetch the detail endpoint for the actual submission payload so the
    // question list and option objects are available for the teacher workspace.
    return await getSubmission(mine.id)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch your submission.'))
  }
}

export async function createSubmission(assessmentId, payload) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create submission.'))
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
    return await apiFetch(`/api/submissions/${submissionId}/questions/${questionId}`, {
      method: 'DELETE',
    })
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

export async function getSubmissions(assessmentId, params = {}) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/submissions`, { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch submissions.'))
  }
}

export async function getSubmission(submissionId, params = {}) {
  try {
    return await apiFetch(`/api/submissions/${submissionId}`, { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch submission.'))
  }
}

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

/* --------------------------------------------------------------------------
 * Reference data (reuses existing endpoints — no new backend needed)
 * ------------------------------------------------------------------------ */

export async function getSubjects() {
  try {
    return await apiFetch('/api/subjects')
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

export async function getTeachers() {
  try {
    return await apiFetch('/api/teachers')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch teachers.'))
  }
}
