import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

/**
 * ScheduleSubject service — the exam calendar (§5.3). Admin owns writes,
 * teachers read. A slot must sit inside its schedule's master window and
 * not overlap another slot in the same schedule (422 otherwise), is unique
 * per subject within the schedule, and can't be deleted after activation
 * (409).
 */

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
    throw new Error(extractErrorMessage(error, 'Unable to add the subject slot.'))
  }
}

/** payload: { starts_at?, ends_at?, duration_minutes? } — subject_id is fixed once created. */
export async function updateScheduleSubject(scheduleId, slotId, payload) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update the subject slot.'))
  }
}

export async function deleteScheduleSubject(scheduleId, slotId) {
  try {
    return await apiFetch(`/api/assessment-schedules/${scheduleId}/schedule-subjects/${slotId}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to remove the subject slot.'))
  }
}
