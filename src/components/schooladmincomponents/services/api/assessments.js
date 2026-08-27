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

/* Transitions. Body-less except reopen. These now target the SCHEDULE
 * (the occurrence), not the assessment definition — the definition has no
 * lifecycle of its own (§5.2 of the refactor spec). "Open" no longer exists
 * as an action: creating a schedule opens its question window immediately. */

export async function closeSubmissions(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/close-submissions`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to close submissions.'))
  }
}

/** payload: { question_submission_ends: future ISO } */
export async function reopenSubmissions(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/reopen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reopen submissions.'))
  }
}

export async function activateSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/activate`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to activate schedule.'))
  }
}

export async function completeSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/complete`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to complete schedule.'))
  }
}

export async function publishScheduleResults(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/publish-results`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to publish assessment results.'))
  }
}

/* --------------------------------------------------------------------------
 * Schedules — the dated, lifecycle-bearing occurrence of an assessment
 * (§5.2). One per assessment per term. Creating one opens the question
 * window immediately; only question_submission_ends is required.
 * ------------------------------------------------------------------------ */

export async function getSchedules(assessmentId) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/schedules`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch schedules.'))
  }
}

/** payload: { question_submission_ends, assessment_starts?, assessment_ends? } */
export async function createSchedule(assessmentId, payload) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create schedule.'))
  }
}

export async function getSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch schedule.'))
  }
}

/** payload: any subset of { question_submission_ends, assessment_starts, assessment_ends } — draft-only, 409 otherwise. */
export async function updateSchedule(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update schedule.'))
  }
}

export async function deleteSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete schedule.'))
  }
}

/* --------------------------------------------------------------------------
 * Schedule subjects — the exam calendar (§5.3): per-subject slots inside a
 * schedule's master window. Every approved subject needs one before the
 * schedule can be activated. Not surfaced in the UI yet — wired here so it's
 * ready to hook up.
 * ------------------------------------------------------------------------ */

export async function getScheduleSubjects(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch the exam calendar.'))
  }
}

/** payload: { subject_id, starts_at, ends_at, duration_minutes? } */
export async function createScheduleSubject(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to add subject slot.'))
  }
}

export async function updateScheduleSubject(scheduleId, slotId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update subject slot.'))
  }
}

export async function deleteScheduleSubject(scheduleId, slotId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects/${slotId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to remove subject slot.'))
  }
}

/* --------------------------------------------------------------------------
 * Teacher submissions — now scoped to a SCHEDULE, not the assessment
 * definition (§5.4: table is teacher_submissions, FK is
 * assessment_schedule_id).
 * ------------------------------------------------------------------------ */

export async function getTeacherAssessments(params = {}) {
  try {
    return await apiFetch('/api/assessments', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch assessments.'))
  }
}

/**
 * There is no `/my-submission` endpoint. The teacher UI models one
 * submission per schedule, so we list the schedule's submissions and pick
 * the one owned by the authenticated teacher. When we can identify the user
 * but find no match, the teacher simply has no submission yet (return null
 * → show the create form).
 *
 * NOTE: confirm the user↔teacher id mapping with the backend — teacher_id may
 * live in a different id space than the auth user id.
 */
export async function getMySubmission(scheduleId) {
  try {
    const list = await getSubmissions(scheduleId)
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

export async function getSubmissions(scheduleId, params = {}) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/submissions`, { params })
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
