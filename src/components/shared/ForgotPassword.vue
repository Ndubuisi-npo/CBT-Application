<template>
  <div class="w-full max-w-md">
    <!-- Step 1: Email Input -->
    <div v-if="currentStep === 1" class="space-y-6 animate-slide-in">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-slate-900">Forgot Password?</h2>
        <p class="mt-2 text-sm text-slate-600">
          Enter your email address and we'll send you a verification code
        </p>
      </div>

      <form @submit.prevent="handleSendOtp" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            placeholder="Enter your email"
            :disabled="loading"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Sending...' : 'Send Verification Code' }}
        </button>
      </form>

      <div class="text-center">
        <button
          @click="$emit('backToLogin')"
          class="text-sm text-[#0B1F3A] hover:text-[#D4AF37] font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>

    <!-- Step 2: OTP Verification -->
    <div v-if="currentStep === 2" class="space-y-6 animate-slide-in">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-slate-900">Verify Code</h2>
        <p class="mt-2 text-sm text-slate-600">
          Enter the verification code sent to {{ email }}
        </p>
      </div>

      <form @submit.prevent="handleVerifyOtp" class="space-y-4">
        <div>
          <label for="otp" class="block text-sm font-medium text-slate-700 mb-1">
            Verification Code
          </label>
          <input
            id="otp"
            v-model="otp"
            type="text"
            required
            maxlength="6"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-center text-lg tracking-widest"
            placeholder="000000"
            :disabled="loading"
          />
          <p v-if="errors.otp" class="mt-1 text-sm text-red-600">{{ errors.otp }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>

        <div class="text-center">
          <button
            type="button"
            @click="handleResendOtp"
            :disabled="resendDisabled"
            class="text-sm text-[#0B1F3A] hover:text-[#D4AF37] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code' }}
          </button>
        </div>
      </form>

      <div class="text-center">
        <button
          @click="$emit('backToLogin')"
          class="text-sm text-[#0B1F3A] hover:text-[#D4AF37] font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>

    <!-- Step 3: Reset Password -->
    <div v-if="currentStep === 3" class="space-y-6 animate-slide-in">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-slate-900">Reset Password</h2>
        <p class="mt-2 text-sm text-slate-600">
          Enter your new password
        </p>
      </div>

      <form @submit.prevent="handleResetPassword" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-slate-700 mb-1">
            New Password
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              placeholder="Enter new password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Eye v-if="!showPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <div>
          <label for="password_confirmation" class="block text-sm font-medium text-slate-700 mb-1">
            Confirm New Password
          </label>
          <div class="relative">
            <input
              id="password_confirmation"
              v-model="passwordConfirmation"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              placeholder="Confirm new password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
          <p v-if="errors.passwordConfirmation" class="mt-1 text-sm text-red-600">{{ errors.passwordConfirmation }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B1F3A] hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div class="text-center">
        <button
          @click="$emit('backToLogin')"
          class="text-sm text-[#0B1F3A] hover:text-[#D4AF37] font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" class="text-center space-y-4 animate-slide-in">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <CheckCircle class="h-6 w-6 text-green-600" />
      </div>
      <div>
        <h3 class="text-lg font-medium text-slate-900">Password Reset Successful!</h3>
        <p class="mt-2 text-sm text-slate-600">
          Your password has been successfully reset. You can now login with your new password.
        </p>
      </div>
      <button
        @click="$emit('backToLogin')"
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0B1F3A] hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37]"
      >
        Go to Login
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { Eye, EyeOff, CheckCircle } from 'lucide-vue-next'
import { forgotPassword, verifyOtp, resetPassword } from '../../js/lib/auth'

const emit = defineEmits(['backToLogin', 'success'])

// State
const currentStep = ref(1)
const loading = ref(false)
const showSuccess = ref(false)
const resetToken = ref('')

// Form data
const email = ref('')
const otp = ref('')
const password = ref('')
const passwordConfirmation = ref('')

// UI state
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const resendDisabled = ref(false)
const resendCountdown = ref(0)
let countdownInterval = null

// Errors
const errors = reactive({
  email: '',
  otp: '',
  password: '',
  passwordConfirmation: ''
})

// Clear errors
const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// Validate email
const validateEmail = () => {
  if (!email.value.trim()) {
    errors.email = 'Email is required'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Please enter a valid email address'
    return false
  }
  return true
}

// Validate OTP
const validateOtp = () => {
  if (!otp.value.trim()) {
    errors.otp = 'Verification code is required'
    return false
  }
  if (otp.value.length !== 6) {
    errors.otp = 'Verification code must be 6 digits'
    return false
  }
  return true
}

// Validate password
const validatePassword = () => {
  if (!password.value.trim()) {
    errors.password = 'Password is required'
    return false
  }
  if (password.value.length < 8) {
    errors.password = 'Password must be at least 8 characters long'
    return false
  }
  return true
}

// Validate password confirmation
const validatePasswordConfirmation = () => {
  if (!passwordConfirmation.value.trim()) {
    errors.passwordConfirmation = 'Please confirm your password'
    return false
  }
  if (password.value !== passwordConfirmation.value) {
    errors.passwordConfirmation = 'Passwords do not match'
    return false
  }
  return true
}

// Start resend countdown
const startResendCountdown = () => {
  resendDisabled.value = true
  resendCountdown.value = 60
  
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(countdownInterval)
      resendDisabled.value = false
      resendCountdown.value = 0
    }
  }, 1000)
}

// Step 1: Send OTP
const handleSendOtp = async () => {
  clearErrors()
  
  if (!validateEmail()) return
  
  loading.value = true
  
  try {
    await forgotPassword(email.value)
    currentStep.value = 2
    startResendCountdown()
  } catch (error) {
    errors.email = error.message || 'Failed to send verification code'
  } finally {
    loading.value = false
  }
}

// Step 2: Verify OTP
const handleVerifyOtp = async () => {
  clearErrors()
  
  if (!validateOtp()) return
  
  loading.value = true
  
  try {
    const response = await verifyOtp(email.value, otp.value)
    resetToken.value = response.reset_token
    currentStep.value = 3
  } catch (error) {
    errors.otp = error.message || 'Invalid verification code'
  } finally {
    loading.value = false
  }
}

// Resend OTP
const handleResendOtp = async () => {
  clearErrors()
  loading.value = true
  
  try {
    await forgotPassword(email.value)
    startResendCountdown()
  } catch (error) {
    errors.email = error.message || 'Failed to resend verification code'
  } finally {
    loading.value = false
  }
}

// Step 3: Reset Password
const handleResetPassword = async () => {
  clearErrors()
  
  if (!validatePassword() || !validatePasswordConfirmation()) return
  
  loading.value = true
  
  try {
    await resetPassword(resetToken.value, password.value, passwordConfirmation.value)
    showSuccess.value = true
    emit('success')
  } catch (error) {
    errors.password = error.message || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}

// Cleanup
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
