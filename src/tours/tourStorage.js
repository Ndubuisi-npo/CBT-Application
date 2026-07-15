/**
 * tourStorage.js
 *
 * Persistence layer for the Product Tour.
 *
 * The project does not currently expose a backend "first login" / "has
 * completed onboarding" flag (see src/js/lib/auth.js and the school-admin
 * auth store), so — per the task's fallback instructions — we persist tour
 * completion in localStorage, scoped per-user and per-role so that:
 *   - Two different school admins/teachers sharing a browser each get their
 *     own onboarding the first time they log in.
 *   - Switching roles (e.g. an account that is both convertible) doesn't
 *     skip a role's tour just because another role's tour was completed.
 *
 * If a backend flag (e.g. `user.has_completed_tour`) is added later, only
 * this file needs to change — the rest of the tour system is agnostic to
 * how completion is stored.
 */

import { getAuthUser } from '../js/lib/auth'

const COMPLETED_PREFIX = 'cbt_tour_completed_'
const PROGRESS_PREFIX = 'cbt_tour_progress_'

/**
 * Build a stable identifier for the current user so completion state is
 * scoped correctly, even on a shared browser/computer.
 */
function getUserId() {
  const user = getAuthUser()
  if (!user) return 'anonymous'
  return String(user.id ?? user.user_id ?? user.uuid ?? user.email ?? 'anonymous')
}

function completedKey(role) {
  return `${COMPLETED_PREFIX}${role}_${getUserId()}`
}

function progressKey(role) {
  return `${PROGRESS_PREFIX}${role}_${getUserId()}`
}

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently.
    // The tour will simply run again next time, which is an acceptable
    // degradation rather than a crash.
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/** Has this user already completed (or skipped) the tour for this role? */
export function isTourCompleted(role) {
  return safeGet(completedKey(role)) === 'true'
}

/** Mark the tour as completed (also used when the user skips it). */
export function markTourCompleted(role) {
  safeSet(completedKey(role), 'true')
  safeRemove(progressKey(role))
}

/** Clear completion state so the tour will run again ("Take Product Tour"). */
export function resetTourCompletion(role) {
  safeRemove(completedKey(role))
  safeRemove(progressKey(role))
}

/** Persist the current step index so an interrupted tour can resume. */
export function saveTourProgress(role, stepIndex) {
  safeSet(progressKey(role), String(stepIndex))
}

/** Read back the last saved step index, if any. */
export function loadTourProgress(role) {
  const raw = safeGet(progressKey(role))
  const parsed = raw === null ? null : Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

export function clearTourProgress(role) {
  safeRemove(progressKey(role))
}
