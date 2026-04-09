import { apiFetch, extractErrorMessage } from '../lib/api'

/**
 * Grading Scales
 * Protected Routes - Requires: Authorization: Bearer <tenant-token> and X-Tenant header
 */

/**
 * GET /api/grading-scales - List all grading scales
 */
export async function fetchGradingScales() {
  try {
    return await apiFetch('/api/grading-scales')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load grading scales.'))
  }
}

/**
 * POST /api/grading-scales - Create a new grading scale
 */
export async function createGradingScale(payload) {
  try {
    return await apiFetch('/api/grading-scales', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create grading scale.'))
  }
}

/**
 * PATCH /api/grading-scales/{id} - Update a grading scale
 */
export async function updateGradingScale(id, payload) {
  try {
    return await apiFetch(`/api/grading-scales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update grading scale.'))
  }
}

/**
 * DELETE /api/grading-scales/{id} - Delete a grading scale
 */
export async function deleteGradingScale(id) {
  try {
    return await apiFetch(`/api/grading-scales/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete grading scale.'))
  }
}
