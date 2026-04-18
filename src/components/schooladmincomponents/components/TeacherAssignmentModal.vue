<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[80vh] transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Teacher Assignment' : 'Assign Teacher' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
          <FormField label="Teacher" :error="errors.user_id">
            <select v-model="form.user_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
              <option value="">Select a teacher</option>
              <option v-for="teacher in teacherOptions" :key="teacher.value" :value="teacher.value">
                {{ teacher.label }}
              </option>
            </select>
          </FormField>

          <FormField label="Class Level" :error="errors.class_level_id">
            <select v-model="form.class_level_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
              <option value="">Select a class level</option>
              <option v-for="classLevel in classLevelOptions" :key="classLevel.value" :value="classLevel.value">
                {{ classLevel.label }}
              </option>
            </select>
          </FormField>

          <FormField label="Academic Session" :error="errors.academic_session_id">
            <select v-model="form.academic_session_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
              <option value="">Select an academic session</option>
              <option v-for="session in sessionOptions" :key="session.value" :value="session.value">
                {{ session.label }}
              </option>
            </select>
          </FormField>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Assignment' : 'Assign Teacher'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Assignment...' : 'Assigning Teacher...'"
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
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminTeachersStore } from '../stores/teachers'

const props = defineProps({
  show: { type: Boolean, default: false },
  assignment: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => !!props.assignment)

const form = reactive({
  user_id: '',
  class_level_id: '',
  academic_session_id: ''
})

const errors = reactive({
  user_id: '',
  class_level_id: '',
  academic_session_id: ''
})

const loading = ref(false)

// Store instances
const classesStore = useSchoolAdminClassesStore()
const sessionsStore = useSchoolAdminSessionsStore()
const teachersStore = useSchoolAdminTeachersStore()

// Computed options for selects
const teacherOptions = computed(() => {
  return teachersStore.teachers.map(teacher => ({
    value: teacher.id,
    label: `${teacher.first_name} ${teacher.last_name}`.trim() || 'Unknown Teacher'
  }))
})

const classLevelOptions = computed(() => {
  return classesStore.classes.map(classLevel => ({
    value: classLevel.id,
    label: classLevel.name
  }))
})

const sessionOptions = computed(() => {
  return sessionsStore.sessions.map(session => ({
    value: session.id,
    label: session.name
  }))
})

const resetForm = () => {
  Object.assign(form, { user_id: '', class_level_id: '', academic_session_id: '' })
  Object.assign(errors, { user_id: '', class_level_id: '', academic_session_id: '' })
}

onMounted(async () => {
  try {
    const fetchPromises = []
    
    // Only fetch classes if not already loaded
    if (classesStore.classes.length === 0 && !classesStore.loading) {
      fetchPromises.push(classesStore.fetchClasses())
    }
    
    // Only fetch sessions if not already loaded
    if (sessionsStore.sessions.length === 0 && !sessionsStore.loading) {
      fetchPromises.push(sessionsStore.fetchSessions())
    }
    
    // Only fetch teachers if not already loaded
    if (teachersStore.teachers.length === 0 && !teachersStore.loading) {
      fetchPromises.push(teachersStore.fetchTeachers())
    }
    
    if (fetchPromises.length > 0) {
      await Promise.all(fetchPromises)
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

// Watch for assignment changes and update form
watch(() => props.assignment, (assignment) => {
  if (assignment) {
    form.user_id = assignment.user_id || ''
    form.class_level_id = assignment.class_level_id || ''
    form.academic_session_id = assignment.academic_session_id || ''
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
  errors.user_id = form.user_id ? '' : 'Teacher is required.'
  errors.class_level_id = form.class_level_id ? '' : 'Class level is required.'
  errors.academic_session_id = form.academic_session_id ? '' : 'Academic session is required.'
  return !errors.user_id && !errors.class_level_id && !errors.academic_session_id
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const payload = {
      user_id: form.user_id,
      class_level_id: form.class_level_id,
      academic_session_id: form.academic_session_id
    }
    
    await emit('submit', {
      id: props.assignment?.id,
      ...payload
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
    console.error('Assignment form error:', error)
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
