<template>
  <div class="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
    <div class="flex items-start gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
        <School2 class="h-6 w-6" />
      </div>

      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800">School Information</h1>
        <p class="mt-2 text-base text-slate-500">Let's start with the basics about your institution.</p>
      </div>
    </div>

    <form class="mt-10 space-y-7" @submit.prevent="handleSubmit">
      <div class="space-y-3">
        <label for="school-name" class="block text-base font-semibold text-slate-700">School Name</label>
        <input
          id="school-name"
          v-model="formData.schoolName"
          type="text"
          placeholder="e.g. Enugu Secondary School"
          class="h-14 w-full rounded-xl border-2 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
          :class="{ 'border-red-500 focus:border-red-500': errors.schoolName }"
        />
        <p v-if="errors.schoolName" class="text-sm text-red-500">{{ errors.schoolName }}</p>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <div class="space-y-3">
          <label for="website" class="block text-base font-semibold text-slate-700">Website Handle</label>
          <div class="relative">
            <div class="flex items-center gap-1 rounded-xl border-2 px-3 text-sm transition duration-300 sm:gap-0 sm:px-4 sm:text-base"
                 :class="{
                   'border-green-500 focus-within:border-green-500': handleStatus === 'available',
                   'border-red-500 focus-within:border-red-500': handleStatus === 'taken',
                   'border-[#0B1F3A] focus-within:border-[#D4AF37]': handleStatus === 'idle' || handleStatus === 'checking'
                 }">
              <span class="shrink-0 text-slate-500">https://</span>
              <input
                id="website"
                v-model="formData.handle"
                type="text"
                placeholder="e.g. lekki"
                maxlength="10"
                @keydown.space.prevent
                class="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-slate-400 sm:py-4"
              />
              <span class="hidden shrink-0 text-slate-500 sm:inline">.localhost:5173</span>
              <div class="ml-2 shrink-0 sm:ml-3">
                <Loader2 v-if="handleStatus === 'checking'" class="h-5 w-5 animate-spin text-slate-400" />
                <Check v-else-if="handleStatus === 'available'" class="h-5 w-5 text-green-500" />
                <X v-else-if="handleStatus === 'taken'" class="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-slate-500 sm:hidden">Your site: {{ formData.handle || 'yourhandle' }}.localhost:5173</p>
            <p class="text-sm text-slate-500">Choose a unique handle (max 10 characters)</p>
            <p v-if="errors.handle" class="text-sm text-red-500">{{ errors.handle }}</p>
            <p v-else-if="handleError" class="text-sm text-red-500">{{ handleError }}</p>
            <p v-else-if="handleStatus === 'available'" class="text-sm text-green-500">Handle is available!</p>
            <p v-else-if="handleStatus === 'taken'" class="text-sm text-red-500">This handle is already taken</p>
            <p v-else-if="!props.formData.handle && suggestedHandle" class="text-sm text-slate-500">Suggested handle: <strong>{{ suggestedHandle }}</strong></p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <label for="address" class="block text-base font-semibold text-slate-700">Address</label>
        <input
          id="address"
          v-model="formData.address"
          type="text"
          placeholder="123 Education Lane"
          class="h-14 w-full rounded-xl border-2 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
          :class="{ 'border-red-500 focus:border-red-500': errors.address }"
        />
        <p v-if="errors.address" class="text-sm text-red-500">{{ errors.address }}</p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <label for="state" class="block text-base font-semibold text-slate-700">State</label>
          <div class="relative">
            <select
              id="state"
              v-model="formData.state"
              :class="[
                formData.state ? 'text-slate-800' : 'text-slate-800',
                errors.state ? 'border-red-500 focus:border-red-500' : 'border-[#0B1F3A] focus:border-[#D4AF37]'
              ]"
              class="cursor-pointer h-14 w-full appearance-none rounded-xl border-2 bg-white px-4 pr-12 text-base outline-none transition duration-300 focus:shadow-sm"
            >
              <option value="" disabled class="text-slate-400">Select State</option>
              <option v-for="state in states" :key="state.name" :value="state.name">
                {{ state.name }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
          </div>
          <p v-if="errors.state" class="text-sm text-red-500">{{ errors.state }}</p>
        </div>
        <div class="space-y-3">
          <label for="city" class="block text-base font-semibold text-slate-700">City / LGA</label>
          <div class="relative">
            <select
              id="city"
              v-model="formData.city"
              :class="[
                formData.city ? 'text-slate-800' : 'text-slate-800',
                errors.city ? 'border-red-500 focus:border-red-500' : 'border-[#0B1F3A] focus:border-[#D4AF37]'
              ]"
              class="cursor-pointer h-14 w-full appearance-none rounded-xl border-2 bg-white px-4 pr-12 text-base outline-none transition duration-300 focus:shadow-sm"
              :disabled="!formData.state"
            >
              <option value="" disabled class="text-slate-400">
                {{ formData.state ? 'Select City' : 'Select state first' }}
              </option>
              <option v-for="lga in selectedLGAs" :key="lga" :value="lga">
                {{ lga }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
          </div>
          <p v-if="errors.city" class="text-sm text-red-500">{{ errors.city }}</p>
        </div>
      </div>

      <div class="flex justify-end pt-6">
        <button
          type="submit"
          class="cursor-pointer inline-flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-[#0B1F3A]/10 transition duration-300 hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
        >
          Continue
          <ArrowRight class="h-5 w-5" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch} from 'vue'
import { ArrowRight, ChevronDown, School2, Check, X, Loader2 } from 'lucide-vue-next'
import { debounce } from 'lodash'
import { checkHandle } from './api/onboarding'
import nigerianStatesData from './data/nigerian-states.json'

const props = defineProps<{
  formData: {
    schoolName: string
    handle: string
    address: string
    state: string
    city: string
  }
}>()

// Convert JSON object to array format for v-for
const states = computed(() => {
  return Object.entries(nigerianStatesData).map(([name, lgas]) => ({ name, lgas }))
})
const selectedLGAs = computed(() => {
  const found = states.value.find(s => s.name === props.formData.state)
  return found ? found.lgas : []
})


const emit = defineEmits<{
  continue: []
}>()

// Handle checking state
const handleStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const handleError = ref('')

// Form validation state
const errors = ref({
  schoolName: '',
  handle: '',
  address: '',
  state: '',
  city: ''
})

// Auto-generate website handle from school name
const suggestedHandle = computed(() => {
  const name = props.formData.schoolName?.trim() || ''
  if (!name) return ''

  const words = name.split(/\s+/).filter(Boolean)
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (words.length === 1) {
    return normalize(words[0]).slice(0, 3)
  }

  return normalize(words.map((word) => word[0]).join('')).slice(0, 10)
})

// Check handle availability
const checkHandleAvailability = async (handle: string) => {
  if (!handle || handle.length === 0) {
    handleStatus.value = 'idle'
    return
  }

  // Only check handles with 10 or fewer characters
  if (handle.length > 10) {
    handleStatus.value = 'idle'
    handleError.value = 'Handle must be 10 characters or less'
    return
  }

  handleStatus.value = 'checking'
  handleError.value = ''

  try {
    const result = await checkHandle(handle)
    if (result.available) {
      handleStatus.value = 'available'
    } else {
      handleStatus.value = 'taken'
      handleError.value = 'This handle is already taken'
    }
  } catch (error) {
    handleStatus.value = 'idle'
    handleError.value = 'Unable to check handle availability'
  }
}

// Create debounced version of checkHandleAvailability
const debouncedCheckHandle = debounce(checkHandleAvailability, 500)


// Watch for state changes and clear city when state changes
watch(() => props.formData.state, () => {
  // Clear city selection when state changes
  props.formData.city = ''
})

// Watch for handle changes and check availability
watch(() => props.formData.handle, (newHandle, oldHandle) => {
  // Check availability for handle changes using debounced function
  if (newHandle !== oldHandle) {
    debouncedCheckHandle(newHandle)
  } else {
    handleStatus.value = 'idle'
  }
})

const validateForm = () => {
  // Reset errors
  errors.value = {
    schoolName: '',
    handle: '',
    address: '',
    state: '',
    city: ''
  }

  let isValid = true

  // Validate school name
  if (!props.formData.schoolName?.trim()) {
    errors.value.schoolName = 'School name is required'
    isValid = false
  }

  // Validate handle
  if (!props.formData.handle?.trim()) {
    errors.value.handle = 'Website handle is required'
    isValid = false
  } else if (handleStatus.value === 'taken') {
    errors.value.handle = 'This handle is already taken'
    isValid = false
  }

  // Validate address
  if (!props.formData.address?.trim()) {
    errors.value.address = 'Address is required'
    isValid = false
  }

  // Validate state
  if (!props.formData.state?.trim()) {
    errors.value.state = 'State is required'
    isValid = false
  }

  // Validate city
  if (!props.formData.city?.trim()) {
    errors.value.city = 'City is required'
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
