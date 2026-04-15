<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/75 transition-opacity" @click="close"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div class="px-6 py-4 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Edit Tenant</h3>
            <button @click="close" class="text-slate-400 hover:text-slate-600">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div class="px-6 py-4">
          <div v-if="loading" class="text-center py-8">
            <p class="text-slate-600">Loading tenant details...</p>
          </div>
          
          <form v-else-if="tenant" class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Basic Information -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">School Name</label>
                <input v-model="form.name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.name" class="text-sm text-red-600 font-medium">{{ errors.name }}</p>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">Email</label>
                <input v-model="form.email" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.email" class="text-sm text-red-600 font-medium">{{ errors.email }}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">Phone</label>
                <input v-model="form.phone" type="tel" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.phone" class="text-sm text-red-600 font-medium">{{ errors.phone }}</p>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">Address</label>
                <input v-model="form.address" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.address" class="text-sm text-red-600 font-medium">{{ errors.address }}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">City</label>
                <input v-model="form.city" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.city" class="text-sm text-red-600 font-medium">{{ errors.city }}</p>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">State</label>
                <input v-model="form.state" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" />
                <p v-if="errors.state" class="text-sm text-red-600 font-medium">{{ errors.state }}</p>
              </div>
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
          </form>
          
          <div v-else class="text-center py-8">
            <p class="text-slate-600">Failed to load tenant details.</p>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-slate-200">
          <div class="flex justify-end space-x-3">
            <button @click="close" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button @click="handleSubmit" :disabled="loading" class="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2940] disabled:opacity-50">
              {{ loading ? 'Saving...' : 'Update Tenant' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'
import { useSuperAdminUiStore } from '../stores/ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  tenantId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'updated'])

const { getTenant, updateTenant } = useSuperAdminTenants()
const uiStore = useSuperAdminUiStore()

const tenant = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  is_active: true
})

const errors = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: ''
})

const close = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    is_active: true
  }
  errors.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  }
}

const validate = () => {
  errors.value.name = form.value.name ? '' : 'School name is required.'
  errors.value.email = /\S+@\S+\.\S+/.test(form.value.email) ? '' : 'Enter a valid email.'
  errors.value.phone = form.value.phone ? '' : 'Phone number is required.'
  errors.value.address = form.value.address ? '' : 'Address is required.'
  errors.value.city = form.value.city ? '' : 'City is required.'
  errors.value.state = form.value.state ? '' : 'State is required.'

  return !errors.value.name && !errors.value.email && !errors.value.phone && !errors.value.address && !errors.value.city && !errors.value.state
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      city: form.value.city,
      state: form.value.state,
      is_active: form.value.is_active
    }

    await updateTenant(props.tenantId, payload)
    
    uiStore.addToast({
      title: 'Tenant updated',
      message: 'Tenant information has been updated successfully.',
      variant: 'success',
    })
    
    emit('updated')
    close()
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || 'Failed to update tenant.',
      variant: 'error',
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.show, async (newShow) => {
  if (newShow && props.tenantId) {
    loading.value = true
    try {
      const tenantData = await getTenant(props.tenantId)
      tenant.value = tenantData
      
      // Populate form with tenant data
      form.value = {
        name: tenantData.name || '',
        email: tenantData.email || '',
        phone: tenantData.phone || '',
        address: tenantData.address || '',
        city: tenantData.city || '',
        state: tenantData.state || '',
        is_active: tenantData.is_active || false
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error)
      tenant.value = null
    } finally {
      loading.value = false
    }
  } else {
    tenant.value = null
    resetForm()
  }
})
</script>
