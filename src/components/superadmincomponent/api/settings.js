import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function changePassword(payload) {
  try {
    return await apiFetch('/api/password/change', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to change password.'))
  }
}
