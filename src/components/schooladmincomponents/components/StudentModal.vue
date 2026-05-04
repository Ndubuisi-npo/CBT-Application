<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[80vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Student' : 'Create Student' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
          <FormField label="First Name" :error="errors.firstName">
            <input v-model="form.firstName" class="sa-input" placeholder="John" required />
          </FormField>
          
          <FormField label="Last Name" :error="errors.lastName">
            <input v-model="form.lastName" class="sa-input" placeholder="Doe" required />
          </FormField>
          
          <FormField label="Email" :error="errors.email">
            <input v-model="form.email" type="email" class="sa-input" placeholder="john.doe@example.com" required />
          </FormField>
          
          <FormField label="Phone" :error="errors.phone">
            <input v-model="form.phone" class="sa-input" placeholder="+1 (555) 123-4567" required />
          </FormField>
          
          <FormField label="Admission Number" :error="errors.admission_number">
            <input v-model="form.admission_number" class="sa-input" placeholder="ADM001" required />
          </FormField>
          
          <FormField label="Class" :error="errors.class_name">
            <input v-model="form.class_name" class="sa-input" placeholder="JSS1A" required />
          </FormField>

          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Student' : 'Create Student'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Student...' : 'Creating Student...'"
              :processing="loading" 
              :disabled="loading"
            />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  student: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => !!props.student)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  admission_number: '',
  class_name: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  admission_number: '',
  class_name: ''
})

const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', admission_number: '', class_name: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', admission_number: '', class_name: '' })
}

// Watch for student changes and update form
watch(() => props.student, (student) => {
  if (student) {
    // Try multiple possible paths for the data
    form.firstName = student.user?.first_name || student.first_name || ''
    form.lastName = student.user?.last_name || student.last_name || ''
    form.email = student.user?.email || student.email || ''
    form.phone = student.user?.phone || student.phone || ''
    form.admission_number = student.student_profile?.admission_number || student.admission_number || ''
    form.class_name = student.student_profile?.class_name || student.class_name || ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal close to reset loading state
watch(() => props.show, (show) => {
  if (!show) {
    loading.value = false
    resetForm()
  }
})

const validate = () => {
  errors.firstName = form.firstName?.trim() ? '' : 'First name is required.'
  errors.lastName = form.lastName?.trim() ? '' : 'Last name is required.'
  errors.email = form.email?.trim() ? '' : 'Email is required.'
  errors.phone = form.phone?.trim() ? '' : 'Phone is required.'
  errors.admission_number = form.admission_number?.trim() ? '' : 'Admission number is required.'
  errors.class_name = form.class_name?.trim() ? '' : 'Class is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.admission_number && !errors.class_name
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const payload = {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      admission_number: form.admission_number,
      class_name: form.class_name
    }
    
    emit('submit', {
      id: props.student?.id,
      ...payload
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
