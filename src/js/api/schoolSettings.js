import { apiFetch, extractErrorMessage } from '../lib/api'

/**
 * School Settings & Configuration
 * Protected Routes - Requires: Authorization: Bearer <tenant-token> and X-Tenant header
 */

/**
 * GET /api/school-settings - Retrieve global school configuration
 * Returns: { exam_weights, ca_weights, ...etc }
 */
export async function getSchoolSettings() {
  try {
    return await apiFetch('/api/school-settings')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load school settings.'))
  }
}

/**
 * PATCH /api/school-settings - Update global school configuration
 * Body: { exam_weights, ca_weights, ...etc }
 */
export async function updateSchoolSettings(payload) {
  try {
    return await apiFetch('/api/school-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update school settings.'))
  }
}
