<template>
  <div class="space-y-6">
    <SectionCard title="Create Tenant" subtitle="Provision a new school workspace with plan assignment and administrator ownership.">
      <TenantForm :form="form" :plans="plansStore.plans" @submit="handleSubmit" />
    </SectionCard>

    <SectionCard title="Provisioning Notes" subtitle="Suggested guardrails for production onboarding.">
      <div class="grid gap-4 md:grid-cols-3">
        <div v-for="item in notes" :key="item.title" class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p class="font-semibold text-slate-900">{{ item.title }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.description }}</p>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import TenantForm from '../components/TenantForm.vue'
import { useSuperAdminPlansStore } from '../stores/plans'
import { useSuperAdminTenantsStore } from '../stores/tenants'
import { useSuperAdminUiStore } from '../stores/ui'

const router = useRouter()
const plansStore = useSuperAdminPlansStore()
const tenantsStore = useSuperAdminTenantsStore()
const uiStore = useSuperAdminUiStore()

const form = reactive({
  name: '',
  domain: '',
  adminEmail: '',
  plan: '',
})

onMounted(() => {
  if (!plansStore.plans.length) plansStore.fetchPlans()
})

const handleSubmit = async (payload) => {
  await tenantsStore.createTenant(payload)
  uiStore.addToast({
    title: 'Tenant created',
    message: `${payload.name} was provisioned successfully.`,
    variant: 'success',
  })
  router.push('/super-admin/tenants')
}

const notes = [
  { title: 'Domain validation', description: 'Check subdomain uniqueness server-side before activating DNS or SSL provisioning.' },
  { title: 'Admin invite', description: 'Trigger a welcome email and password setup flow after tenant record creation.' },
  { title: 'Billing sync', description: 'Map the selected plan to your billing provider before enabling premium modules.' },
]
</script>
