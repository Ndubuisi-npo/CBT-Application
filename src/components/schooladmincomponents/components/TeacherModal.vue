<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[80vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Teacher' : 'Create Teacher' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
          <FormField label="First Name" :error="errors.firstName">
            <input v-model="form.firstName" class="sa-input" placeholder="John" />
          </FormField>
          
          <FormField label="Last Name" :error="errors.lastName">
            <input v-model="form.lastName" class="sa-input" placeholder="Doe" />
          </FormField>
          
          <FormField label="Email" :error="errors.email">
            <input v-model="form.email" type="email" class="sa-input" placeholder="john.doe@example.com" />
          </FormField>
          
          <FormField label="Phone" :error="errors.phone">
            <input v-model="form.phone" class="sa-input" placeholder="+1 (555) 123-4567" />
          </FormField>
          
          <FormField label="Staff ID" :error="errors.staffId">
            <input v-model="form.staffId" class="sa-input" placeholder="STF001" />
          </FormField>
          
          <FormField label="Qualification" :error="errors.qualification">
            <input v-model="form.qualification" class="sa-input" placeholder="B.Sc. Mathematics" />
          </FormField>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Teacher' : 'Create Teacher'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Teacher...' : 'Creating Teacher...'"
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
  teacher: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => !!props.teacher)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staffId: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  staffId: ''
})

const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })
  Object.assign(errors, { firstName: '', lastName: '', email: '', phone: '', qualification: '', staffId: '' })
}

// Watch for teacher changes and update form
watch(() => props.teacher, (teacher) => {
  console.log('Teacher changed:', teacher)
  console.log('Teacher data structure:', JSON.stringify(teacher, null, 2))
  if (teacher) {
    console.log('Populating form with teacher data:', teacher)
    console.log('Teacher user data:', teacher.user)
    console.log('Teacher profile data:', teacher.teacher_profile)
    console.log('Teacher first_name paths:', {
      'teacher.user?.first_name': teacher.user?.first_name,
      'teacher.first_name': teacher.first_name,
      'teacher.first_name (direct)': teacher.first_name
    })
    
    // Try multiple possible paths for the data
    form.firstName = teacher.user?.first_name || teacher.first_name || ''
    form.lastName = teacher.user?.last_name || teacher.last_name || ''
    form.email = teacher.user?.email || teacher.email || ''
    form.phone = teacher.user?.phone || teacher.phone || ''
    form.qualification = teacher.teacher_profile?.qualification || teacher.qualification || ''
    form.staffId = teacher.teacher_profile?.staff_id || teacher.staff_id || ''
    
    console.log('Form after population:', form)
  } else {
    console.log('Resetting form')
    resetForm()
  }
}, { immediate: true })

const validate = () => {
  errors.firstName = form.firstName ? '' : 'First name is required.'
  errors.lastName = form.lastName ? '' : 'Last name is required.'
  errors.email = form.email ? '' : 'Email is required.'
  errors.phone = form.phone ? '' : 'Phone is required.'
  errors.qualification = form.qualification ? '' : 'Qualification is required.'
  errors.staffId = form.staffId ? '' : 'Staff ID is required.'
  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.qualification && !errors.staffId
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
      qualification: form.qualification,
      staff_id: form.staffId
    }
    
    await emit('submit', {
      id: props.teacher?.id,
      ...payload
    })
    
    // Don't close here - let parent handle closing after toast
    resetForm()
  } catch (error) {
    console.error('Teacher form error:', error)
  } finally {
    // Add a small delay to ensure loading state is visible
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
}
</script>
