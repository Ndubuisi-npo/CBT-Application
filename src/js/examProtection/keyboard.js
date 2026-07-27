/**
 * keyboard.js — blocks keyboard shortcuts that could expose exam content,
 * leak state, or navigate away from the exam while it's active.
 *
 * Only Backspace is context-aware (allowed while typing in an editable
 * field, blocked otherwise so it can't trigger back-navigation). Every
 * other shortcut here is blocked outright while protection is enabled —
 * this includes Ctrl/Cmd+C/V/X/A even inside answer inputs, per spec.
 */

const isEditable = (el) => {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

function isBlockedCombo(e) {
  const key = e.key
  const lower = typeof key === 'string' ? key.toLowerCase() : ''
  const mod = isMac() ? e.metaKey : e.ctrlKey
  const otherMod = isMac() ? e.ctrlKey : e.metaKey // guard against the "other" OS's modifier too

  // DevTools
  if (key === 'F12') return true
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(lower)) return true
  if (isMac() && e.metaKey && e.altKey && lower === 'i') return true

  // View source / save / print / find
  if (mod && lower === 'u') return true
  if (mod && lower === 's') return true
  if (mod && lower === 'p') return true
  if (mod && lower === 'f') return true

  // Reload
  if (key === 'F5') return true
  if (mod && (lower === 'r')) return true // covers Ctrl/Cmd+R and, with shiftKey, hard reload

  // Address bar / new-open-close/reopen tab
  if (mod && lower === 'l') return true
  if (e.altKey && lower === 'd') return true
  if (mod && lower === 't') return true
  if (mod && lower === 'w') return true
  if (mod && e.shiftKey && lower === 't') return true

  // History navigation
  if (e.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) return true
  if (key === 'Backspace' && !isEditable(document.activeElement)) return true

  // Copy / cut / paste / select-all
  if (mod && ['c', 'v', 'x', 'a'].includes(lower)) return true

  // Zoom
  if (mod && (key === '+' || key === '-' || key === '=' || key === '0')) return true

  // Belt-and-braces: block the "other" OS modifier combos too, in case of
  // odd keyboard layouts/remote sessions reporting the wrong modifier.
  if (otherMod && lower === 'u') return true

  return false
}

let handler = null

export function attachKeyboardBlockers() {
  detachKeyboardBlockers()

  handler = (e) => {
    if (isBlockedCombo(e)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  document.addEventListener('keydown', handler, true)

  return detachKeyboardBlockers
}

export function detachKeyboardBlockers() {
  if (handler) {
    document.removeEventListener('keydown', handler, true)
    handler = null
  }
}
