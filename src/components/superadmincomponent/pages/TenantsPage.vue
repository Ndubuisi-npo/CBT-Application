<template>
  <div class="space-y-6">
    <SectionCard title="Tenants" subtitle="Search, filter, and manage every school workspace from one place.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <RouterLink to="/super-admin/tenants/new" class="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">
            <Plus class="h-4 w-4" />
            <span>New Tenant</span>
          </RouterLink>
        </div>
      </template>

      <div class="mb-6 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input v-model="tenantsStore.searchQuery" class="w-full rounded-lg border-2 border-[#0B1F3A] pl-12 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Search by school name or domain" />
        </div>
        <select v-model="tenantsStore.statusFilter" class="w-full rounded-lg border-2 border-[#0B1F3A] px-4 py-2.5 text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <SkeletonTable v-if="tenantsStore.loading" />

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
              <tr v-for="tenant in tenantsStore.paginatedTenants" :key="tenant.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ tenant.name }}</p>
                  <p class="text-sm text-slate-500">{{ tenant.adminEmail }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ tenant.domain }}</td>
                <td class="px-5 py-4"><StatusBadge :status="tenant.status" /></td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ tenant.plan }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ tenant.createdAt }}</td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="notify('View tenant details is ready for API hookup.')">View</button>
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="notify('Edit tenant workflow is ready for API hookup.')">Edit</button>
                    <button type="button" class="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100" @click="toggleStatus(tenant.id)">
                      {{ tenant.status === 'Active' ? 'Suspend' : 'Activate' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControls
          :page="tenantsStore.page"
          :start="tenantsStore.paginationMeta.start"
          :end="tenantsStore.paginationMeta.end"
          :total="tenantsStore.filteredTenants.length"
          @change="tenantsStore.setPage"
        />
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, Search } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSuperAdminTenantsStore } from '../stores/tenants'
import { useSuperAdminUiStore } from '../stores/ui'

const tenantsStore = useSuperAdminTenantsStore()
const uiStore = useSuperAdminUiStore()

const headings = ['Name', 'Domain/Subdomain', 'Status', 'Plan', 'Created Date', 'Actions']

onMounted(() => {
  tenantsStore.fetchTenants()
})

watch(
  () => [tenantsStore.searchQuery, tenantsStore.statusFilter],
  () => tenantsStore.setPage(1),
)

const notify = (message) => {
  uiStore.addToast({
    title: 'Action available',
    message,
    variant: 'success',
  })
}

const toggleStatus = async (tenantId) => {
  await tenantsStore.toggleTenantStatus(tenantId)
  uiStore.addToast({
    title: 'Tenant updated',
    message: 'Tenant status was updated successfully.',
    variant: 'success',
  })
}
</script>
