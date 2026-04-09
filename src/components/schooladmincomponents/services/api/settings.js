import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getGradingScales() {
  try {
    return await apiFetch('/api/grading-scales')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch grading scales.'))
  }
}

export async function saveGradingScale(payload) {
  try {
    if (payload.id) {
      return await apiFetch(`/api/grading-scales/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }
    return await apiFetch('/api/grading-scales', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save grading scale.'))
  }
}

export async function deleteGradingScale(id) {
  try {
    return await apiFetch(`/api/grading-scales/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete grading scale.'))
  }
}

export async function getSettings() {
  try {
    return await apiFetch('/api/school-settings')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch school settings.'))
  }
}

export async function saveSettings(payload) {
  try {
    return await apiFetch('/api/school-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save school settings.'))
  }
}
