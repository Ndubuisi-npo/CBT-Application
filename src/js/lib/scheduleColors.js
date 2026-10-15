// Deterministic "random" color per scheduled assessment. Deterministic (not
// Math.random() on every render) so the same assessment always gets the same
// color across re-renders, month navigation, and the admin/teacher calendars.

const PALETTE = [
  '#D4AF37', // gold (brand accent)
  '#2563EB', // blue
  '#DC2626', // red
  '#059669', // emerald
  '#7C3AED', // violet
  '#EA580C', // orange
  '#0891B2', // cyan
  '#DB2777', // pink
  '#65A30D', // lime
  '#4F46E5', // indigo
]

const hashString = (value) => {
  const str = String(value ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Stable hex color for a given assessment id (or any string/number key). */
export const getScheduleColor = (id) => PALETTE[hashString(id) % PALETTE.length]

/** hex -> "r, g, b" so callers can build rgba() at whatever alpha they need. */
export const hexToRgb = (hex) => {
  const clean = (hex || '').replace('#', '')
  const bigint = parseInt(clean, 16)
  if (Number.isNaN(bigint)) return '11, 31, 58' // fallback: EduCBT navy
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r}, ${g}, ${b}`
}

const pad = (n) => String(n).padStart(2, '0')
export const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * All 'YYYY-MM-DD' keys spanning [start, end] inclusive (date-only, ignores
 * time-of-day). Used to tint every day a multi-day assessment window touches
 * — scheduled_date through assessment_ends — with that assessment's color.
 * Capped at 62 days so a bad/missing end date can't hang the calendar.
 */
export const getDateRangeKeys = (start, end) => {
  const startKey = toDateKey(start)
  if (!startKey) return []
  const endKey = toDateKey(end) || startKey
  if (endKey <= startKey) return [startKey]

  const keys = []
  const cursor = new Date(`${startKey}T00:00:00`)
  const last = new Date(`${endKey}T00:00:00`)
  let guard = 0
  while (cursor.getTime() <= last.getTime() && guard < 62) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }
  return keys
}
