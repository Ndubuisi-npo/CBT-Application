<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-4xl max-h-[80vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Subject' : 'Create Subject' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
          <FormField label="Subject Name" :error="errors.name">
            <input v-model="form.name" class="sa-input" placeholder="Mathematics" />
          </FormField>
          
          <FormField label="Subject Code" :error="errors.code">
            <input v-model="form.code" class="sa-input" placeholder="MATH" />
          </FormField>
          
          <FormField label="Class Levels">
            <TagMultiSelect v-model="form.class_level_ids" :options="classOptions" placeholder="Select class levels" />
          </FormField>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Subject' : 'Create Subject'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Subject...' : 'Creating Subject...'"
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
import TagMultiSelect from './TagMultiSelect.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'

const props = defineProps({
  show: { type: Boolean, default: false },
  subject: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => !!props.subject)

const form = reactive({
  name: '',
  code: '',
  class_level_ids: []
})

const errors = reactive({
  name: '',
  code: '',
  class_level_ids: ''
})

const loading = ref(false)

// Use real class levels from store
const classesStore = useSchoolAdminClassesStore()

const classOptions = computed(() => {
  console.log('Classes store data:', classesStore.classes)
  const options = classesStore.classes.map(classLevel => classLevel.name)
  console.log('Class options:', options)
  return options
})

const resetForm = () => {
  Object.assign(form, { name: '', code: '', class_level_ids: [] })
  Object.assign(errors, { name: '', code: '', class_level_ids: '' })
}

onMounted(async () => {
  try {
    // Only fetch classes if not already loaded
    if (classesStore.classes.length === 0 && !classesStore.loading) {
      await classesStore.fetchClasses()
    }
  } catch (error) {
    console.error('Error loading class levels:', error)
  }
})

// Watch for subject changes and update form
watch(() => props.subject, (subject) => {
  console.log('Subject changed:', subject)
  if (subject) {
    console.log('Populating form with subject data:', subject)
    form.name = subject.name || ''
    form.code = subject.code || ''
    form.class_level_ids = subject.class_levels?.map(level => level.name) || []
    console.log('Form after population:', form)
  } else {
    console.log('Resetting form')
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
  errors.name = form.name ? '' : 'Subject name is required.'
  errors.code = form.code ? '' : 'Subject code is required.'
  errors.class_level_ids = form.class_level_ids.length === 0 ? 'At least one class level is required.' : ''
  return !errors.name && !errors.code && !errors.class_level_ids
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    // Convert class level names back to IDs for the API
    const classLevelIds = form.class_level_ids.map(name => {
      const classLevel = classesStore.classes.find(cl => cl.name === name)
      return classLevel ? classLevel.id : null
    }).filter(Boolean)
    
    const payload = {
      name: form.name,
      code: form.code,
      class_level_ids: classLevelIds
    }
    
    await emit('submit', {
      id: props.subject?.id,
      ...payload
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
    console.error('Subject form error:', error)
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
