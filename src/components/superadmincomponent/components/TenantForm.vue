<template>
  <form class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSubmit">
    <!-- School Information -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">School Name</label>
      <input v-model="localForm.name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lekki British School" />
      <p v-if="errors.name" class="text-sm text-red-600 font-medium">{{ errors.name }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Subdomain</label>
      <input v-model="localForm.domain" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="lekki-british-school" />
      <p v-if="errors.domain" class="text-sm text-red-600 font-medium">{{ errors.domain }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Phone</label>
      <input v-model="localForm.phone" type="tel" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="08012345678" />
      <p v-if="errors.phone" class="text-sm text-red-600 font-medium">{{ errors.phone }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Email</label>
      <input v-model="localForm.email" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="adminlekkibritish.com" />
      <p v-if="errors.email" class="text-sm text-red-600 font-medium">{{ errors.email }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">City</label>
      <input v-model="localForm.city" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lekki" />
      <p v-if="errors.city" class="text-sm text-red-600 font-medium">{{ errors.city }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">State</label>
      <input v-model="localForm.state" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Lagos" />
      <p v-if="errors.state" class="text-sm text-red-600 font-medium">{{ errors.state }}</p>
    </div>

    <!-- Admin Information -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Admin First Name</label>
      <input v-model="localForm.admin_first_name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="John" />
      <p v-if="errors.admin_first_name" class="text-sm text-red-600 font-medium">{{ errors.admin_first_name }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Admin Last Name</label>
      <input v-model="localForm.admin_last_name" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="Steve" />
      <p v-if="errors.admin_last_name" class="text-sm text-red-600 font-medium">{{ errors.admin_last_name }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Admin Email</label>
      <input v-model="localForm.admin_email" type="email" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="john.steve@lekkibritish.com" />
      <p v-if="errors.admin_email" class="text-sm text-red-600 font-medium">{{ errors.admin_email }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Subscription Plan</label>
      <select v-model="localForm.plan_id" :disabled="loading || plans.length === 0" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition disabled:opacity-50 disabled:cursor-not-allowed">
        <option value="">{{ loading ? 'Loading plans...' : plans.length === 0 ? 'No plans available' : 'Select a plan' }}</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
      </select>
      <p v-if="errors.plan_id" class="text-sm text-red-600 font-medium">{{ errors.plan_id }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Admin Password</label>
      <input v-model="localForm.admin_password" type="password" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="••••••••" />
      <p v-if="errors.admin_password" class="text-sm text-red-600 font-medium">{{ errors.admin_password }}</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700">Confirm Password</label>
      <input v-model="localForm.admin_password_confirmation" type="password" class="w-full rounded-lg border-2 border-[#0B1F3A] bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-0 transition" placeholder="••••••••" />
      <p v-if="errors.admin_password_confirmation" class="text-sm text-red-600 font-medium">{{ errors.admin_password_confirmation }}</p>
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
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const localForm = reactive({
  name: '',
  domain: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirmation: '',
  plan_id: '',
})

const errors = reactive({
  name: '',
  domain: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirmation: '',
  plan_id: '',
})

watch(
  () => props.form,
  (value) => Object.assign(localForm, value),
  { immediate: true, deep: true },
)

const validate = () => {
  errors.name = localForm.name ? '' : 'School name is required.'
  errors.domain = localForm.domain ? '' : 'Subdomain is required.'
  errors.phone = localForm.phone ? '' : 'Phone number is required.'
  errors.email = /\S+@\S+\.\S+/.test(localForm.email) ? '' : 'Enter a valid school email.'
  errors.city = localForm.city ? '' : 'City is required.'
  errors.state = localForm.state ? '' : 'State is required.'
  errors.admin_first_name = localForm.admin_first_name ? '' : 'Admin first name is required.'
  errors.admin_last_name = localForm.admin_last_name ? '' : 'Admin last name is required.'
  errors.admin_email = /\S+@\S+\.\S+/.test(localForm.admin_email) ? '' : 'Enter a valid admin email.'
  errors.admin_password = localForm.admin_password ? (localForm.admin_password.length >= 6 ? '' : 'Password must be at least 6 characters.') : 'Admin password is required.'
  errors.admin_password_confirmation = localForm.admin_password_confirmation ? (localForm.admin_password_confirmation === localForm.admin_password ? '' : 'Passwords do not match.') : 'Password confirmation is required.'
  errors.plan_id = localForm.plan_id ? '' : 'Please select a subscription plan.'

  return !errors.name && !errors.domain && !errors.phone && !errors.email && !errors.city && !errors.state && !errors.admin_first_name && !errors.admin_last_name && !errors.admin_email && !errors.admin_password && !errors.admin_password_confirmation && !errors.plan_id
}

const handleSubmit = () => {
  if (!validate()) return
  emit('submit', { ...localForm })
}
</script>
