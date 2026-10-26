import {
  lagosLocalToIso,
  parseSlotInstant,
  SLOT_TIME_ZONE,
  toLagosDateKey,
  toLagosLocalInput,
} from './slotTime.js'

export const fmtDate = (date) => {
  if (!date || date === '-') return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: SLOT_TIME_ZONE,
  });
}

export const fmtDateTime = (date, options = {}) => {
  if (!date || date === '-') return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
    timeZone: SLOT_TIME_ZONE,
  }).format(d)
}

export const toDatetimeLocalInputValue = (value) => {
  return toLagosLocalInput(value)
}

// Normalizes any incoming date-ish value (ISO datetime string, date-only
// string, Date object, timestamp) into the "YYYY-MM-DD" format required by
// native <input type="date"> elements. Without this, edit forms silently
// render blank whenever the backend sends a full ISO datetime (e.g.
// "2010-05-14T00:00:00.000000Z") instead of a bare date.
export const toDateInputValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match && !value.includes('T')) return match[1];
  }

  return toLagosDateKey(value)
}

export const toDatetimeLocalIsoWithOffset = (localDateTime) => {
  return lagosLocalToIso(localDateTime)
}

export const getAssessmentWindowState = (assessment, now = Date.now()) => {
  const status = (assessment?.assessment_status ?? assessment?.assessmentStatus ?? assessment?.status ?? '').toLowerCase();
  if (['completed', 'closed'].includes(status)) return 'closed';

  const startsAt = assessment?.assessment_starts
    ?? assessment?.assessmentStarts
    ?? assessment?.student_starts_at
    ?? assessment?.studentStartsAt
    ?? assessment?.scheduled_start
    ?? assessment?.start_time;
  const endsAt = assessment?.assessment_ends
    ?? assessment?.assessmentEnds
    ?? assessment?.student_ends_at
    ?? assessment?.studentEndsAt
    ?? assessment?.scheduled_end
    ?? assessment?.end_time;
  const startsAtMs = parseSlotInstant(startsAt)?.getTime() ?? NaN;
  const endsAtMs = parseSlotInstant(endsAt)?.getTime() ?? NaN;

  if (!Number.isNaN(startsAtMs) && now < startsAtMs) return 'upcoming';
  if (!Number.isNaN(endsAtMs) && now >= endsAtMs) return 'closed';
  return 'open';
}

export const getEffectiveAssessmentStatus = (assessment, now = Date.now()) => {
  const storedStatus = (assessment?.assessment_status ?? assessment?.assessmentStatus ?? assessment?.status ?? '').toLowerCase()
  if (storedStatus === 'published') return 'published'
  if (storedStatus === 'live') return 'active'

  const windowState = getAssessmentWindowState(assessment, now)
  if (windowState === 'closed') return 'completed'
  const startsAt = assessment?.assessment_starts
    ?? assessment?.assessmentStarts
    ?? assessment?.student_starts_at
    ?? assessment?.studentStartsAt
    ?? assessment?.scheduled_start
    ?? assessment?.start_time
  const startsAtMs = parseSlotInstant(startsAt)?.getTime() ?? NaN
  if (windowState === 'open' && !Number.isNaN(startsAtMs) && now >= startsAtMs) return 'active'
  return storedStatus || 'draft'
}

export const isAssessmentWindowOpen = (assessment, now = Date.now()) => (
  getEffectiveAssessmentStatus(assessment, now) === 'active' && getAssessmentWindowState(assessment, now) === 'open'
)

export const isStudentExamWindowOpen = (exam, now = Date.now()) =>
  getAssessmentWindowState(exam, now) === 'open'
