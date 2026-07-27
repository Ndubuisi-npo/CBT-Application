/**
 * navigation.js — discourages leaving the exam via refresh/close (native
 * beforeunload confirm) and via the back button (history trap).
 *
 * Browsers do not allow a page to truly block navigation or customize the
 * beforeunload message anymore — this is intentionally best-effort, not a
 * hard guarantee.
 */

let beforeUnloadHandler = null
let popStateHandler = null

export function attachNavigationGuard({ onBackAttempt } = {}) {
  detachNavigationGuard()

  beforeUnloadHandler = (e) => {
    e.preventDefault()
    e.returnValue = '' // required for Chrome to show the native confirm dialog
    return ''
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)

  // Push a guard state so the first Back press hits this state instead of
  // leaving the exam route, then immediately re-push to keep trapping it.
  history.pushState({ examGuard: true }, '', window.location.href)
  popStateHandler = () => {
    history.pushState({ examGuard: true }, '', window.location.href)
    onBackAttempt?.()
  }
  window.addEventListener('popstate', popStateHandler)

  return detachNavigationGuard
}

export function detachNavigationGuard() {
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    beforeUnloadHandler = null
  }
  if (popStateHandler) {
    window.removeEventListener('popstate', popStateHandler)
    popStateHandler = null
  }
}
