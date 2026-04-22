<template>
  
  <section class="min-h-screen bg-[#f7f9fc] text-slate-900">
    <div class="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div class="w-full max-w-4xl">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-bold text-black-400 shadow-sm">
              E
            </div>
            <span class="text-xl font-bold tracking-tight text-slate-800">EduBoard</span>
          </div>

          <div class="mt-10">
            <div class="grid grid-cols-2 gap-4 text-center text-sm text-slate-400 sm:grid-cols-3 lg:grid-cols-5">
              <div
                v-for="(step, index) in steps"
                :key="step"
                :class="getStepTextClass(index)"
              >
                {{ step }}
              </div>
            </div>

            <div class="mt-3 h-1 rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-slate-800 transition-all duration-500"
                :style="{ width: progressWidth }"
              ></div>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="cursor-pointer self-end rounded-xl border border-slate-200 bg-white p-3 text-slate-400 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:text-slate-700 lg:self-start"
          aria-label="Close onboarding"
          @click="goToLandingPage"
        >
          <X class="h-4 w-4" />
        </button>
      </header>

      <Transition :name="transitionName" mode="out-in">
        <component
          :is="currentComponent"
          :key="currentStep"
          :form-data="formData"
          @continue="goForward"
          @back="goBack"
          @submit-registration="submitRegistration"
        />
      </Transition>
      
      <!-- Error message display -->
      <div v-if="errorMessage" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-600 shadow-lg">
        {{ errorMessage }}
      </div>
      
      <!-- Loading overlay -->
      <div v-if="isSubmitting" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-8 text-center">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"></div>
          <p class="mt-4 text-slate-600">Onboarding your school...</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import AdminDetails from './admindetails.vue'
import ChoosePlan from './chooseplan.vue'
import Review from './review.vue'
import SchoolInfo from './schoolinfo.vue'
import { registerOnboarding } from './api/onboarding'

const steps = ['School Info', 'Admin Details', 'Review', 'Choose Plan']

const router = useRouter()
const currentStep = ref(0)
const transitionName = ref('step-forward')
const isSubmitting = ref(false)
const errorMessage = ref('')
const formData = ref({
  schoolName: '',
  schoolType: '',
  handle: '',
  address: '',
  state: '',
  city: '',
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  password: '',
  confirmPassword: '',
  plan_id: '',
})

const currentComponent = computed(() => {
  if (currentStep.value === 0) return SchoolInfo
  if (currentStep.value === 1) return AdminDetails
  if (currentStep.value === 2) return Review
  return ChoosePlan
})

const progressWidth = computed(() => {
  const activeCenter = ((currentStep.value + 0.5) / steps.length) * 100
  return `${Math.min(Math.max(activeCenter, 0), 100)}%`
})

const getStepTextClass = (index: number) => {
  if (index < currentStep.value) return 'text-amber-500'
  if (index === currentStep.value) return 'text-slate-800'
  return 'text-slate-400'
}

const goForward = () => {
  if (currentStep.value < steps.length - 1) {
    transitionName.value = 'step-forward'
    currentStep.value += 1
  }
}

const goBack = () => {
  if (currentStep.value > 0) {
    transitionName.value = 'step-backward'
    currentStep.value -= 1
  }
}

const submitRegistration = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    const payload = {
      schoolName: formData.value.schoolName,
      handle: formData.value.handle,
      address: formData.value.address,
      state: formData.value.state,
      city: formData.value.city,
      schoolType: formData.value.schoolType,
      fullName: formData.value.fullName,
      email: formData.value.email,
      phone: formData.value.phone,
      jobTitle: formData.value.jobTitle,
      password: formData.value.password,
      plan_id: formData.value.plan_id
    }
    
    await registerOnboarding(payload)
    
    // Redirect to success page or login
    router.push('/login')
  } catch (error) {
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const goToLandingPage = () => {
  router.push('/')
}
</script>

<style scoped>
.step-forward-enter-active,
.step-forward-leave-active,
.step-backward-enter-active,
.step-backward-leave-active {
  transition:
    opacity 320ms ease,
    transform 320ms ease;
}

.step-forward-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.step-forward-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.step-backward-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.step-backward-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
