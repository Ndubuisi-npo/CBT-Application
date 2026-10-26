/**
 * Exam-slot helpers: Africa/Lagos time handling, daily-capacity maths and
 * "missing slot" detection. Pure functions only (no Vue / store imports) so
 * they can be shared by the teacher editor, the admin timetable and tests.
 *
 * Why not reuse toDatetimeLocalIsoWithOffset for slots? That helper builds the
 * instant from the BROWSER's timezone, so a teacher whose device isn't set to
 * Africa/Lagos would land slots hours off. Slot times are always interpreted
 * and displayed in Lagos time here, and serialized with an explicit offset.
 */

export const SLOT_TIME_ZONE = 'Africa/Lagos'

const pad = (value) => String(value).padStart(2, '0')

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: SLOT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** Wall-clock parts of an instant, as seen in Africa/Lagos. */
const lagosParts = (date) => {
  const out = {}
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value)
  }
  return out
}

/** Africa/Lagos offset (minutes east of UTC) at a given instant. */
const lagosOffsetMinutes = (date) => {
  const p = lagosParts(date)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

const localWallClockToDate = (year, month, day, hour, minute, second = 0, millisecond = 0) => {
  if (
    month < 1 || month > 12 || day < 1 || day > 31
    || hour > 23 || minute > 59 || second > 59
  ) return null

  const wallClockMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  let instantMs = wallClockMs - lagosOffsetMinutes(new Date(wallClockMs)) * 60000
  instantMs = wallClockMs - lagosOffsetMinutes(new Date(instantMs)) * 60000
  const date = new Date(instantMs)
  const parts = lagosParts(date)

  if (
    parts.year !== year || parts.month !== month || parts.day !== day
    || parts.hour !== hour || parts.minute !== minute || parts.second !== second
  ) return null

  return date
}

/** Parse offset-bearing API timestamps as instants; bare values are Lagos wall time. */
export const parseSlotInstant = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const text = String(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?([zZ]|[+-]\d{2}:?\d{2})?)?$/.exec(text)
  if (!match) return null

  const [, year, month, day, hour = '00', minute = '00', second = '00', fraction = '', zone] = match
  if (zone) {
    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const millisecond = Number((fraction + '000').slice(0, 3))
  return localWallClockToDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond
  )
}

/** "YYYY-MM-DDTHH:mm" (datetime-local style) for an instant, in Lagos time. */
export const toLagosLocalInput = (value) => {
  const date = parseSlotInstant(value)
  if (!date) return ''
  const p = lagosParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

/** "YYYY-MM-DD" calendar day of an instant in Lagos — the key daily_usage uses. */
export const toLagosDateKey = (value) => toLagosLocalInput(value).slice(0, 10)

/** "HH:mm" of an instant in Lagos. */
export const toLagosTimeInput = (value) => toLagosLocalInput(value).slice(11, 16)

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/** Lagos wall-clock "YYYY-MM-DDTHH:mm" -> Date (the real instant), or null. */
export const lagosLocalToDate = (local) => {
  const match = LOCAL_PATTERN.exec(String(local || ''))
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  return localWallClockToDate(year, month, day, hour, minute)
}

/** Lagos wall-clock input -> ISO string with an explicit offset ("...+01:00"). */
export const lagosLocalToIso = (local) => {
  const date = lagosLocalToDate(local)
  if (!date) return null
  const offset = lagosOffsetMinutes(date)
  const sign = offset < 0 ? '-' : '+'
  const abs = Math.abs(offset)
  return `${local}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Lagos wall-clock input -> UTC ISO string for APIs that store UTC timestamps. */
export const lagosLocalToUtcIso = (local) => lagosLocalToDate(local)?.toISOString() ?? null

/** Add minutes to a Lagos wall-clock input value, returning a Lagos wall-clock value. */
export const addMinutesToLagosLocal = (local, minutes) => {
  const date = lagosLocalToDate(local)
  if (!date || !Number.isFinite(Number(minutes))) return ''
  return toLagosLocalInput(new Date(date.getTime() + Number(minutes) * 60000))
}

/** Whole minutes between two Lagos wall-clock values (end - start), or null. */
export const diffLagosLocalMinutes = (startLocal, endLocal) => {
  const start = lagosLocalToDate(startLocal)
  const end = lagosLocalToDate(endLocal)
  if (!start || !end) return null
  return Math.round((end.getTime() - start.getTime()) / 60000)
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: SLOT_TIME_ZONE,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: SLOT_TIME_ZONE,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: SLOT_TIME_ZONE,
})

/** "09:00 AM" in Lagos time, or an em dash. */
export const formatSlotTime = (value) => {
  const date = parseSlotInstant(value)
  return date ? timeFormatter.format(date) : '—'
}

/** Date and time of an instant in Lagos, or an em dash. */
export const formatSlotDateTime = (value) => {
  const date = parseSlotInstant(value)
  return date ? dateTimeFormatter.format(date) : '—'
}

/** "Tue, 8 Sep 2026"-style label in Lagos time, or an em dash. */
export const formatSlotDate = (value) => {
  const date = parseSlotInstant(value)
  return date ? dateFormatter.format(date) : '—'
}

/** Label for a "YYYY-MM-DD" key without any timezone shifting. */
export const formatDateKey = (key) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''))
  if (!match) return key === 'unknown' ? 'Date not available' : key || '—'
  const [year, month, day] = match.slice(1).map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

/* ---------------------------------------------------------------------------
 * Slots
 * ------------------------------------------------------------------------- */

export const slotSubjectId = (slot) => slot?.subject_id ?? slot?.subjectId ?? slot?.subject?.id ?? null

const slotDateTime = (slot, datetimeKeys, timeKeys) => {
  const value = datetimeKeys.map((key) => slot?.[key]).find((item) => item !== null && item !== undefined && item !== '')
  const normalizedValue = typeof value === 'string'
    ? value.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
    : value
  const parsed = parseSlotInstant(normalizedValue)
  if (parsed) return parsed

  const dateValue = [
    slot?.slot_date,
    slot?.slotDate,
    slot?.scheduled_date,
    slot?.scheduledDate,
    slot?.assessment_date,
    slot?.exam_date,
    slot?.date,
  ].find((item) => item !== null && item !== undefined && item !== '')
  const date = typeof dateValue === 'string' ? dateValue.slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const timePattern = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
  const time = (typeof value === 'string' && timePattern.test(value) ? value : null)
    ?? timeKeys.map((key) => slot?.[key]).find((item) => item !== null && item !== undefined && item !== '')
  if (typeof time !== 'string' || !timePattern.test(time)) return null
  return parseSlotInstant(`${date}T${time}`)
}

/** Slot start as an instant, accepting API datetime or date/time field variants. */
export const slotStartInstant = (slot) => slotDateTime(
  slot,
  ['starts_at', 'startsAt', 'start_at', 'startAt', 'start_datetime', 'startDateTime', 'scheduled_start'],
  ['start_time', 'startTime', 'start']
)

/** Slot end as an instant, accepting API datetime or date/time field variants. */
export const slotEndInstant = (slot) => slotDateTime(
  slot,
  ['ends_at', 'endsAt', 'end_at', 'endAt', 'end_datetime', 'endDateTime', 'scheduled_end'],
  ['end_time', 'endTime', 'end']
)

export const slotDurationMinutes = (slot) => {
  const explicit = Number(slot?.duration_minutes ?? slot?.durationMinutes)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  const start = slotStartInstant(slot)
  const end = slotEndInstant(slot)
  if (!start || !end) return null
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
  return minutes > 0 ? minutes : null
}

export const formatDuration = (minutes) => {
  const value = Number(minutes)
  if (!Number.isFinite(value) || value <= 0) return ''
  const h = Math.floor(value / 60)
  const m = value % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export const sortSlots = (slots) =>
  [...(Array.isArray(slots) ? slots : [])].sort((a, b) => {
    const left = slotStartInstant(a)?.getTime() ?? Infinity
    const right = slotStartInstant(b)?.getTime() ?? Infinity
    return left - right
  })

/** Slots sorted and grouped by Lagos calendar day: [{ key, slots }]. */
export const groupSlotsByDay = (slots) => {
  const groups = new Map()
  for (const slot of sortSlots(slots)) {
    const key = toLagosDateKey(slotStartInstant(slot)) || 'unknown'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(slot)
  }
  return [...groups].map(([key, items]) => ({ key, slots: items }))
}

/* ---------------------------------------------------------------------------
 * Daily capacity
 * ------------------------------------------------------------------------- */

/**
 * The API sends `daily_cap` (integer | null) and `daily_usage` (date -> count).
 * PHP serializes an empty associative array as `[]`, so tolerate that.
 */
export const normalizeScheduleSubjectMeta = (meta) => {
  const rawCap = meta?.daily_cap
  const cap = rawCap === null || rawCap === undefined || rawCap === '' || !Number.isFinite(Number(rawCap))
    ? null
    : Number(rawCap)
  const rawUsage = meta?.daily_usage
  const usage = {}
  if (rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage)) {
    for (const [key, value] of Object.entries(rawUsage)) {
      const count = Number(value)
      if (Number.isFinite(count)) usage[key] = count
    }
  }
  return { daily_cap: cap, daily_usage: usage }
}

/**
 * Capacity for one calendar day.
 *
 * `used` is the API's count for the day (all schedules of the class level,
 * including this teacher's own slot if it is already placed that day).
 * `othersUsed` excludes the teacher's own existing slot, so moving a slot
 * within the same day never counts it twice. `full` means "no room for my
 * slot on this day": othersUsed >= cap.
 *
 * Assumption (frontend only, backend not available to verify): the API's
 * daily_usage includes the teacher's own slot. The backend remains the final
 * authority and will still reject with a 422 if this is ever wrong.
 */
export const computeDayCapacity = ({ meta, dateKey, ownSlot = null }) => {
  const { daily_cap: cap, daily_usage: usage } = normalizeScheduleSubjectMeta(meta)
  const used = dateKey ? (usage[dateKey] ?? 0) : 0
  const ownOnThisDay = !!ownSlot && !!dateKey && toLagosDateKey(slotStartInstant(ownSlot)) === dateKey
  const othersUsed = Math.max(0, used - (ownOnThisDay ? 1 : 0))
  const unlimited = cap === null
  const full = !unlimited && !!dateKey && othersUsed >= cap
  const percent = unlimited || cap === 0 ? 0 : Math.min(100, Math.round((used / cap) * 100))
  return { cap, used, othersUsed, ownOnThisDay, unlimited, full, percent }
}

/* ---------------------------------------------------------------------------
 * Missing slots (admin)
 * ------------------------------------------------------------------------- */

export const submissionSubjectId = (submission) =>
  submission?.subject_id ?? submission?.subjectId ?? submission?.subject?.id ?? null

/**
 * Approved submissions whose subject has no slot in the schedule. IDs are
 * compared as strings (the API may send numbers or UUID strings), duplicate
 * submissions for one subject collapse into a single entry, and a submission
 * with no resolvable subject id is keyed by its own id so it is never hidden.
 */
export const getMissingSlotSubmissions = (submissions, slots) => {
  const scheduled = new Set(
    (Array.isArray(slots) ? slots : [])
      .map(slotSubjectId)
      .filter((id) => id !== null && id !== undefined && id !== '')
      .map(String)
  )
  const seen = new Set()
  const missing = []
  for (const submission of Array.isArray(submissions) ? submissions : []) {
    if (String(submission?.status || '').toLowerCase() !== 'approved') continue
    const subjectId = submissionSubjectId(submission)
    const key = subjectId !== null && subjectId !== undefined && subjectId !== ''
      ? `subject:${subjectId}`
      : `submission:${submission?.id}`
    if (subjectId !== null && scheduled.has(String(subjectId))) continue
    if (seen.has(key)) continue
    seen.add(key)
    missing.push(submission)
  }
  return missing
}

/* ---------------------------------------------------------------------------
 * Error mapping
 * ------------------------------------------------------------------------- */

/** Human-readable message from any thrown value; never "[object Object]". */
export const slotErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const candidates = [error?.message, error?.data?.message, typeof error === 'string' ? error : '']
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && !/^<(!doctype|html)/i.test(candidate.trim())) {
      return candidate.trim()
    }
  }
  return fallback
}

/** First Laravel-style field error for any of the given keys, if present. */
export const firstFieldError = (error, keys) => {
  const errors = error?.data?.errors
  if (!errors || typeof errors !== 'object') return ''
  for (const key of keys) {
    const value = errors[key]
    const text = Array.isArray(value) ? value[0] : value
    if (typeof text === 'string' && text.trim()) return text.trim()
  }
  return ''
}
