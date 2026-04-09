import { ref } from 'vue'
import {
  getPlan as getPlanRequest,
  fetchPlans as fetchPlansRequest,
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

  return {
    plans,
    loading,
    fetchPlans,
    getPlan,
  }
}
