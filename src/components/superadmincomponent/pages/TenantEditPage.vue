<template>
  <div class="space-y-6">
    <SectionCard title="Edit Tenant" subtitle="Update tenant information and settings.">
      <form v-if="!loading" class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSubmit">
        <!-- School Information -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">School Name</label>
          <input v-model="form.name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lekki British School" />
          <p v-if="errors.name" class="text-sm text-red-600 font-medium">{{ errors.name }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Email</label>
          <input v-model="form.email" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="admin@school.com" />
          <p v-if="errors.email" class="text-sm text-red-600 font-medium">{{ errors.email }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Phone</label>
          <input v-model="form.phone" type="tel" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="08012345678" />
          <p v-if="errors.phone" class="text-sm text-red-600 font-medium">{{ errors.phone }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Address</label>
          <input v-model="form.address" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="123 School Street" />
          <p v-if="errors.address" class="text-sm text-red-600 font-medium">{{ errors.address }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">City</label>
          <input v-model="form.city" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lekki" />
          <p v-if="errors.city" class="text-sm text-red-600 font-medium">{{ errors.city }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">State</label>
          <input v-model="form.state" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lagos" />
          <p v-if="errors.state" class="text-sm text-red-600 font-medium">{{ errors.state }}</p>
        </div>

        <!-- Status -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Status</label>
          <div class="flex items-center space-x-3">
            <label class="flex items-center">
              <input v-model="form.is_active" type="checkbox" class="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
              <span class="ml-2 text-sm text-slate-700">Active</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-end space-x-3">
          <button type="submit" class="rounded-lg bg-[#0B1F3A] px-6 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">
            Update Tenant
          </button>
          <button type="button" class="rounded-lg border-2 border-slate-300 px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="router.push('/super-admin/tenants')">
            Cancel
          </button>
        </div>
      </form>

      <div v-else class="flex items-center justify-center py-12">
        <div class="text-slate-600">Loading tenant information...</div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'
import { useSuperAdminUiStore } from '../stores/ui'

const route = useRoute()
const router = useRouter()
const { getTenant, updateTenant, loading } = useSuperAdminTenants()
const uiStore = useSuperAdminUiStore()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  is_active: true,
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
})

onMounted(async () => {
  try {
    const tenantId = route.params.id
    const tenant = await getTenant(tenantId)
    
    // Populate form with tenant data
    form.name = tenant.name || ''
    form.email = tenant.email || ''
    form.phone = tenant.phone || ''
    form.address = tenant.address || ''
    form.city = tenant.city || ''
    form.state = tenant.state || ''
    form.is_active = tenant.is_active || false
  } catch (error) {
    console.error('Failed to load tenant:', error)
    uiStore.addToast({
      title: 'Error',
      message: 'Failed to load tenant information.',
      variant: 'error',
    })
    router.push('/super-admin/tenants')
  }
})

const validate = () => {
  errors.name = form.name ? '' : 'School name is required.'
  errors.email = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Enter a valid email.'
  errors.phone = form.phone ? '' : 'Phone number is required.'
  errors.address = form.address ? '' : 'Address is required.'
  errors.city = form.city ? '' : 'City is required.'
  errors.state = form.state ? '' : 'State is required.'

  return !errors.name && !errors.email && !errors.phone && !errors.address && !errors.city && !errors.state
}

const handleSubmit = async () => {
  if (!validate()) return

  try {
    const tenantId = route.params.id
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      is_active: form.is_active,
    }

    await updateTenant(tenantId, payload)
    
    uiStore.addToast({
      title: 'Tenant updated',
      message: 'Tenant information has been updated successfully.',
      variant: 'success',
    })
    
    router.push('/super-admin/tenants')
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to update tenant.',
      variant: 'error',
    })
  }
}
</script>
