<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Basic Information -->
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Plan Name</label>
          <input v-model="localForm.name" type="text" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Premium Plan" />
          <p v-if="errors.name" class="text-sm text-red-600 font-medium">{{ errors.name }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700">Slug</label>
          <input v-model="localForm.slug" type="text" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="premium-plan" />
          <p v-if="errors.slug" class="text-sm text-red-600 font-medium">{{ errors.slug }}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-700">Description</label>
        <textarea v-model="localForm.description" rows="3" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="A comprehensive plan for growing schools"></textarea>
        <p v-if="errors.description" class="text-sm text-red-600 font-medium">{{ errors.description }}</p>
      </div>
    </div>

    <!-- Limits -->
    <div class="space-y-4">
      <h4 class="text-sm font-medium text-slate-700">Usage Limits</h4>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-slate-700">Max Students</label>
          <input v-model.number="localForm.max_students" type="number" min="1" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="100" />
          <p v-if="errors.max_students" class="text-sm text-red-600 font-medium">{{ errors.max_students }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700">Max Teachers</label>
          <input v-model.number="localForm.max_teachers" type="number" min="1" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="10" />
          <p v-if="errors.max_teachers" class="text-sm text-red-600 font-medium">{{ errors.max_teachers }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700">Max Exams per Term</label>
          <input v-model.number="localForm.max_exams_per_term" type="number" min="1" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="50" />
          <p v-if="errors.max_exams_per_term" class="text-sm text-red-600 font-medium">{{ errors.max_exams_per_term }}</p>
        </div>
      </div>
    </div>

    <!-- Pricing -->
    <div class="space-y-4">
      <h4 class="text-sm font-medium text-slate-700">Pricing</h4>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Monthly Price ($)</label>
          <input v-model.number="localForm.price_monthly" type="number" min="0" step="0.01" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="29.99" />
          <p v-if="errors.price_monthly" class="text-sm text-red-600 font-medium">{{ errors.price_monthly }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700">Yearly Price ($)</label>
          <input v-model.number="localForm.price_yearly" type="number" min="0" step="0.01" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="299.99" />
          <p v-if="errors.price_yearly" class="text-sm text-red-600 font-medium">{{ errors.price_yearly }}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-700">Billing Interval</label>
        <select v-model="localForm.interval" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition">
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <p v-if="errors.interval" class="text-sm text-red-600 font-medium">{{ errors.interval }}</p>
      </div>
    </div>

    <!-- Features -->
    <div class="space-y-4">
      <h4 class="text-sm font-medium text-slate-700">Features</h4>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Plan Features (one per line)</label>
        <textarea v-model="featuresText" rows="5" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Unlimited student accounts&#10;Advanced reporting&#10;Priority support&#10;Custom branding"></textarea>
        <p v-if="errors.features" class="text-sm text-red-600 font-medium">{{ errors.features }}</p>
        <p class="text-xs text-slate-500 mt-1">Enter each feature on a new line</p>
      </div>
    </div>

    <div class="flex justify-end">
      <AppButton 
        type="submit" 
        :text="isEdit ? 'Update Plan' : 'Create Plan'"
        :processing="loading"
        variant="primary"
      />
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
import AppButton from '../../shared/AppButton.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const localForm = reactive({
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

const errors = reactive({
  name: '',
  slug: '',
  description: '',
  max_students: '',
  max_teachers: '',
  max_exams_per_term: '',
  price_monthly: '',
  price_yearly: '',
  features: '',
  interval: '',
})

const featuresText = computed({
  get() {
    return Array.isArray(localForm.features) ? localForm.features.join('\n') : ''
  },
  set(value) {
    localForm.features = value.split('\n').filter(feature => feature.trim() !== '').map(feature => feature.trim())
  }
})

watch(
  () => props.form,
  (value) => Object.assign(localForm, value),
  { immediate: true, deep: true },
)

const validate = () => {
  errors.name = localForm.name ? '' : 'Plan name is required.'
  errors.slug = localForm.slug ? '' : 'Slug is required.'
  errors.description = localForm.description ? '' : 'Description is required.'
  errors.max_students = localForm.max_students > 0 ? '' : 'Max students must be greater than 0.'
  errors.max_teachers = localForm.max_teachers > 0 ? '' : 'Max teachers must be greater than 0.'
  errors.max_exams_per_term = localForm.max_exams_per_term > 0 ? '' : 'Max exams per term must be greater than 0.'
  errors.price_monthly = localForm.price_monthly >= 0 ? '' : 'Monthly price must be non-negative.'
  errors.price_yearly = localForm.price_yearly >= 0 ? '' : 'Yearly price must be non-negative.'
  errors.features = localForm.features.length > 0 ? '' : 'At least one feature is required.'
  errors.interval = ['monthly', 'yearly'].includes(localForm.interval) ? '' : 'Invalid interval.'

  return !Object.values(errors).some(error => error !== '')
}

const handleSubmit = () => {
  if (!validate()) return
  emit('submit', { ...localForm })
}
</script>
