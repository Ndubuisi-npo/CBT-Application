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
          class="h-14 w-full rounded-xl border-2 border-[#0B1F3A] px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <label for="school-type" class="block text-base font-semibold text-slate-700">School Type</label>
          <div class="relative">
            <select
              id="school-type"
              v-model="formData.schoolType"
              :class="formData.schoolType ? 'text-slate-800' : 'text-slate-400'"
              class="cursor-pointer h-14 w-full appearance-none rounded-xl border-2 border-[#0B1F3A] bg-white px-4 pr-12 text-base outline-none transition duration-300 focus:border-[#D4AF37] focus:shadow-sm"
            >
              <option value="" disabled>Select School Type</option>
              <option value="Secondary School">Secondary School</option>
              <option value="Primary School">Primary School</option>
              <option value="Mixed">Mixed</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
          </div>
        </div>

        <div class="space-y-3">
          <label for="website" class="block text-base font-semibold text-slate-700">Website Handle</label>
          <input
            id="website"
            :value="websiteHandle"
            type="text"
            readonly
            placeholder="https://edu.localhost:5173"
            class="h-14 w-full rounded-xl border-2 bg-slate-50 px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm cursor-not-allowed"
          />
          <p class="text-sm text-slate-500">Automatically generated from school name</p>
        </div>
      </div>

      <div class="space-y-3">
        <label for="address" class="block text-base font-semibold text-slate-700">Address</label>
        <input
          id="address"
          v-model="formData.address"
          type="text"
          placeholder="123 Education Lane"
          class="h-14 w-full rounded-xl border-2 border-[#0B1F3A] px-4 text-base text-slate-700 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[#D4AF37] focus:shadow-sm"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <label for="state" class="block text-base font-semibold text-slate-700">State / Province</label>
          <input
            id="state"
            v-model="formData.state"
            type="text"
            class="h-14 w-full rounded-xl border-2 border-[#0B1F3A] px-4 text-base text-slate-700 outline-none transition duration-300 focus:border-[#D4AF37] focus:shadow-sm"
          />
        </div>
        <div class="space-y-3">
          <label for="city" class="block text-base font-semibold text-slate-700">City</label>
          <input
            id="city"
            v-model="formData.city"
            type="text"
            class="h-14 w-full rounded-xl border-2 border-[#0B1F3A] px-4 text-base text-slate-700 outline-none transition duration-300 focus:border-[#D4AF37] focus:shadow-sm"
          />
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
import { computed, watch } from 'vue'
import { ArrowRight, ChevronDown, School2 } from 'lucide-vue-next'

const props = defineProps<{
  formData: {
    schoolName: string
    schoolType: string
    handle: string
    address: string
    state: string
    city: string
  }
}>()

const emit = defineEmits<{
  continue: []
}>()

// Auto-generate website handle from school name
const websiteHandle = computed(() => {
  if (!props.formData.schoolName) return ''
  
  // Extract first 3 letters from school name (cleaned)
  const cleanName = props.formData.schoolName.replace(/[^a-zA-Z]/g, '').toLowerCase()
  const handle = cleanName.substring(0, 3)
  
  return `https://${handle}.localhost:5173`
})

// Watch for school name changes and update handle
watch(() => props.formData.schoolName, (newSchoolName) => {
  if (newSchoolName) {
    const cleanName = newSchoolName.replace(/[^a-zA-Z]/g, '').toLowerCase()
    const handle = cleanName.substring(0, 3)
    props.formData.handle = handle
  } else {
    props.formData.handle = ''
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('continue')
}
</script>
