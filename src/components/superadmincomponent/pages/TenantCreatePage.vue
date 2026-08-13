<template>
  <div class="space-y-6">
    <SectionCard title="Create Tenant" subtitle="Provision a new school workspace with plan assignment and administrator ownership.">
      <div v-if="loading && !plans.length" class="space-y-4">
        <div class="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div class="grid gap-4 md:grid-cols-2">
          <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
      <TenantForm v-else :form="form" :plans="plans" :loading="loading" @submit="handleSubmit" />
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import TenantForm from '../components/TenantForm.vue'
import { useSuperAdminPlans } from '../composables/useSuperAdminPlans'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'
import { useSuperAdminUiStore } from '../stores/ui'
import { useTenantStore } from '../stores/tenant'

const router = useRouter()
const { fetchPlans, plans, loading } = useSuperAdminPlans()
const { createTenant } = useSuperAdminTenants()
const uiStore = useSuperAdminUiStore()
const tenantStore = useTenantStore()

const form = reactive({
  name: '',
  domain: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirmation: '',
  plan_id: '',
})

onMounted(async () => {
  try {
    await fetchPlans()
  } catch (error) {
    uiStore.addToast({
      title: 'Error loading plans',
      message: 'Unable to load subscription plans. Please refresh the page.',
      variant: 'error',
    })
  }
})

const handleSubmit = async (payload) => {
  const tenant = await createTenant(payload)
  
  // Store the tenant data in the store for reference
  tenantStore.setCurrentTenant(tenant)
  
  uiStore.addToast({
    title: 'Tenant created',
    message: `${payload.name} was provisioned successfully.`,
    variant: 'success',
  })
  router.push('/super-admin/tenants')
}
</script>
