<template>
  <div class="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
    <div class="flex items-start gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 shadow-sm">
        <UserRound class="h-6 w-6" />
      </div>

      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800">Administrator Details</h1>
        <p class="mt-2 text-base text-slate-500">Who will be managing the EduBoard account?</p>
      </div>
    </div>

    <form class="mt-10 space-y-7" @submit.prevent="handleSubmit">
      <div class="space-y-3">
        <label for="full-name" class="block text-base font-semibold text-slate-700">Full Name</label>
        <input
          id="full-name"
          v-model="formData.fullName"
          type="text"
          placeholder="Ndubuisi Paul"
          class="h-14 w-full rounded-xl border-2 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
          :class="{ 'border-red-500 focus:border-red-500': errors.fullName }"
        />
        <p v-if="errors.fullName" class="text-sm text-red-500">{{ errors.fullName }}</p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <label for="email-address" class="block text-base font-semibold text-slate-700">Email Address</label>
          <input
            id="email-address"
            v-model="formData.email"
            type="email"
            placeholder="paul@school.edu"
            class="h-14 w-full rounded-xl border-2 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
            :class="{ 'border-red-500 focus:border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</p>
        </div>

        <div class="space-y-3">
          <label for="phone-number" class="block text-base font-semibold text-slate-700">Phone Number</label>
          <input
            id="phone-number"
            v-model="formData.phone"
            type="tel"
            placeholder="+234 000 000 0000"
            class="h-14 w-full rounded-xl border-2 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
            :class="{ 'border-red-500 focus:border-red-500': errors.phone }"
          />
          <p v-if="errors.phone" class="text-sm text-red-500">{{ errors.phone }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <label for="password" class="block text-base font-semibold text-slate-700">Password</label>
          <div class="relative">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Create a strong password"
              class="h-14 w-full rounded-xl border-2 px-4 pr-12 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
              :class="{ 'border-red-500 focus:border-red-500': errors.password }"
            />
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? EyeOff : Eye" class="h-5 w-5" />
            </button>
          </div>
          <p v-if="errors.password" class="text-sm text-red-500">{{ errors.password }}</p>
        </div>

        <div class="space-y-3">
          <label for="confirm-password" class="block text-base font-semibold text-slate-700">Confirm Password</label>
          <div class="relative">
            <input
              id="confirm-password"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Re-enter your password"
              class="h-14 w-full rounded-xl border-2 px-4 pr-12 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
              :class="{ 'border-red-500 focus:border-red-500': errors.confirmPassword }"
            />
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <component :is="showConfirmPassword ? EyeOff : Eye" class="h-5 w-5" />
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="text-sm text-red-500">{{ errors.confirmPassword }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          class="cursor-pointer inline-flex items-center gap-3 self-start rounded-xl border-2 border-[#0B1F3A] bg-white px-7 py-3 text-base font-medium text-[#0B1F3A] shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
          @click="emit('back')"
        >
          <ArrowLeft class="h-5 w-5" />
          Back
        </button>

        <button
          type="submit"
          class="cursor-pointer inline-flex items-center gap-3 self-start rounded-xl bg-[#0B1F3A] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-[#0B1F3A]/10 transition duration-300 hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 sm:self-auto"
        >
          Continue
          <ArrowRight class="h-5 w-5" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, ChevronDown, Eye, EyeOff, UserRound } from 'lucide-vue-next'

const props = defineProps<{
  formData: {
    fullName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
  }
}>()

const emit = defineEmits<{
  back: []
  continue: []
}>()

// Form validation state
const errors = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const validateForm = () => {
  // Reset errors
  errors.value = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  }

  let isValid = true

  // Validate full name
  if (!props.formData.fullName?.trim()) {
    errors.value.fullName = 'Full name is required'
    isValid = false
  }

  // Validate email
  if (!props.formData.email?.trim()) {
    errors.value.email = 'Email address is required'
    isValid = false
  } else if (!props.formData.email.includes('@')) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  // Validate phone
  if (!props.formData.phone?.trim()) {
    errors.value.phone = 'Phone number is required'
    isValid = false
  } else if (!/^\+?[\d\s\-\(\)]+$/.test(props.formData.phone.replace(/\s/g, ''))) {
    errors.value.phone = 'Phone number must contain only numbers'
    isValid = false
  }

  // Validate password
  if (!props.formData.password?.trim()) {
    errors.value.password = 'Password is required'
    isValid = false
  } else if (props.formData.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
    isValid = false
  }

  // Validate confirm password
  if (!props.formData.confirmPassword?.trim()) {
    errors.value.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (props.formData.password !== props.formData.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }
  emit('continue')
}
</script>
