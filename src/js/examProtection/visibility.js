/**
 * visibility.js — detects tab switches, window blur, and page hidden
 * state. Reports hide/show through callbacks so the exam page can render
 * a blocking overlay; does NOT touch timers or auto-save, those keep
 * running underneath exactly as they do today.
 */

let visHandler = null
let blurHandler = null
let focusHandler = null

/**
 * @param {{ onHide: () => void, onShow: () => void }} callbacks
 */
export function attachVisibilityGuard({ onHide, onShow } = {}) {
  detachVisibilityGuard()

  visHandler = () => {
    if (document.visibilityState === 'hidden') onHide?.()
    else onShow?.()
  }

  blurHandler = () => onHide?.()
  focusHandler = () => {
    // Only clear the overlay on focus if the tab is actually visible —
    // avoids a flicker where focus fires just before visibilitychange.
    if (document.visibilityState === 'visible') onShow?.()
  }

  document.addEventListener('visibilitychange', visHandler)
  window.addEventListener('blur', blurHandler)
  window.addEventListener('focus', focusHandler)

  return detachVisibilityGuard
}

export function detachVisibilityGuard() {
  if (visHandler) document.removeEventListener('visibilitychange', visHandler)
  if (blurHandler) window.removeEventListener('blur', blurHandler)
  if (focusHandler) window.removeEventListener('focus', focusHandler)
  visHandler = blurHandler = focusHandler = null
}
