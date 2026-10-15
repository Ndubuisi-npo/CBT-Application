/**
 * mouse.js — blocks the right-click context menu, dragging of text/images,
 * and text selection via mouse. CSS (see styles.js) handles the visual
 * side of "unselectable"; these listeners are the behavioral backstop for
 * browsers/elements CSS alone doesn't fully cover (e.g. images, native
 * drag).
 */

const isEditable = (el) => {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

let contextMenuHandler = null
let dragStartHandler = null
let selectStartHandler = null
let wheelHandler = null
let gestureStartHandler = null

export function attachMouseGuards() {
  detachMouseGuards()

  contextMenuHandler = (e) => {
    e.preventDefault()
  }

  dragStartHandler = (e) => {
    e.preventDefault()
  }

  selectStartHandler = (e) => {
    // Still allow selecting text the student is actively typing into an
    // answer field — only block selection of exam question content.
    if (isEditable(e.target)) return
    e.preventDefault()
  }

  // Ctrl/Cmd + mouse wheel zoom
  wheelHandler = (e) => {
    if (e.ctrlKey || e.metaKey) e.preventDefault()
  }

  // Safari pinch-to-zoom gesture (also fires on some trackpads)
  gestureStartHandler = (e) => e.preventDefault()

  document.addEventListener('contextmenu', contextMenuHandler, true)
  document.addEventListener('dragstart', dragStartHandler, true)
  document.addEventListener('selectstart', selectStartHandler, true)
  document.addEventListener('wheel', wheelHandler, { passive: false, capture: true })
  document.addEventListener('gesturestart', gestureStartHandler, true)

  return detachMouseGuards
}

export function detachMouseGuards() {
  if (contextMenuHandler) {
    document.removeEventListener('contextmenu', contextMenuHandler, true)
    contextMenuHandler = null
  }
  if (dragStartHandler) {
    document.removeEventListener('dragstart', dragStartHandler, true)
    dragStartHandler = null
  }
  if (selectStartHandler) {
    document.removeEventListener('selectstart', selectStartHandler, true)
    selectStartHandler = null
  }
  if (wheelHandler) {
    document.removeEventListener('wheel', wheelHandler, { capture: true })
    wheelHandler = null
  }
  if (gestureStartHandler) {
    document.removeEventListener('gesturestart', gestureStartHandler, true)
    gestureStartHandler = null
  }
}
