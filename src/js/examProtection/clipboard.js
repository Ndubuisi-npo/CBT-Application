/**
 * clipboard.js — blocks copy/cut/paste at the event level (catches
 * context-menu copy, drag-copy, and other paths keyboard blocking alone
 * doesn't cover) and best-effort clears the clipboard on activation.
 *
 * Browsers only allow clipboard writes with explicit permission/a secure
 * context; the clear is wrapped so a rejection never breaks the exam.
 */

let copyHandler = null
let cutHandler = null
let pasteHandler = null

export function attachClipboardGuards() {
  detachClipboardGuards()

  const block = (e) => e.preventDefault()
  copyHandler = block
  cutHandler = block
  pasteHandler = block

  document.addEventListener('copy', copyHandler, true)
  document.addEventListener('cut', cutHandler, true)
  document.addEventListener('paste', pasteHandler, true)

  clearClipboardBestEffort()

  return detachClipboardGuards
}

export function detachClipboardGuards() {
  if (copyHandler) document.removeEventListener('copy', copyHandler, true)
  if (cutHandler) document.removeEventListener('cut', cutHandler, true)
  if (pasteHandler) document.removeEventListener('paste', pasteHandler, true)
  copyHandler = cutHandler = pasteHandler = null
}

function clearClipboardBestEffort() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {})
    }
  } catch {
    // Clipboard API unavailable or permission denied — nothing further we can do.
  }
}
