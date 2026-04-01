import { defineStore } from 'pinia'
import { createTenant, getTenants, toggleTenantStatus } from '../services/api/tenants'

export const useSuperAdminTenantsStore = defineStore('super-admin-tenants', {
  state: () => ({
    tenants: [],
    loading: false,
    searchQuery: '',
    statusFilter: 'All',
    page: 1,
    perPage: 5,
  }),
  getters: {
    filteredTenants(state) {
      return state.tenants.filter((tenant) => {
        const matchesSearch =
          !state.searchQuery ||
          tenant.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          tenant.domain.toLowerCase().includes(state.searchQuery.toLowerCase())
        const matchesStatus = state.statusFilter === 'All' || tenant.status === state.statusFilter
        return matchesSearch && matchesStatus
      })
    },
    paginatedTenants() {
      const start = (this.page - 1) * this.perPage
      return this.filteredTenants.slice(start, start + this.perPage)
    },
    paginationMeta() {
      const start = this.filteredTenants.length ? (this.page - 1) * this.perPage + 1 : 0
      const end = Math.min(this.page * this.perPage, this.filteredTenants.length)
      return { start, end }
    },
  },
  actions: {
    async fetchTenants() {
      this.loading = true
      try {
        this.tenants = await getTenants()
        this.page = 1
      } finally {
        this.loading = false
      }
    },
    async createTenant(payload) {
      const tenant = await createTenant(payload)
      this.tenants = [tenant, ...this.tenants]
    },
    async toggleTenantStatus(id) {
      const updated = await toggleTenantStatus(id)
      this.tenants = this.tenants.map((tenant) => (tenant.id === id ? updated : tenant))
    },
    setPage(page) {
      const lastPage = Math.max(1, Math.ceil(this.filteredTenants.length / this.perPage))
      this.page = Math.min(Math.max(page, 1), lastPage)
    },
  },
})
