<template>
  <div class="space-y-6">
    <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <OverviewCard title="Total Tenants" :value="metrics.totalTenants" change="+12% from last month" progress="78%" :icon="Building2" />
      <OverviewCard title="Active Subscriptions" :value="metrics.activeSubscriptions" change="+8% renewal growth" progress="69%" :icon="BadgeCheck" />
      <OverviewCard title="Suspended Tenants" :value="metrics.suspendedTenants" change="-3% operational issues" progress="22%" :icon="ShieldAlert" :positive="false" />
      <OverviewCard title="Revenue" :value="metrics.revenue" change="+18% MRR expansion" progress="84%" :icon="Coins" />
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <SectionCard title="Recent Tenant Activity" subtitle="Operational visibility across your school portfolio.">
        <div class="space-y-4">
          <div v-for="tenant in tenants.slice(0, 4)" :key="tenant.id" class="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-semibold text-slate-900">{{ tenant.name }}</p>
              <p class="text-sm text-slate-500">{{ tenant.domain }} • {{ tenant.plan }}</p>
            </div>
            <div class="flex items-center gap-3">
              <StatusBadge :status="tenant.status" />
              <span class="text-sm text-slate-500">{{ tenant.createdAt }}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System Health" subtitle="Current platform readiness and support metrics.">
        <div class="space-y-4">
          <div v-for="item in healthMetrics" :key="item.label" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-slate-500">{{ item.label }}</p>
              <p class="text-sm font-semibold text-slate-900">{{ item.value }}</p>
            </div>
            <div class="mt-3 h-2 rounded-full bg-white">
              <div class="h-full rounded-full bg-gradient-to-r from-[#0B1F3A] to-[#D4AF37]" :style="{ width: item.progress }"></div>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { BadgeCheck, Building2, Coins, ShieldAlert } from 'lucide-vue-next'
import OverviewCard from '../components/OverviewCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'

const { fetchTenants, tenants } = useSuperAdminTenants()

onMounted(() => {
  if (!tenants.value.length) fetchTenants()
})

const metrics = computed(() => ({
  totalTenants: `${tenants.value.length || 128}`,
  activeSubscriptions: `${tenants.value.filter((tenant) => tenant.status === 'Active').length || 114}`,
  suspendedTenants: `${tenants.value.filter((tenant) => tenant.status === 'Suspended').length || 14}`,
  revenue: '$84,200',
}))

const healthMetrics = [
  { label: 'API uptime', value: '99.94%', progress: '94%' },
  { label: 'Billing sync', value: 'Healthy', progress: '87%' },
  { label: 'Open support cases', value: '12', progress: '31%' },
  { label: 'Provisioning queue', value: '4 pending', progress: '45%' },
]
</script>
