/**
 * leaveExam.js — the "Leave" action for the shared "Leave Exam?" dialog.
 *
 * Reused as-is by both the Instructions page and the Exam page so choosing
 * "Leave" always does the same thing regardless of which page it happened
 * on: log the student out (which also tears down Echo — see
 * src/js/lib/auth.js), clear any in-memory exam/session state the caller
 * still holds, and send them to the login page.
 */

import { logout } from '../lib/auth'
import { disableProtection, disableBackNavigationGuard } from './index'

/**
 * @param {import('vue-router').Router} router
 * @param {() => void} [clearLocalState] optional callback for
 *   page-specific in-memory cleanup (answers, timers, attempt id, etc.)
 *   before navigating away.
 */
export async function leaveExam(router, clearLocalState) {
  // Stop trapping Back/refresh and hide any protection UI immediately so
  // the redirect isn't fought by the guard we're about to tear down.
  disableProtection()
  disableBackNavigationGuard()

  clearLocalState?.()

  try {
    await logout()
  } catch {
    // Even if the logout request fails, still get the student off the
    // exam and back to a safe, logged-out-looking screen.
  }

  router.replace({ name: 'Login' })
}
