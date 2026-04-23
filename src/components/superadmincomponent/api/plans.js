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

export async function createPlan(payload) {
  try {
    return await apiFetch('/api/super-admin/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to create plan.'))
  }
}

export async function updatePlan(id, payload) {
  try {
    return await apiFetch(`/api/super-admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to update plan.'))
  }
}

export async function deletePlan(id) {
  try {
    return await apiFetch(`/api/super-admin/plans/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to delete plan.'))
  }
}
