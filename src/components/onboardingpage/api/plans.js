import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchPlans() {
  try {
    return await apiFetch('/api/onboarding/plans')
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load plans.'))
  }
}

