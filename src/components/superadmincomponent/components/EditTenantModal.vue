<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black opacity-25" @click="close"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Edit Tenant</h3>
          <AppButton @click="close" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div v-if="loading" class="text-center py-8">
          <div class="text-slate-600">Loading tenant details...</div>
        </div>
        
        <form v-else-if="tenant" class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Basic Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Basic Information</h4>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">School Name</label>
                <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="School Name" />
                <p v-if="errors.name" class="text-sm text-red-600">{{ errors.name }}</p>
              </div>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">Email</label>
                <input v-model="form.email" type="email" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="admin@school.com" />
                <p v-if="errors.email" class="text-sm text-red-600">{{ errors.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Phone</label>
                <input v-model="form.phone" type="tel" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="08012345678" />
                <p v-if="errors.phone" class="text-sm text-red-600">{{ errors.phone }}</p>
              </div>
            </div>
          </div>
          
          <!-- Location Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Location Information</h4>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">Address</label>
                <input v-model="form.address" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="123 School Street" />
                <p v-if="errors.address" class="text-sm text-red-600">{{ errors.address }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">City</label>
                  <input v-model="form.city" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="Lekki" />
                  <p v-if="errors.city" class="text-sm text-red-600">{{ errors.city }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">State</label>
                  <input v-model="form.state" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" placeholder="Lagos" />
                  <p v-if="errors.state" class="text-sm text-red-600">{{ errors.state }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Status -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Status</h4>
            <div class="flex items-center space-x-3">
              <label class="flex items-center">
                <input v-model="form.is_active" type="checkbox" class="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" />
                <span class="ml-2 text-sm text-slate-700">Active</span>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <AppButton type="button" @click="close" text="Cancel" variant="outline" />
            <AppButton 
              type="submit" 
              :disabled="submitting" 
              :text="submitting ? 'Updating...' : 'Update Tenant'" 
              variant="primary" 
              :processing="submitting" 
            />
          </div>
        </form>
        
        <div v-else class="text-center py-8">
          <div class="text-slate-600">Failed to load tenant details</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useSuperAdminUiStore } from '../stores/ui'
import AppButton from '../../shared/AppButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  tenant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const uiStore = useSuperAdminUiStore()
// const tenant = ref(null)
const loading = ref(false)
const submitting = ref(false)

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

const loadTenant = () => {
  if (!props.tenant) return
  
  // Populate form with tenant data
  form.name = props.tenant.name || ''
  form.email = props.tenant.email || ''
  form.phone = props.tenant.phone || ''
  form.address = props.tenant.address || ''
  form.city = props.tenant.city || ''
  form.state = props.tenant.state || ''
  form.is_active = props.tenant.is_active || false
}

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

  submitting.value = true
  try {
    const { useSuperAdminTenants } = await import('../composables/useSuperAdminTenants')
    const { updateTenant } = useSuperAdminTenants()
    
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      is_active: form.is_active,
    }

    await updateTenant(props.tenant.id, payload)
    
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
    submitting.value = false
  }
}

const close = () => {
  emit('close')
}

watch(() => props.isOpen, (newValue) => {
  if (newValue && props.tenant) {
    loadTenant()
  }
})
</script>
