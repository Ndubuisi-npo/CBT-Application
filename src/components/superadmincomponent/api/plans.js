import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchPlans() {
  try {
    return await apiFetch('/api/super-admin/plans')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load plans.'))
  }
}

export async function getPlan(id) {
  try {
    return await apiFetch(`/api/super-admin/plans/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch plan.'))
  }
}
