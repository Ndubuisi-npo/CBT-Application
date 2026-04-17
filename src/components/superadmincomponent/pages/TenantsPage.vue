<template>
  <div class="space-y-6">
    <SectionCard title="Tenants" subtitle="Search, filter, and manage every school workspace from one place.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <ActionButton tag="RouterLink" to="/super-admin/tenants/new" :icon="Plus" text="New Tenant" variant="primary" />
        </div>
      </template>

      <div class="mb-6 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" class="w-full rounded-lg border-2 border-[#0B1F3A] pl-12 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Search by school name or domain" />
        </div>
        <select v-model="statusFilter" class="w-full rounded-lg border-2 border-[#0B1F3A] px-4 py-2.5 text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <SkeletonTable v-if="loading" />

      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {{ heading }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="tenant in paginatedTenants" :key="tenant.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900 text-nowrap">{{ tenant.name }}</p>
                  <p class="text-sm text-slate-500">{{ tenant.slug }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">
                  <p>{{ tenant.email || 'No email' }}</p>
                  <p class="text-xs text-slate-500">{{ tenant.phone || 'No phone' }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">
                  <p>{{ tenant.address || 'No address' }}</p>
                  <p class="text-xs text-slate-500">{{ tenant.city || 'No city' }}, {{ tenant.state || 'No state' }}</p>
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :status="tenant.subscription_status || 'Not Active'" />
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :status="tenant.is_active ? 'Active' : 'Suspended'" />
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <AppButton text="View" @click="viewTenant(tenant)" variant="outline" size="xs" />
                    <AppButton text="Edit" @click="editTenant(tenant)" variant="outline" size="xs" />
                    <br>
                    <AppButton 
                      :text="tenant.is_active ? 'Suspend' : 'Activate'" 
                      @click="toggleStatus(tenant)" 
                      :variant="tenant.is_active ? 'warning' : 'success'" 
                      size="xs" 
                    />
                    <AppButton text="Delete" @click="deleteTenant(tenant.id)" variant="danger" size="xs" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControls
          :page="page"
          :start="paginationMeta.start"
          :end="paginationMeta.end"
          :total="filteredTenants.length"
          @change="setPage"
        />
      </div>
    </SectionCard>
    
    <!-- View Tenant Modal -->
    <ViewTenantModal 
      :is-open="showViewModal" 
      :tenant="currentlyViewing" 
      @close="closeViewModal" 
    />
    
    <!-- Edit Tenant Modal -->
    <EditTenantModal 
      :is-open="showEditModal" 
      :tenant="currentlyViewing" 
      @close="closeEditModal" 
      @updated="onTenantUpdated" 
    />
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ViewTenantModal from '../components/ViewTenantModal.vue'
import EditTenantModal from '../components/EditTenantModal.vue'
import AppButton from '../../shared/AppButton.vue'
import ActionButton from '../../shared/ActionButton.vue'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'
import { useSuperAdminUiStore } from '../stores/ui'

const {
  fetchTenants,
  filteredTenants,
  loading,
  page,
  paginatedTenants,
  paginationMeta,
  searchQuery,
  setPage,
  statusFilter,
  suspendTenant,
  reinstateTenant,
  deleteTenant: deleteTenantApi,
} = useSuperAdminTenants()
const uiStore = useSuperAdminUiStore()

const headings = ['Name', 'Contact', 'Location', 'Subscription', 'Status', 'Actions']

// Modal state
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedTenantId = ref(null)
const currentlyViewing = ref(null);

onMounted(() => {
  fetchTenants()
})

watch(
  () => [searchQuery.value, statusFilter.value],
  () => setPage(1),
)

const notify = (message) => {
  uiStore.addToast({
    title: 'Action available',
    message,
    variant: 'success',
  })
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

const toggleStatus = async (tenant) => {
  try {
    if (tenant.is_active) {
      await suspendTenant(tenant.id)
    } else {
      await reinstateTenant(tenant.id)
    }
    uiStore.addToast({
      title: 'Tenant updated',
      message: 'Tenant status was updated successfully.',
      variant: 'success',
    })
    // Refresh data to get updated tenant information
    await fetchTenants()
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message,
      variant: 'error',
    })
  }
}

const deleteTenant = async (id) => {
  if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
    return
  }
  
  try {
    await deleteTenantApi(id)
    uiStore.addToast({
      title: 'Tenant deleted',
      message: 'Tenant has been deleted successfully.',
      variant: 'success',
    })
    // Refresh data to get updated tenant list
    await fetchTenants()
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to delete tenant.',
      variant: 'error',
    })
  }
}

const viewTenant = (tenant) => {
  currentlyViewing.value = tenant
  showViewModal.value = true
}

const editTenant = (tenant) => {
  currentlyViewing.value = tenant
  showEditModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  currentlyViewing.value = null
}

const closeEditModal = () => {
  showEditModal.value = false
  currentlyViewing.value = null
}

const onTenantUpdated = () => {
  fetchTenants() // Refresh the tenant list
}
</script>
