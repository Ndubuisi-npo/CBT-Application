<template>
  <div class="space-y-6">
    <section v-if="isInitialLoading" class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-slate-100" />
    </section>
    <section v-else class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <OverviewCard title="Total Tenants" :value="metrics.totalTenants" change="" progress="78%" :icon="Building2" />
      <OverviewCard title="Active Subscriptions" :value="metrics.activeSubscriptions" change="" progress="69%" :icon="BadgeCheck" />
      <OverviewCard title="Suspended Tenants" :value="metrics.suspendedTenants" change="" progress="22%" :icon="ShieldAlert" :positive="false" />
      <OverviewCard title="Revenue" :value="metrics.revenue" change="" progress="84%" :icon="Coins" />
    </section>

    <SectionCard title="Recent Tenant Activity" subtitle="Operational visibility across your school portfolio.">
        <div v-if="isInitialLoading" class="space-y-4">
          <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div v-else class="space-y-4">
          <div v-for="tenant in tenants.slice(0, 8)" :key="tenant.id" class="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-semibold text-slate-900">{{ tenant.name }}</p>
              <p class="text-sm text-slate-500">{{ tenant.slug }} {{ tenant.subscription_status }}</p>
            </div>
            <div class="flex items-center gap-3">
              <StatusBadge :status="tenant.is_active ? 'Active' : 'Suspended'" />
              <span class="text-sm text-slate-500">{{ formatDate(tenant.created_at) }}</span>
            </div>
          </div>
        </div>
      </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { BadgeCheck, Building2, Coins, ShieldAlert } from 'lucide-vue-next'
import OverviewCard from '../components/OverviewCard.vue'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'
import { useSuperAdminPlans } from '../composables/useSuperAdminPlans'

const { fetchTenants, tenants } = useSuperAdminTenants()
const { plans, fetchPlans } = useSuperAdminPlans()

const isInitialLoading = computed(() => !tenants.value.length || !plans.value.length)

onMounted(() => {
  if (!tenants.value.length) fetchTenants()
  if (!plans.value.length) fetchPlans()
})

const metrics = computed(() => {
  const activeTenants = tenants.value.filter((tenant) => tenant.is_active)
  const totalRevenue = activeTenants.reduce((sum, tenant) => {
    const tenantPlan = tenant.plan || tenant.subscription?.plan
    const plan = tenantPlan || plans.value.find((p) => p.id === tenant.subscription?.plan?.id)
    const monthlyPrice = parseFloat(
      plan?.price_monthly ?? (plan?.price_yearly ? Number(plan.price_yearly) / 12 : 0),
    ) || 0
    return sum + monthlyPrice
  }, 0)
  
  return {
    totalTenants: `${tenants.value.length}`,
    activeSubscriptions: `${activeTenants.length}`,
    suspendedTenants: `${tenants.value.filter((tenant) => !tenant.is_active).length}`,
    revenue: `$${totalRevenue.toLocaleString()}`,
  }
})


const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}
</script>
