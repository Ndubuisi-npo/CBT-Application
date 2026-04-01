<template>
  <form class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <label class="sa-label">School Name</label>
      <input v-model="localForm.name" class="sa-input" placeholder="Greenfield International School" />
      <p v-if="errors.name" class="sa-error">{{ errors.name }}</p>
    </div>

    <div class="space-y-2">
      <label class="sa-label">Subdomain</label>
      <input v-model="localForm.domain" class="sa-input" placeholder="greenfield.educbt.app" />
      <p v-if="errors.domain" class="sa-error">{{ errors.domain }}</p>
    </div>

    <div class="space-y-2">
      <label class="sa-label">Admin Email</label>
      <input v-model="localForm.adminEmail" type="email" class="sa-input" placeholder="principal@greenfield.edu" />
      <p v-if="errors.adminEmail" class="sa-error">{{ errors.adminEmail }}</p>
    </div>

    <div class="space-y-2">
      <label class="sa-label">Subscription Plan</label>
      <select v-model="localForm.plan" class="sa-input">
        <option value="">Select a plan</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.name">{{ plan.name }}</option>
      </select>
      <p v-if="errors.plan" class="sa-error">{{ errors.plan }}</p>
    </div>

    <div class="flex justify-end lg:col-span-2">
      <button type="submit" class="sa-button-primary">
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
