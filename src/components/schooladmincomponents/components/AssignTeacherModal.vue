<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md max-h-[80vh] transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">Assign Teacher to {{ classItem?.name }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
            <FormField label="Select Teacher" :error="errors.teacher">
              <select v-model="form.teacherId" class="sa-input">
                <option value="">Choose a teacher...</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.first_name }} {{ teacher.last_name }} ({{ teacher.teacher_profile?.staff_id || 'No ID' }})
                </option>
              </select>
            </FormField>
          
            <div class="flex gap-2">
              <AppButton 
                type="submit" 
                text="Assign Teacher" 
                full-width 
                variant="primary" 
                loadingText="Assigning..."
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
import { reactive, watch, computed, ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'
import { useSchoolAdminTeachersStore } from '../stores/teachers'

const props = defineProps({
  show: { type: Boolean, default: false },
  classItem: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const teachersStore = useSchoolAdminTeachersStore()

const form = reactive({
  teacherId: ''
})

const errors = reactive({
  teacher: ''
})

const loading = ref(false)

const teachers = computed(() => teachersStore.teachers || [])

const resetForm = () => {
  Object.assign(form, { teacherId: '' })
  Object.assign(errors, { teacher: '' })
}

// Watch for modal close to reset loading state
watch(() => props.show, (show) => {
  if (!show) {
    loading.value = false
    resetForm()
  }
})

// Load teachers when modal opens
watch(() => props.show, async (show) => {
  if (show && teachers.value.length === 0) {
    try {
      await teachersStore.fetchTeachers()
    } catch (error) {
      console.error('Failed to load teachers:', error)
    }
  }
})

const validate = () => {
  errors.teacher = form.teacherId ? '' : 'Please select a teacher.'
  return !errors.teacher
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    await emit('submit', {
      classId: props.classItem?.id,
      teacherId: form.teacherId
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
