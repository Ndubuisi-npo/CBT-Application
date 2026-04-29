import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function fetchActivities(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = queryString ? `/api/activities?${queryString}` : '/api/activities'
  
  try {
    return await apiFetch(url)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch activities.'))
  }
}

export async function logActivity(payload) {
  try {
    return await apiFetch('/api/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to log activity.'))
  }
}

export async function getActivityTypes() {
  try {
    return await apiFetch('/api/activity-types')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch activity types.'))
  }
}
