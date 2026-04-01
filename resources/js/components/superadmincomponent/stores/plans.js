import { defineStore } from 'pinia'
import { createPlan, deletePlan, getPlans } from '../services/api/plans'

export const useSuperAdminPlansStore = defineStore('super-admin-plans', {
  state: () => ({
    plans: [],
    loading: false,
  }),
  actions: {
    async fetchPlans() {
      this.loading = true
      try {
        this.plans = await getPlans()
      } finally {
        this.loading = false
      }
    },
    async createPlan() {
      const plan = await createPlan()
      this.plans = [plan, ...this.plans]
    },
    async deletePlan(id) {
      await deletePlan(id)
      this.plans = this.plans.filter((plan) => plan.id !== id)
    },
  },
})
