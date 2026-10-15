import { apiFetch, extractErrorMessage } from '../lib/api'

/**
 * Class Management
 * Protected Routes - Requires: Authorization: Bearer <token>
 */

/**
 * GET /api/class-levels - List all class levels (e.g., JSS 1, SS 1)
 */
export async function fetchClassLevels() {
  try {
    return await apiFetch('/api/class-levels')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load class levels.'))
  }
}

/**
 * GET /api/class-levels/{classLevelId}/arms - List arms for a specific class level (e.g., JSS 1A, JSS 1B)
 */
export async function fetchClassArms(classLevelId) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load classes.'))
  }
}

/**
 * POST /api/class-levels/{classLevelId}/arms - Create a new class arm
 */
export async function createClassArm(classLevelId, payload) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create class arm.'))
  }
}

/**
 * PATCH /api/class-levels/{classLevelId}/arms/{id} - Update a class arm
 */
export async function updateClassArm(classLevelId, armId, payload) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms/${armId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update class arm.'))
  }
}

/**
 * DELETE /api/class-levels/{classLevelId}/arms/{id} - Delete a class arm
 */
export async function deleteClassArm(classLevelId, armId) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms/${armId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete class arm.'))
  }
}
