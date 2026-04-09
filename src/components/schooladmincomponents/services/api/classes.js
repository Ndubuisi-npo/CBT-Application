import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getClassLevels() {
  try {
    return await apiFetch('/api/class-levels')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class levels.'))
  }
}

export async function getClassArms(classLevelId) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class arms.'))
  }
}

export async function saveClassArm(classLevelId, payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/class-levels/${classLevelId}/arms/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save class arm.'))
  }
}

export async function deleteClassArm(classLevelId, armId) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms/${armId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete class arm.'))
  }
}
