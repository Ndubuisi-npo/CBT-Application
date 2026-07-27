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
import { attachNavigationGuard } from './navigation'
import { injectProtectionStyles, removeProtectionStyles, setContentObscured } from './styles'

export const protectionState = reactive({
  active: false,
  // Tab hidden / window blurred — interface is covered, timers/auto-save
  // keep running underneath.
  overlayVisible: false,
  // Fullscreen was exited and the browser refused a silent re-request —
  // needs a real click from the student to re-enter.
  fullscreenPromptVisible: false,
})

let cleanupFns = []

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
    attachNavigationGuard(),
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
  if (!protectionState.active) return

  cleanupFns.forEach((fn) => fn && fn())
  cleanupFns = []

  removeProtectionStyles()
  exitFullscreen().catch(() => {})

  protectionState.active = false
  protectionState.overlayVisible = false
  protectionState.fullscreenPromptVisible = false
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
