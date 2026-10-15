import { ref } from 'vue'
import {
  getPlan as getPlanRequest,
  fetchPlans as fetchPlansRequest,
  createPlan as createPlanRequest,
  updatePlan as updatePlanRequest,
  deletePlan as deletePlanRequest,
} from '../api/plans'

const plans = ref([])
const loading = ref(false)

export function useSuperAdminPlans() {
  const fetchPlans = async () => {
    loading.value = true

    try {
      plans.value = await fetchPlansRequest()
    } finally {
      loading.value = false
    }
  }

  const getPlan = async (id) => {
    return await getPlanRequest(id)
  }

  const createPlan = async (payload) => {
    const plan = await createPlanRequest(payload)
    plans.value = [plan, ...plans.value]
    return plan
  }

  const updatePlan = async (id, payload) => {
    const updated = await updatePlanRequest(id, payload)
    plans.value = plans.value.map((plan) => (plan.id === id ? updated : plan))
    return updated
  }

  const deletePlan = async (id) => {
    await deletePlanRequest(id)
    plans.value = plans.value.filter((plan) => plan.id !== id)
  }

  return {
    plans,
    loading,
    fetchPlans,
    getPlan,
    createPlan,
    updatePlan,
    deletePlan,
  }
}
