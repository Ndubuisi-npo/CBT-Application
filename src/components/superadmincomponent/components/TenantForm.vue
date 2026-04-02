<template>
  <form class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">School Name</label>
      <input v-model="localForm.name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Greenfield International School" />
      <p v-if="errors.name" class="text-sm text-red-600 font-medium">{{ errors.name }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Subdomain</label>
      <input v-model="localForm.domain" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="greenfield.educbt.app" />
      <p v-if="errors.domain" class="text-sm text-red-600 font-medium">{{ errors.domain }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Admin Email</label>
      <input v-model="localForm.adminEmail" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="principal@greenfield.edu" />
      <p v-if="errors.adminEmail" class="text-sm text-red-600 font-medium">{{ errors.adminEmail }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Subscription Plan</label>
      <select v-model="localForm.plan" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition">
        <option value="">Select a plan</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.name">{{ plan.name }}</option>
      </select>
      <p v-if="errors.plan" class="text-sm text-red-600 font-medium">{{ errors.plan }}</p>
    </div>

    <div class="flex justify-end lg:col-span-2">
      <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">
        <Plus class="h-4 w-4" />
        <span>Create Tenant</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Plus } from 'lucide-vue-next'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  plans: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['submit'])

const localForm = reactive({
  name: '',
  domain: '',
  adminEmail: '',
  plan: '',
})

const errors = reactive({
  name: '',
  domain: '',
  adminEmail: '',
  plan: '',
})

watch(
  () => props.form,
  (value) => Object.assign(localForm, value),
  { immediate: true, deep: true },
)

const validate = () => {
  errors.name = localForm.name ? '' : 'School name is required.'
  errors.domain = localForm.domain ? '' : 'Subdomain is required.'
  errors.adminEmail = /\S+@\S+\.\S+/.test(localForm.adminEmail) ? '' : 'Enter a valid admin email.'
  errors.plan = localForm.plan ? '' : 'Please select a subscription plan.'

  return !errors.name && !errors.domain && !errors.adminEmail && !errors.plan
}

const handleSubmit = () => {
  if (!validate()) return
  emit('submit', { ...localForm })
}
</script>
