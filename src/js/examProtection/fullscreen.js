/**
 * fullscreen.js — keeps the exam in fullscreen. Browsers require a genuine
 * user gesture to grant fullscreen, so an automatic re-request after an
 * exit will often be silently refused; when that happens we surface a
 * prompt (via onNeedsPrompt) so the student's next click satisfies the
 * gesture requirement.
 */

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  )
}

export function requestFullscreen(el = document.documentElement) {
  const request =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen

  if (!request) return Promise.reject(new Error('Fullscreen API unavailable'))
  return request.call(el)
}

export function exitFullscreen() {
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen

  if (!getFullscreenElement() || !exit) return Promise.resolve()
  return exit.call(document)
}

let changeHandler = null
let intentionalExit = false

/**
 * @param {{ onNeedsPrompt: () => void, onEntered: () => void }} callbacks
 */
export function attachFullscreenGuard({ onNeedsPrompt, onEntered } = {}) {
  detachFullscreenGuard()
  intentionalExit = false

  changeHandler = () => {
    if (getFullscreenElement()) {
      onEntered?.()
      return
    }
    if (intentionalExit) return

    // Try to silently recover fullscreen. Browsers usually refuse this
    // without a fresh click, in which case the catch fires and we ask the
    // student to click their way back in.
    requestFullscreen().catch(() => {
      onNeedsPrompt?.()
    })
  }

  document.addEventListener('fullscreenchange', changeHandler)
  document.addEventListener('webkitfullscreenchange', changeHandler)
  document.addEventListener('mozfullscreenchange', changeHandler)
  document.addEventListener('MSFullscreenChange', changeHandler)

  return detachFullscreenGuard
}

export function detachFullscreenGuard() {
  intentionalExit = true
  if (changeHandler) {
    document.removeEventListener('fullscreenchange', changeHandler)
    document.removeEventListener('webkitfullscreenchange', changeHandler)
    document.removeEventListener('mozfullscreenchange', changeHandler)
    document.removeEventListener('MSFullscreenChange', changeHandler)
    changeHandler = null
  }
}
