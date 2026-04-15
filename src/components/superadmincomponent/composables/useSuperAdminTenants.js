import { computed, ref } from 'vue'
import {
  createTenant as createTenantRequest,
  fetchTenants as fetchTenantsRequest,
  getTenant as getTenantRequest,
  suspendTenant as suspendTenantRequest,
  reinstateTenant as reinstateTenantRequest,
  updateTenant as updateTenantRequest,
  deleteTenant as deleteTenantRequest,
} from '../api/tenants'

const tenants = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('All')
const page = ref(1)
const perPage = ref(5)

export function useSuperAdminTenants() {
  const filteredTenants = computed(() =>
    tenants.value.filter((tenant) => {
      const query = searchQuery.value.toLowerCase()
      const matchesSearch =
        !query ||
        tenant.name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query) ||
        tenant.contact?.email.toLowerCase().includes(query)
      const matchesStatus = statusFilter.value === 'All' || 
        (statusFilter.value === 'Active' && tenant.is_active) ||
        (statusFilter.value === 'Suspended' && !tenant.is_active)
      return matchesSearch && matchesStatus
    }),
  )

  const paginatedTenants = computed(() => {
    const start = (page.value - 1) * perPage.value
    return filteredTenants.value.slice(start, start + perPage.value)
  })

  const paginationMeta = computed(() => {
    const total = filteredTenants.value.length
    const start = total ? (page.value - 1) * perPage.value + 1 : 0
    const end = Math.min(page.value * perPage.value, total)
    return { start, end }
  })

  const setPage = (nextPage) => {
    const lastPage = Math.max(1, Math.ceil(filteredTenants.value.length / perPage.value))
    page.value = Math.min(Math.max(nextPage, 1), lastPage)
  }

  const fetchTenants = async () => {
    loading.value = true

    try {
      const response = await fetchTenantsRequest()
      // Handle nested data structure - extract data from response.data
      tenants.value = Array.isArray(response) ? response : (response.data || [])
      page.value = 1
    } finally {
      loading.value = false
    }
  }

  const createTenant = async (payload) => {
    const tenant = await createTenantRequest(payload)
    tenants.value = [tenant, ...tenants.value]
    return tenant
  }

  const updateTenant = async (id, payload) => {
    const updated = await updateTenantRequest(id, payload)
    tenants.value = tenants.value.map((tenant) => (tenant.id === id ? updated : tenant))
    return updated
  }

  const suspendTenant = async (id) => {
    const updated = await suspendTenantRequest(id)
    tenants.value = tenants.value.map((tenant) => (tenant.id === id ? updated : tenant))
    return updated
  }

  const reinstateTenant = async (id) => {
    const updated = await reinstateTenantRequest(id)
    tenants.value = tenants.value.map((tenant) => (tenant.id === id ? updated : tenant))
    return updated
  }

  const getTenant = async (id) => {
    return await getTenantRequest(id)
  }

  const deleteTenant = async (id) => {
    await deleteTenantRequest(id)
    tenants.value = tenants.value.filter((tenant) => tenant.id !== id)
  }

  return {
    tenants,
    loading,
    searchQuery,
    statusFilter,
    page,
    perPage,
    filteredTenants,
    paginatedTenants,
    paginationMeta,
    setPage,
    fetchTenants,
    getTenant,
    createTenant,
    updateTenant,
    suspendTenant,
    reinstateTenant,
    deleteTenant,
  }
}
