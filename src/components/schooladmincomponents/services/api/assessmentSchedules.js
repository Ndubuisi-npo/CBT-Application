import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

/**
 * AssessmentSchedule service — the "when, per session/term" occurrence of an
 * Assessment definition (§1/§5.2 of the refactor spec).
 *
 * - academic_session_id / term_id are server-resolved from the current term
 *   and never sent by the client (Locked Decision #4).
 * - Creating a schedule opens the question window immediately — only
 *   question_submission_ends is required (Locked Decision #6); there is no
 *   separate "open" action.
 * - Known error codes worth branching on in the UI: 422 past deadline / bad
 *   window, 409 already scheduled this term or no current term configured
 *   (create), 409 illegal lifecycle transition (lifecycle actions).
 */

export async function getSchedules(assessmentId) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/schedules`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch schedules.'))
  }
}

export async function createSchedule(assessmentId, payload) {
  try {
    return await apiFetch(`/api/assessments/${assessmentId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create the schedule.'))
  }
}

export async function getSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch the schedule.'))
  }
}

export async function updateSchedule(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update the schedule.'))
  }
}

export async function deleteSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete the schedule.'))
  }
}

/* --------------------------------------------------------------------------
 * Lifecycle actions — all school_admin, all return the updated schedule.
 * ------------------------------------------------------------------------ */

export async function closeSubmissions(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/close-submissions`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to close the question window.'))
  }
}

/** payload: { question_submission_ends: "future ISO" } */
export async function reopenSubmissions(scheduleId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/reopen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to reopen the question window.'))
  }
}

export async function activateSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/activate`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to activate the schedule.'))
  }
}

export async function completeSchedule(scheduleId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/complete`, { method: 'POST' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to complete the schedule.'))
  }
}
