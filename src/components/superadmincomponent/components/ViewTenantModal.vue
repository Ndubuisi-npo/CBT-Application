<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/75 transition-opacity" @click="close"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div class="px-6 py-4 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Tenant Details</h3>
            <button @click="close" class="text-slate-400 hover:text-slate-600">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div class="px-6 py-4">
          <div v-if="loading" class="text-center py-8">
            <p class="text-slate-600">Loading tenant details...</p>
          </div>
          
          <div v-else-if="tenant" class="space-y-6">
            <!-- Basic Information -->
            <div>
              <h4 class="text-sm font-medium text-slate-700 mb-3">Basic Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-slate-500">Name</p>
                  <p class="font-medium text-slate-900">{{ tenant.name }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Slug</p>
                  <p class="font-medium text-slate-900">{{ tenant.slug }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Status</p>
                  <StatusBadge :status="tenant.is_active ? 'Active' : 'Suspended'" />
                </div>
                <div>
                  <p class="text-sm text-slate-500">Subscription</p>
                  <StatusBadge :status="tenant.subscription_status || 'Unknown'" />
                </div>
              </div>
            </div>
            
            <!-- Contact Information -->
            <div>
              <h4 class="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-slate-500">Email</p>
                  <p class="font-medium text-slate-900">{{ tenant.email || 'Not provided' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Phone</p>
                  <p class="font-medium text-slate-900">{{ tenant.phone || 'Not provided' }}</p>
                </div>
              </div>
            </div>
            
            <!-- Location Information -->
            <div>
              <h4 class="text-sm font-medium text-slate-700 mb-3">Location Information</h4>
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <p class="text-sm text-slate-500">Address</p>
                  <p class="font-medium text-slate-900">{{ tenant.address || 'Not provided' }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-slate-500">City</p>
                    <p class="font-medium text-slate-900">{{ tenant.city || 'Not provided' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-500">State</p>
                    <p class="font-medium text-slate-900">{{ tenant.state || 'Not provided' }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- System Information -->
            <div>
              <h4 class="text-sm font-medium text-slate-700 mb-3">System Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-slate-500">Database Name</p>
                  <p class="font-medium text-slate-900">{{ tenant.database || tenant.tenancy_db_name || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Created At</p>
                  <p class="font-medium text-slate-900">{{ formatDate(tenant.created_at) }}</p>
                </div>
                <div v-if="tenant.subscription_ends_at">
                  <p class="text-sm text-slate-500">Subscription Ends</p>
                  <p class="font-medium text-slate-900">{{ formatDate(tenant.subscription_ends_at) }}</p>
                </div>
                <div v-if="tenant.plan_id">
                  <p class="text-sm text-slate-500">Plan ID</p>
                  <p class="font-medium text-slate-900">{{ tenant.plan_id }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <p class="text-slate-600">Failed to load tenant details.</p>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-slate-200">
          <div class="flex justify-end">
            <button @click="close" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Close
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
import StatusBadge from './StatusBadge.vue'
import { useSuperAdminTenants } from '../composables/useSuperAdminTenants'

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

const emit = defineEmits(['close'])

const { getTenant } = useSuperAdminTenants()

const tenant = ref(null)
const loading = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const close = () => {
  emit('close')
}

watch(() => props.show, async (newShow) => {
  if (newShow && props.tenantId) {
    loading.value = true
    try {
      tenant.value = await getTenant(props.tenantId)
    } catch (error) {
      console.error('Failed to fetch tenant:', error)
      tenant.value = null
    } finally {
      loading.value = false
    }
  } else {
    tenant.value = null
  }
})
</script>
