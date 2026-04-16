<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black opacity-25" @click="close"></div>
      
      <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Plan' : 'Create Plan' }}</h3>
          <button @click="close" class="text-slate-400 hover:text-slate-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <PlanForm 
          :form="form" 
          :loading="submitting" 
          :is-edit="isEdit"
          @submit="handleSubmit" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import PlanForm from './PlanForm.vue'
import { useSuperAdminUiStore } from '../stores/ui'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  plan: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'updated', 'created'])

const uiStore = useSuperAdminUiStore()
const submitting = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  max_students: 100,
  max_teachers: 10,
  max_exams_per_term: 50,
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  interval: 'monthly',
})

const isEdit = computed(() => !!props.plan)

const resetForm = () => {
  Object.assign(form, {
    name: '',
    slug: '',
    description: '',
    max_students: 100,
    max_teachers: 10,
    max_exams_per_term: 50,
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    interval: 'monthly',
  })
}

const loadPlan = () => {
  if (!props.plan) return
  
  Object.assign(form, {
    name: props.plan.name || '',
    slug: props.plan.slug || '',
    description: props.plan.description || '',
    max_students: props.plan.max_students || 100,
    max_teachers: props.plan.max_teachers || 10,
    max_exams_per_term: props.plan.max_exams_per_term || 50,
    price_monthly: props.plan.price_monthly || 0,
    price_yearly: props.plan.price_yearly || 0,
    features: Array.isArray(props.plan.features) ? props.plan.features : [],
    interval: props.plan.interval || 'monthly',
  })
}

const handleSubmit = async (payload) => {
  submitting.value = true
  
  try {
    const { useSuperAdminPlans } = await import('../composables/useSuperAdminPlans')
    const { createPlan, updatePlan } = useSuperAdminPlans()
    
    if (isEdit.value) {
      await updatePlan(props.plan.id, payload)
      uiStore.addToast({
        title: 'Plan updated',
        message: 'Plan has been updated successfully.',
        variant: 'success',
      })
      emit('updated')
    } else {
      await createPlan(payload)
      uiStore.addToast({
        title: 'Plan created',
        message: 'Plan has been created successfully.',
        variant: 'success',
      })
      emit('created')
    }
    
    close()
  } catch (error) {
    uiStore.addToast({
      title: 'Error',
      message: error.message || `Failed to ${isEdit.value ? 'update' : 'create'} plan.`,
      variant: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const close = () => {
  emit('close')
  resetForm()
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (isEdit.value) {
      loadPlan()
    } else {
      resetForm()
    }
  }
})
</script>
