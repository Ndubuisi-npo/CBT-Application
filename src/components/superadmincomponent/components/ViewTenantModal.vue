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
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Name</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.name }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Slug</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.slug }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Database</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.database || tenant.tenancy_db_name }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Status</label>
                <StatusBadge :status="tenant.is_active ? 'Active' : 'Suspended'" />
              </div>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Email</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.email || 'Not provided' }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Phone</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.phone || 'Not provided' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Location Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Location Information</h4>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Address</label>
                <p class="text-sm font-medium text-slate-900">{{ tenant.address || 'No Address' }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-slate-500">City</label>
                  <p class="text-sm font-medium text-slate-900">{{ tenant.city || 'Not provided' }}</p>
                </div>
                <div>
                  <label class="block text-sm text-slate-500">State</label>
                  <p class="text-sm font-medium text-slate-900">{{ tenant.state || 'Not provided' }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Subscription Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">Subscription Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Subscription Status</label>
                <StatusBadge :status="tenant.subscription_status || 'Not Active'" />
              </div>
              <div>
                <label class="block text-sm text-slate-500">Plan</label>
                <p class="text-sm font-medium text-slate-900">{{ planName }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Subscription Ends</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.subscription_ends_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Trial Ends</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.trial_ends_at) }}</p>
              </div>
            </div>
          </div>
          
          <!-- System Information -->
          <div>
            <h4 class="text-sm font-medium text-slate-700 mb-3">System Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500">Created At</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.created_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Updated At</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.updated_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Onboarding Completed</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.onboarding_completed_at) }}</p>
              </div>
              <div>
                <label class="block text-sm text-slate-500">Deleted At</label>
                <p class="text-sm font-medium text-slate-900">{{ formatDate(tenant.deleted_at) }}</p>
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
import { onMounted, ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import StatusBadge from './StatusBadge.vue'
import { useSuperAdminPlans } from '../composables/useSuperAdminPlans'

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

// console.log(props.tenant)

const emit = defineEmits(['close'])

// const tenant = ref(null)
const loading = ref(false)

// Initialize plans composable
const { plans, fetchPlans } = useSuperAdminPlans()

// Computed property to get plan name by ID
const planName = computed(() => {
  if (!props.tenant?.plan_id || !plans.value.length) {
    return 'Not assigned'
  }
  const plan = plans.value.find(p => p.id === props.tenant.plan_id)
  return plan ? plan.name : 'Unknown Plan'
})


const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

const loadTenant = async () => {
  if (!props.tenantId) return
  
  loading.value = true
  try {
    // Import and use the getTenant function
    const { useSuperAdminTenants } = await import('../composables/useSuperAdminTenants')
    const { getTenant } = useSuperAdminTenants()
    tenant.value = await getTenant(props.tenantId)
  } catch (error) {
    console.error('Failed to load tenant:', error)
    tenant.value = null
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Fetch plans to ensure we have the latest data
    fetchPlans()
  }
})
onMounted(() => {
  // Fetch plans on component mount to ensure data is available
  fetchPlans()
})
</script>


