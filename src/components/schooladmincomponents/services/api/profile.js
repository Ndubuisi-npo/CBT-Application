import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getProfile() {
  try {
    return await apiFetch('/api/school-settings')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch school profile.'))
  }
}

export async function saveProfile(payload) {
  try {
    return await apiFetch('/api/school-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to save school profile.'))
  }
}
