/**
 * tourManager.js
 *
 * Navigation-aware Product Tour engine built on top of Driver.js.
 *
 * Why not just hand Driver.js a `steps` array?
 * ---------------------------------------------
 * Driver.js's built-in `steps` + next/previous flow assumes every step's
 * target element already exists in the DOM. Our tour spans multiple
 * routes (Dashboard -> Teachers -> Create Teacher -> ... -> Settings), and
 * several pages fetch data from the API before rendering their targets.
 *
 * So instead we drive Driver.js one step at a time via its imperative
 * `highlight()` API, and this module owns step sequencing: navigating the
 * Vue Router, waiting for the element to exist, running "intelligent"
 * setup (expand sidebar, open a drawer, switch a tab) before highlighting,
 * and gracefully skipping any step whose target never appears (e.g. a
 * feature hidden by permissions) instead of ever showing a Driver.js
 * "Target element not found" error.
 */

import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour-theme.css'

import router from '../router'
import { waitForElement, navigateTo } from './tourDom'
import {
  isTourCompleted,
  markTourCompleted,
  saveTourProgress,
  loadTourProgress,
  clearTourProgress,
} from './tourStorage'
import { getSchoolAdminTourSteps } from './schoolAdminTour'
import { getTeacherTourSteps } from './teacherTour'

const TOUR_BUILDERS = {
  school_admin: getSchoolAdminTourSteps,
  teacher: getTeacherTourSteps,
}

let driverInstance = null
let currentSteps = []
let currentIndex = 0
let currentRole = null
let isActive = false
// Monotonically increasing token — guards against a stale, in-flight
// waitForElement()/navigation resolving after the tour has already been
// destroyed or restarted (prevents race conditions).
let runToken = 0

function getDriver() {
  if (driverInstance) return driverInstance

  driverInstance = driver({
    animate: true,
    smoothScroll: true,
    // The user must use the in-popover Next / Back / Skip Tour controls —
    // clicking the dimmed overlay or pressing ESC must NOT dismiss the tour.
    allowClose: false,
    allowKeyboardControl: true,
    overlayColor: '#0B1F3A',
    overlayOpacity: 0.65,
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: 'cbt-tour-popover',
    // Inject a custom "Skip Tour" button directly beside Next/Back.
    // Driver.js only ships next/previous/close buttons natively (no
    // built-in "skip"), so we build one ourselves via the popover-render
    // hook and drop it into the same nav-buttons container as Next — this
    // fires fresh on every highlight() call, so there's no risk of
    // duplicate buttons accumulating across steps.
    onPopoverRender: (popoverDom) => {
      const skipBtn = document.createElement('button')
      skipBtn.type = 'button'
      skipBtn.textContent = 'Skip Tour'
      skipBtn.classList.add('cbt-tour-skip-btn')
      skipBtn.addEventListener('click', () => {
        void skipTour()
      })
      popoverDom.footerButtons.appendChild(skipBtn)
    },
  })

  return driverInstance
}

function isMyRun(token) {
  return token === runToken && isActive
}

async function renderStep(index) {
  const token = runToken

  if (index < 0) return
  if (!currentSteps.length || index >= currentSteps.length) {
    finishTour()
    return
  }

  const step = currentSteps[index]
  currentIndex = index
  saveTourProgress(currentRole, index)

  // 1) Auto-navigate to the step's route if we're not already there.
  if (step.route) {
    const navigated = await navigateTo(router, step.route)
    if (!navigated) {
      // Navigation guard rejected/aborted — skip this step rather than crash.
      if (isMyRun(token)) void renderStep(index + 1)
      return
    }
  }

  if (!isMyRun(token)) return

  // 2) "Intelligent" prep — expand sidebar, open drawer/modal, switch tab...
  if (typeof step.beforeShow === 'function') {
    try {
      await step.beforeShow()
    } catch {
      // Prep failing shouldn't crash the tour — we still try to find the
      // element; if it's not there, the step is skipped gracefully below.
    }
  }

  if (!isMyRun(token)) return

  // 3) Wait for the target element (handles API-loaded content).
  const el = await waitForElement(step.selector, { timeout: step.timeout || 6000 })

  if (!isMyRun(token)) return

  if (!el) {
    // Graceful failure: feature not present (e.g. permissions), or the
    // page didn't render it in time. Never show a broken highlight —
    // just move on to the next step.
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[ProductTour] Skipping step "${step.id}" — element not found: ${step.selector}`)
    }
    void renderStep(index + 1)
    return
  }

  const isFirst = index === 0
  const isLast = index === currentSteps.length - 1
  const d = getDriver()

  d.highlight({
    element: el,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side || 'bottom',
      align: step.align || 'start',
      // No "close" button here — the corner X is intentionally hidden.
      // Exiting the tour is only possible via the explicit "Skip Tour"
      // button injected in onPopoverRender (see getDriver()).
      showButtons: ['next', 'previous'].filter((btn) => btn !== 'previous' || !isFirst),
      showProgress: true,
      progressText: `Step ${index + 1} of ${currentSteps.length}`,
      nextBtnText: isLast ? 'Finish' : 'Next',
      prevBtnText: 'Back',
      onNextClick: () => {
        void renderStep(index + 1)
      },
      onPrevClick: () => {
        void renderStep(index - 1)
      },
    },
    // Most steps should block interaction with the underlying page so the
    // user follows the narrative; steps that explicitly want the user to
    // interact (e.g. "now fill in the title") opt out via allowInteraction.
    disableActiveInteraction: !step.allowInteraction,
  })
}

function finishTour() {
  if (currentRole) markTourCompleted(currentRole)
  teardown()
}

async function skipTour() {
  if (currentRole) markTourCompleted(currentRole)
  teardown()
}

function teardown() {
  isActive = false
  runToken += 1
  if (driverInstance) {
    driverInstance.destroy()
  }
  currentSteps = []
  currentIndex = 0
}

/**
 * Start a role's tour from the beginning.
 * @param {'school_admin'|'teacher'} role
 */
export async function startRoleTour(role) {
  const buildSteps = TOUR_BUILDERS[role]
  if (!buildSteps) return // students (or any other role) never get a tour

  teardown()
  runToken += 1
  isActive = true
  currentRole = role
  currentSteps = buildSteps()
  clearTourProgress(role)
  await renderStep(0)
}

/**
 * Resume a previously interrupted tour (e.g. page refresh mid-tour), or
 * start fresh if there is no saved progress / it's already completed.
 */
export async function resumeTour(role) {
  if (isTourCompleted(role)) return
  const buildSteps = TOUR_BUILDERS[role]
  if (!buildSteps) return

  const savedIndex = loadTourProgress(role)

  teardown()
  runToken += 1
  isActive = true
  currentRole = role
  currentSteps = buildSteps()
  await renderStep(savedIndex ?? 0)
}

/** Explicitly restart the tour (used by the "Take Product Tour" button). */
export async function restartTour(role) {
  await startRoleTour(role)
}

/** Reset completion state without starting the tour (rarely needed directly). */
export { resetTourCompletion } from './tourStorage'

export function isTourRunning() {
  return isActive
}

/**
 * Auto-start logic for first-time users. Call once per authenticated
 * dashboard mount. Only ever triggers for school_admin / teacher roles —
 * students never reach this because the caller gates on role first.
 */
export async function autoStartIfFirstLogin(role) {
  if (!TOUR_BUILDERS[role]) return
  if (isTourCompleted(role)) return
  if (isActive) return
  await startRoleTour(role)
}

export { isTourCompleted } from './tourStorage'
