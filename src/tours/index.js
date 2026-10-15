/**
 * index.js (src/tours)
 *
 * Public entry point for the Product Tour feature.
 *
 * Performance requirement: Driver.js (and this whole module graph) must
 * never be downloaded or initialized for students. Every function here is
 * `async` and dynamically `import()`s the real engine (tourManager.js,
 * which is what pulls in the `driver.js` package) — so for students the
 * `import('./tourManager')` line is simply never reached, and Vite will
 * never even fetch that chunk.
 */

const TOUR_ROLES = new Set(['school_admin', 'teacher'])

export function isTourEligibleRole(role) {
  return TOUR_ROLES.has(role)
}

/** Auto-start the tour for a brand new user on their first dashboard visit. */
export async function autoStartProductTour(role) {
  if (!isTourEligibleRole(role)) return
  const { autoStartIfFirstLogin } = await import('./tourManager')
  await autoStartIfFirstLogin(role)
}

/** Resume an interrupted tour (e.g. after a full page reload mid-tour). */
export async function resumeProductTour(role) {
  if (!isTourEligibleRole(role)) return
  const { resumeTour } = await import('./tourManager')
  await resumeTour(role)
}

/** Used by the "Take Product Tour" button in the profile dropdown. */
export async function restartProductTour(role) {
  if (!isTourEligibleRole(role)) return
  const { restartTour } = await import('./tourManager')
  await restartTour(role)
}

export async function hasCompletedProductTour(role) {
  if (!isTourEligibleRole(role)) return true
  const { isTourCompleted } = await import('./tourStorage')
  return isTourCompleted(role)
}
