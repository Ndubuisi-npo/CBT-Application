/**
 * Shared frontend validation helpers.
 *
 * NOTE: this is FRONTEND validation only, meant to give users fast feedback
 * before a request is even sent. It does not replace backend validation -
 * the backend must still independently enforce these rules.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Administrative identifiers that must not appear as (or as part of, at the
// start/end of) a Teacher or Student account's email username, to prevent
// staff/students from creating accounts that look like admin accounts.
const ADMIN_IDENTIFIERS = ['admin', 'administrator', 'superadmin', 'schooladmin', 'root', 'owner']

/**
 * Checks whether an email's username (the part before "@") is an admin
 * identifier, or begins/ends with one (optionally separated by an
 * underscore, dash, dot, or digits) - e.g. "admin", "admin123",
 * "adminjohn", "johnadmin", "admin_john", "john_admin".
 */
export function isAdminLikeEmailUsername(username) {
  if (!username) return false
  const normalized = username.toLowerCase()

  return ADMIN_IDENTIFIERS.some((identifier) => {
    if (normalized === identifier) return true
    // starts with identifier (e.g. "admin123", "adminjohn", "admin_john")
    if (normalized.startsWith(identifier)) return true
    // ends with identifier (e.g. "johnadmin", "john_admin")
    if (normalized.endsWith(identifier)) return true
    return false
  })
}

/**
 * Validates an email address for Teacher/Student account creation & edit
 * forms. Returns an error message string, or '' if valid.
 */
export function validateAccountEmail(value) {
  const email = (value || '').trim()

  if (!email) return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'

  const username = email.split('@')[0]
  if (isAdminLikeEmailUsername(username)) {
    return 'This email looks like an administrator account and cannot be used here. Please use a different email address.'
  }

  return ''
}
