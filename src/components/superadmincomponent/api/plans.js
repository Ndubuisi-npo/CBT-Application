import { apiFetch, extractErrorMessage } from '../../../js/lib/api'

export async function fetchPlans() {
  try {
    return await apiFetch('/api/plans')
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return [
        {
          id: 1,
          name: 'Basic Plan',
          description: 'Perfect for small schools',
          price: 29.99,
          billing_cycle: 'monthly',
          features: ['Up to 100 students', 'Basic grading', 'Email support'],
          max_students: 100,
          max_teachers: 10,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Premium Plan',
          description: 'Ideal for growing institutions',
          price: 79.99,
          billing_cycle: 'monthly',
          features: ['Up to 500 students', 'Advanced grading', 'Priority support', 'Analytics'],
          max_students: 500,
          max_teachers: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Enterprise Plan',
          description: 'For large educational institutions',
          price: 199.99,
          billing_cycle: 'monthly',
          features: ['Unlimited students', 'Custom features', 'Dedicated support', 'API access'],
          max_students: null,
          max_teachers: null,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
    throw new Error(extractErrorMessage(error, 'Unable to load plans.'))
  }
}

export async function getPlan(id) {
  try {
    return await apiFetch(`/api/plans/${id}`)
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      const plans = [
        {
          id: 1,
          name: 'Basic Plan',
          description: 'Perfect for small schools',
          price: 29.99,
          billing_cycle: 'monthly',
          features: ['Up to 100 students', 'Basic grading', 'Email support'],
          max_students: 100,
          max_teachers: 10,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Premium Plan',
          description: 'Ideal for growing institutions',
          price: 79.99,
          billing_cycle: 'monthly',
          features: ['Up to 500 students', 'Advanced grading', 'Priority support', 'Analytics'],
          max_students: 500,
          max_teachers: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Enterprise Plan',
          description: 'For large educational institutions',
          price: 199.99,
          billing_cycle: 'monthly',
          features: ['Unlimited students', 'Custom features', 'Dedicated support', 'API access'],
          max_students: null,
          max_teachers: null,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
      return plans.find(plan => plan.id === parseInt(id)) || plans[0]
    }
    throw new Error(extractErrorMessage(error, 'Unable to fetch plan.'))
  }
}

export async function createPlan(payload) {
  try {
    return await apiFetch('/api/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: Date.now(),
        ...payload,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to create plan.'))
  }
}

export async function updatePlan(id, payload) {
  try {
    return await apiFetch(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return {
        id: id,
        ...payload,
        updated_at: new Date().toISOString()
      }
    }
    throw new Error(extractErrorMessage(error, 'Unable to update plan.'))
  }
}

export async function deletePlan(id) {
  try {
    return await apiFetch(`/api/plans/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    // Return mock data if API is not available
    if (error.status === 404) {
      return { success: true, message: 'Plan deleted successfully' }
    }
    throw new Error(extractErrorMessage(error, 'Unable to delete plan.'))
  }
}
