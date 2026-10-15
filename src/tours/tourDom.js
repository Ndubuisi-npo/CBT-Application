/**
 * tourDom.js
 *
 * Reusable, framework-agnostic DOM helpers that make the tour "intelligent":
 * waiting for async-rendered elements, expanding a collapsed sidebar,
 * opening the mobile sidebar/drawers/modals, switching tabs, and expanding
 * accordions before a step is highlighted — so Driver.js never tries to
 * highlight something that isn't visible yet.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Poll the DOM until a selector resolves to a visible element, or give up.
 * Never throws — callers treat a `null` result as "skip this step".
 *
 * @param {string} selector - CSS selector (we standardize on data-tour="...")
 * @param {{ timeout?: number, interval?: number, root?: ParentNode }} options
 * @returns {Promise<Element|null>}
 */
export async function waitForElement(selector, options = {}) {
  const { timeout = 6000, interval = 120, root = document } = options
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const el = root.querySelector(selector)
    if (el && isElementVisible(el)) {
      return el
    }
    await sleep(interval)
  }

  // One last check in case it appeared right at the deadline.
  const el = root.querySelector(selector)
  return el && isElementVisible(el) ? el : null
}

export function isElementVisible(el) {
  if (!el || !(el instanceof Element)) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false
  }
  const rect = el.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0
}

/** Wait one animation frame + a tick — useful after a router.push(). */
export async function waitForRouteRender() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await sleep(60)
}

/**
 * SPA-aware navigation used by the tour manager to move between pages
 * without a full reload. Resolves once the route change has settled (or
 * immediately, if we're already there). Never throws — a rejected
 * navigation guard is treated as "couldn't get there" so the tour can
 * gracefully skip the step instead of crashing.
 */
export async function navigateTo(router, path) {
  if (!path || router.currentRoute.value.path === path) return true
  try {
    await router.push(path)
  } catch {
    return false
  }
  await waitForRouteRender()
  return true
}

/**
 * Ensure the desktop sidebar is expanded (not collapsed to icon-only mode)
 * before we try to highlight a nav item inside it.
 */
export function expandSidebar(uiStore) {
  if (uiStore && uiStore.sidebarCollapsed) {
    uiStore.sidebarCollapsed = false
    try {
      localStorage.setItem('sa_sidebar_collapsed', 'false')
    } catch {
      // ignore
    }
  }
}

/**
 * On mobile, the sidebar is an off-canvas drawer — open it so its nav
 * items are actually in the viewport for highlighting.
 */
export function openMobileSidebarIfNeeded(uiStore) {
  if (window.innerWidth < 1024 && uiStore && !uiStore.mobileSidebarOpen) {
    uiStore.mobileSidebarOpen = true
  }
}

export function closeMobileSidebar(uiStore) {
  if (uiStore && uiStore.mobileSidebarOpen) {
    uiStore.mobileSidebarOpen = false
  }
}

/**
 * Generic "click this trigger if the target isn't already present/open"
 * helper — used for opening drawers/modals/dropdowns whose content only
 * mounts once triggered.
 */
export async function ensureOpenViaTrigger(targetSelector, triggerSelector, opts = {}) {
  const existing = document.querySelector(targetSelector)
  if (existing && isElementVisible(existing)) return existing

  const trigger = document.querySelector(triggerSelector)
  if (trigger) trigger.click()

  return waitForElement(targetSelector, opts)
}

/** Alias kept for readability at call sites / matches required utility name. */
export const openDrawer = ensureOpenViaTrigger
export const openModal = ensureOpenViaTrigger

/** Switch to a tab by clicking a [data-tour-tab="key"] control if needed. */
export async function switchTab(tabTriggerSelector) {
  const trigger = document.querySelector(tabTriggerSelector)
  if (trigger && !trigger.classList.contains('is-active')) {
    trigger.click()
    await sleep(150)
  }
}

/** Expand a collapsed accordion/section if it exposes an [aria-expanded] toggle. */
export async function expandAccordion(toggleSelector) {
  const toggle = document.querySelector(toggleSelector)
  if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
    toggle.click()
    await sleep(150)
  }
}

export { sleep }
