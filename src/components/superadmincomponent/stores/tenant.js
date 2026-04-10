import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTenantStore = defineStore('tenant', () => {
  const currentTenant = ref(null)

  const setCurrentTenant = (tenant) => {
    currentTenant.value = tenant
  }

  const clearCurrentTenant = () => {
    currentTenant.value = null
  }

  return {
    currentTenant,
    setCurrentTenant,
    clearCurrentTenant,
  }
})
