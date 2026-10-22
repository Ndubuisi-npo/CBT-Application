import { apiFetchFull, extractErrorMessage } from '../../../../js/lib/api'

/**
 * ScheduleSubject service — the exam timetable. Admins READ it; teachers
 * WRITE their own slot through the submission-owned endpoints in
 * assessments.js (saveSubmissionScheduleSlot / deleteSubmissionScheduleSlot).
 *
 * The old admin write endpoints (POST/PATCH/DELETE on
 * /assessment-schedules/{schedule}/schedule-subjects) were removed on the
 * backend and must not be called from the frontend.
 */

/**
 * Resolves with `{ slots, meta }`:
 *  - slots: array of timetable slots (payload.data)
 *  - meta:  { daily_cap, daily_usage } (payload.meta) — apiFetch would drop this.
 * Metadata is optional; the caller normalizes missing values defensively.
 */
export async function getScheduleSubjects(scheduleId) {
  try {
    const payload = await apiFetchFull(`/api/assessment-schedules/${scheduleId}/schedule-subjects`)
    const slots = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
    const meta = (!Array.isArray(payload) && payload?.meta && typeof payload.meta === 'object') ? payload.meta : {}
    return { slots, meta }
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch the exam timetable.'))
  }
}
