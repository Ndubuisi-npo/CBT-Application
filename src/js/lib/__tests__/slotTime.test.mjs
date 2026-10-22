// Run with: node --test src/js/lib/__tests__/slotTime.test.mjs   (Node 22+)
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  lagosLocalToIso, toLagosLocalInput, toLagosDateKey, toLagosTimeInput, addMinutesToLagosLocal,
  formatSlotTime, formatSlotDate, formatSlotDateTime, computeDayCapacity, normalizeScheduleSubjectMeta,
  getMissingSlotSubmissions, groupSlotsByDay, slotDurationMinutes, slotErrorMessage, firstFieldError,
  lagosLocalToDate, formatDuration,
} from '../slotTime.js'

test('serializes Lagos wall-clock time with explicit +01:00 offset', () => {
  assert.equal(lagosLocalToIso('2026-09-08T09:00'), '2026-09-08T09:00:00+01:00')
  assert.equal(new Date(lagosLocalToIso('2026-09-08T09:00')).toISOString(), '2026-09-08T08:00:00.000Z')
})

test('round trip: UTC from backend displays as intended Lagos time and does not shift on re-edit', () => {
  const fromApi = '2026-09-08T08:00:00.000000Z'
  assert.equal(toLagosLocalInput(fromApi), '2026-09-08T09:00')
  assert.equal(formatSlotTime(fromApi), '09:00 AM')
  assert.equal(formatSlotDateTime('2026-10-22T09:51:00+00:00'), 'Oct 22, 2026, 10:51 AM')
  assert.equal(toLagosTimeInput(fromApi), '09:00')
  // edit again without changes -> identical instant
  const again = lagosLocalToIso(toLagosLocalInput(fromApi))
  assert.equal(new Date(again).toISOString(), '2026-09-08T08:00:00.000Z')
})

test('result is independent of the machine timezone', () => {
  const moduleUrl = new URL('../slotTime.js', import.meta.url).href
  const code = `import('${moduleUrl}').then(m=>console.log(m.lagosLocalToIso('2026-09-08T09:00'), m.toLagosDateKey('2026-09-08T23:30:00Z'), m.formatSlotDateTime('2026-10-22T09:51:00Z')))`
  for (const tz of ['UTC', 'America/New_York', 'Asia/Tokyo', 'Africa/Lagos']) {
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, TZ: tz } }).toString().trim()
    assert.equal(out, '2026-09-08T09:00:00+01:00 2026-09-09 Oct 22, 2026, 10:51 AM', `TZ=${tz}`)
  }
})

test('late-evening UTC lands on the next Lagos day (date key used by daily_usage)', () => {
  assert.equal(toLagosDateKey('2026-09-08T23:30:00Z'), '2026-09-09')
  assert.equal(formatSlotDate('2026-09-08T23:30:00Z').includes('9'), true)
})

test('rejects impossible/malformed input', () => {
  assert.equal(lagosLocalToIso('2026-02-31T09:00'), null)
  assert.equal(lagosLocalToIso('2026-09-08'), null)
  assert.equal(lagosLocalToIso(''), null)
  assert.equal(lagosLocalToDate('2026-09-08T25:00'), null)
})

test('addMinutesToLagosLocal', () => {
  assert.equal(addMinutesToLagosLocal('2026-09-08T09:00', 60), '2026-09-08T10:00')
  assert.equal(addMinutesToLagosLocal('2026-09-08T23:30', 60), '2026-09-09T00:30')
})

test('meta normalization: null cap = unlimited, PHP empty array usage', () => {
  assert.deepEqual(normalizeScheduleSubjectMeta(undefined), { daily_cap: null, daily_usage: {} })
  assert.deepEqual(normalizeScheduleSubjectMeta({ daily_cap: null, daily_usage: [] }), { daily_cap: null, daily_usage: {} })
  assert.deepEqual(normalizeScheduleSubjectMeta({ daily_cap: '3', daily_usage: { '2026-09-08': 2 } }), { daily_cap: 3, daily_usage: { '2026-09-08': 2 } })
})

test('capacity: shows usage, flags a full day', () => {
  const meta = { daily_cap: 3, daily_usage: { '2026-09-08': 2, '2026-09-09': 3 } }
  assert.deepEqual(
    (({ used, full, unlimited }) => ({ used, full, unlimited }))(computeDayCapacity({ meta, dateKey: '2026-09-08' })),
    { used: 2, full: false, unlimited: false })
  assert.equal(computeDayCapacity({ meta, dateKey: '2026-09-09' }).full, true)
  assert.equal(computeDayCapacity({ meta, dateKey: '2026-09-10' }).used, 0)
})

test('capacity: null cap is unlimited and never full', () => {
  const c = computeDayCapacity({ meta: { daily_cap: null, daily_usage: { '2026-09-08': 99 } }, dateKey: '2026-09-08' })
  assert.equal(c.unlimited, true)
  assert.equal(c.full, false)
})

test('capacity: moving own slot within a full day does not double count it', () => {
  const meta = { daily_cap: 3, daily_usage: { '2026-09-08': 3 } }
  const ownSlot = { starts_at: '2026-09-08T08:00:00Z' } // 09:00 Lagos, same day
  const same = computeDayCapacity({ meta, dateKey: '2026-09-08', ownSlot })
  assert.equal(same.othersUsed, 2)
  assert.equal(same.full, false)
  // moving to a different, full day is still blocked
  const metaOther = { daily_cap: 3, daily_usage: { '2026-09-08': 1, '2026-09-09': 3 } }
  assert.equal(computeDayCapacity({ meta: metaOther, dateKey: '2026-09-09', ownSlot }).full, true)
})

test('missing slots: approved only, string-vs-number ids, duplicates collapse', () => {
  const slots = [{ id: 's1', subject_id: 7 }, { id: 's2', subject: { id: 'abc' } }]
  const subs = [
    { id: 1, status: 'approved', subject_id: '7' },          // scheduled (id type differs)
    { id: 2, status: 'approved', subject_id: 'abc' },        // scheduled via nested subject
    { id: 3, status: 'approved', subject_id: 'm1' },         // missing
    { id: 4, status: 'APPROVED', subjectId: 'm1' },          // duplicate subject -> one entry
    { id: 5, status: 'submitted', subject_id: 'x' },         // not approved
    { id: 6, status: 'approved', subject: { id: 'e1' } },    // missing via nested
    { id: 7, status: 'approved' },                           // no subject id -> kept, keyed by submission
  ]
  const missing = getMissingSlotSubmissions(subs, slots)
  assert.deepEqual(missing.map((m) => m.id), [3, 6, 7])
  assert.deepEqual(getMissingSlotSubmissions([], slots), [])
  assert.deepEqual(getMissingSlotSubmissions(subs, null).length, 5)
})

test('groupSlotsByDay sorts by time and groups by Lagos day', () => {
  const groups = groupSlotsByDay([
    { id: 'b', starts_at: '2026-09-09T08:00:00Z' },
    { id: 'a', starts_at: '2026-09-08T08:00:00Z' },
    { id: 'c', starts_at: '2026-09-08T10:00:00Z' },
  ])
  assert.deepEqual(groups.map((g) => [g.key, g.slots.map((s) => s.id)]), [['2026-09-08', ['a', 'c']], ['2026-09-09', ['b']]])
})

test('duration helpers', () => {
  assert.equal(slotDurationMinutes({ duration_minutes: 90 }), 90)
  assert.equal(slotDurationMinutes({ starts_at: '2026-09-08T08:00:00Z', ends_at: '2026-09-08T09:15:00Z' }), 75)
  assert.equal(formatDuration(75), '1h 15m')
  assert.equal(formatDuration(60), '1h')
  assert.equal(formatDuration(0), '')
})

test('error helpers keep backend message verbatim and avoid junk', () => {
  const msg = 'Mathematics overlaps English (09:00–10:00) on 2026-09-08.'
  assert.equal(slotErrorMessage({ message: msg, status: 422 }), msg)
  assert.equal(slotErrorMessage({ data: { message: msg } }), msg)
  assert.equal(slotErrorMessage({ message: '<!DOCTYPE html><html>' }, 'fallback'), 'fallback')
  assert.equal(slotErrorMessage({}, 'fallback'), 'fallback')
  assert.equal(firstFieldError({ data: { errors: { ends_at: ['End must be after start.'] } } }, ['ends_at']), 'End must be after start.')
  assert.equal(firstFieldError({}, ['ends_at']), '')
})
