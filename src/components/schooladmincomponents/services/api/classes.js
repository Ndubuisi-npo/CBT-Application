import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

// Class Levels API
export async function getClassLevels() {
  try {
    return await apiFetch('/api/class-levels')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch class levels.'))
  }
}

export async function saveClassLevel(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/class-levels/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: payload.name,
        }),
      })
    }
    return await apiFetch('/api/class-levels', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
      }),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save class level.'))
  }
}

export async function updateClassLevel(id, payload) {
  try {
    return await apiFetch(`/api/class-levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: payload.name,
      }),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update class level.'))
  }
}

export async function createClassLevel(payload) {
  try {
    return await apiFetch('/api/class-levels', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
      }),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create class level.'))
  }
}

export async function deleteClassLevel(id) {
  try {
    return await apiFetch(`/api/class-levels/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete class level.'))
  }
}

// Class Arms API
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
        body: JSON.stringify({
          name: payload.name,
        }),
      })
    }
    return await apiFetch(`/api/class-levels/${classLevelId}/arms`, {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
      }),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save class arm.'))
  }
}

export async function deleteClassArm(classLevelId, id) {
  try {
    return await apiFetch(`/api/class-levels/${classLevelId}/arms/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete class arm.'))
  }
}

// Legacy functions for backward compatibility
export async function getClasses() {
  return await getClassLevels()
}

export async function saveClass(payload) {
  return await saveClassLevel(payload)
}

export async function deleteClass(id) {
  return await deleteClassLevel(id)
}
