import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setTenantSlug } from '../../../js/lib/api'

export const useTenantStore = defineStore('tenant', () => {
  const currentTenantSlug = ref('')
  const currentTenant = ref(null)

  const setCurrentTenant = (tenant) => {
    currentTenant.value = tenant
    if (tenant?.slug) {
      currentTenantSlug.value = tenant.slug
      setTenantSlug(tenant.slug)
    }
  }

  const clearCurrentTenant = () => {
    currentTenant.value = null
    currentTenantSlug.value = ''
    setTenantSlug('')
  }

  return {
    currentTenantSlug,
    currentTenant,
    setCurrentTenant,
    clearCurrentTenant,
  }
})
