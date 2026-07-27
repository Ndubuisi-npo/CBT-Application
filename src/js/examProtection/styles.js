/**
 * styles.js — the CSS half of protection. Handles what's cheaper/more
 * reliable to do declaratively than via JS event handlers: unselectable
 * text, no image dragging, no mobile touch callout, blocked printing, and
 * obscuring content while the tab is hidden (screenshot deterrence — a
 * best effort; OS-level screenshots can't be blocked from the browser).
 */

const STYLE_ID = 'exam-protection-styles'
const HIDDEN_CLASS = 'exam-protection-hidden'
const ROOT_CLASS = 'exam-protection-active'

const CSS = `
.${ROOT_CLASS} {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.${ROOT_CLASS} input,
.${ROOT_CLASS} textarea,
.${ROOT_CLASS} [contenteditable="true"] {
  -webkit-user-select: text;
  -moz-user-select: text;
  user-select: text;
}

.${ROOT_CLASS} img {
  -webkit-user-drag: none;
  user-drag: none;
  pointer-events: auto;
}

.${HIDDEN_CLASS} {
  filter: blur(24px);
}

@media print {
  .${ROOT_CLASS}::before {
    content: "Printing is disabled during an active exam.";
    display: block;
    text-align: center;
    padding: 2rem;
  }
  .${ROOT_CLASS} > * {
    display: none !important;
  }
}
`

export function injectProtectionStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
  document.documentElement.classList.add(ROOT_CLASS)
}

export function removeProtectionStyles() {
  document.documentElement.classList.remove(ROOT_CLASS)
  document.documentElement.classList.remove(HIDDEN_CLASS)
  const el = document.getElementById(STYLE_ID)
  if (el) el.remove()
}

export function setContentObscured(obscured) {
  document.documentElement.classList.toggle(HIDDEN_CLASS, obscured)
}
