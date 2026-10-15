/**
 * ExamProtection — reusable, framework-light anti-cheat module.
 *
 * Philosophy: prevent, don't detect. There is no violation counter, no
 * strike system — protections simply make the disallowed actions not
 * work while an exam is active, and disappear the moment it isn't.
 *
 * Usage (from an exam-taking component):
 *   import { enableProtection, disableProtection, protectionState } from '@/js/examProtection'
 *   onMounted(() => enableProtection())
 *   onUnmounted(() => disableProtection())
 *   // on submit/timeout/cancel: disableProtection()
 *
 * `protectionState` is a Vue-reactive object the component can read in its
 * template to render the visibility overlay / fullscreen-re-entry prompt.
 * Everything else (keyboard, mouse, clipboard, history-trap, styles) is
 * self-contained and needs no template wiring.
 */

import { reactive } from 'vue'
import { attachKeyboardBlockers } from './keyboard'
import { attachMouseGuards } from './mouse'
import { attachClipboardGuards } from './clipboard'
import { attachFullscreenGuard, requestFullscreen, exitFullscreen } from './fullscreen'
import { attachVisibilityGuard } from './visibility'
import { attachNavigationGuard, detachNavigationGuard } from './navigation'
import { injectProtectionStyles, removeProtectionStyles, setContentObscured } from './styles'

export const protectionState = reactive({
  active: false,
  // Tab hidden / window blurred — interface is covered, timers/auto-save
  // keep running underneath.
  overlayVisible: false,
  // Fullscreen was exited and the browser refused a silent re-request —
  // needs a real click from the student to re-enter.
  fullscreenPromptVisible: false,
  // First Back attempt is trapped silently; a repeated attempt surfaces the
  // "Leave Exam?" confirmation dialog. Shared by the full exam-taking
  // protection suite (enableProtection) and the lighter, navigation-only
  // guard used on the Instructions page (enableBackNavigationGuard) so both
  // pages present the exact same dialog/behavior.
  leaveConfirmVisible: false,
})

let cleanupFns = []
let backGuardCleanup = null

/**
 * Single source of truth for the "trap Back, and on a repeated attempt show
 * the Leave Exam? dialog" behavior. Used by both enableProtection() (full
 * exam-taking protection) and enableBackNavigationGuard() (Instructions
 * page) so the two never drift apart.
 */
function createNavigationGuardCleanup() {
  return attachNavigationGuard({
    onBackAttempt: (count) => {
      if (count > 1) {
        protectionState.leaveConfirmVisible = true
      }
    },
  })
}

/**
 * @param {{ fullscreen?: boolean }} options fullscreen defaults to true;
 *   set false for environments where it's inappropriate (e.g. embedded
 *   preview/testing) without touching the rest of the protection set.
 */
export function enableProtection(options = {}) {
  if (protectionState.active) return
  const { fullscreen = true } = options

  protectionState.active = true
  protectionState.overlayVisible = false
  protectionState.fullscreenPromptVisible = false
  protectionState.leaveConfirmVisible = false

  injectProtectionStyles()

  cleanupFns = [
    attachKeyboardBlockers(),
    attachMouseGuards(),
    attachClipboardGuards(),
    attachVisibilityGuard({
      onHide: () => {
        protectionState.overlayVisible = true
        setContentObscured(true)
      },
      onShow: () => {
        protectionState.overlayVisible = false
        setContentObscured(false)
      },
    }),
    createNavigationGuardCleanup(),
  ]

  if (fullscreen) {
    cleanupFns.push(
      attachFullscreenGuard({
        onNeedsPrompt: () => {
          protectionState.fullscreenPromptVisible = true
        },
        onEntered: () => {
          protectionState.fullscreenPromptVisible = false
        },
      }),
    )
    requestFullscreen().catch(() => {
      // Refused (no user gesture yet, e.g. programmatic exam auto-start) —
      // surface the same prompt so the student's next click grants it.
      protectionState.fullscreenPromptVisible = true
    })
  }
}

export function disableProtection() {
  if (!protectionState.active) {
    exitFullscreen().catch(() => {})
    protectionState.overlayVisible = false
    protectionState.fullscreenPromptVisible = false
    protectionState.leaveConfirmVisible = false
    return
  }

  cleanupFns.forEach((fn) => fn && fn())
  cleanupFns = []

  removeProtectionStyles()
  exitFullscreen().catch(() => {})

  protectionState.active = false
  protectionState.overlayVisible = false
  protectionState.fullscreenPromptVisible = false
  protectionState.leaveConfirmVisible = false
}

/**
 * Called from the fullscreen-prompt button's click handler — a real user
 * gesture, so the browser will grant it even after a silent auto-request
 * was refused.
 */
export function reenterFullscreen() {
  return requestFullscreen().then(() => {
    protectionState.fullscreenPromptVisible = false
  })
}

/**
 * Lightweight counterpart to enableProtection() for pages that only need
 * the Back-gesture trap + "Leave Exam?" dialog (e.g. the Instructions page,
 * before the full exam anti-cheat suite is active), reusing the exact same
 * navigation.js trap and protectionState.leaveConfirmVisible flag as
 * enableProtection() so the two pages behave identically. Safe to call
 * alongside enableProtection() (e.g. handing off from Instructions into the
 * Exam page): calling either enable function tears down and replaces any
 * previous navigation guard first.
 */
export function enableBackNavigationGuard() {
  if (backGuardCleanup) return
  protectionState.leaveConfirmVisible = false
  backGuardCleanup = createNavigationGuardCleanup()
}

export function disableBackNavigationGuard() {
  if (backGuardCleanup) {
    backGuardCleanup()
    backGuardCleanup = null
  }
  protectionState.leaveConfirmVisible = false
}

/** "Stay" button handler: dismiss the dialog, remain on the page. */
export function dismissLeaveConfirm() {
  protectionState.leaveConfirmVisible = false
}

export { requestFullscreen, exitFullscreen, detachNavigationGuard }
