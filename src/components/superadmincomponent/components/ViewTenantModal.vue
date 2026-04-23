<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black opacity-25" @click="close"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Tenant Details</h3>
          <AppButton @click="close" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div v-if="loading" class="text-center py-8">
          <div class="text-slate-600">Loading tenant details...</div>
        </div>
        
        <div v-else-if="tenant" class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Basic Information</h4>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Name</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.name }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Handle</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.handle }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">School Type</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.school_type || 'Not specified' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Status</label>
                <StatusBadge :status="tenant.is_active ? 'Active' : 'Suspended'" />
              </div>
              <div>
                <label class="block text-sm text-slate-500">Logo</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.logo ? 'Yes' : 'No' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Email</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.contact?.email || 'Not provided' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Phone</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.contact?.phone || 'Not provided' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Address</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.contact?.address || 'No Address' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">City</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.contact?.city || 'Not provided' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">State</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.contact?.state || 'Not provided' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Subscription Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Subscription Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Subscription Status</label>
                <StatusBadge :status="tenant.subscription?.status || 'Not Active'" />
              </div>
              <div>
                <label class="block text-sm text-slate-500">Plan</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.subscription?.plan?.name || 'No Plan' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Subscription Ends</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.subscription?.ends_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Trial Ends</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.subscription?.trial_ends_at) }}</p>
              </div>
            </div>
          </div>
          
          <!-- System Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">System Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Tenant ID</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.id }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Created At</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.created_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Onboarding Completed</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.onboarding_completed_at) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <div class="text-slate-600">Failed to load tenant details</div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <AppButton @click="close" text="Close" variant="primary" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import StatusBadge from './StatusBadge.vue'

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

const emit = defineEmits(['close'])

// const tenant = ref(null)
const loading = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

const close = () => {
  emit('close')
}
</script>


