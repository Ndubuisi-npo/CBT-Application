<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Class' : 'Create Class' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
            <FormField label="Class Name" :error="errors.name">
              <input v-model="form.name" class="sa-input" placeholder="JSS 1A" />
            </FormField>
          
            <div class="flex gap-2">
              <AppButton 
                type="submit" 
                :text="isEdit ? 'Update Class' : 'Create Class'" 
                full-width 
                variant="primary" 
                :loadingText="isEdit ? 'Updating Class...' : 'Creating Class...'"
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
  classItem: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.classItem)

const form = reactive({
  name: ''
})

const errors = reactive({
  name: ''
})

const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { name: '' })
  Object.assign(errors, { name: '' })
}

// Watch for class item changes and update form
watch(() => props.classItem, (classItem) => {
  if (classItem) {
    form.name = classItem.name || ''
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
  errors.name = form.name ? '' : 'Class name is required.'
  return !errors.name
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    await emit('submit', {
      id: props.classItem?.id,
      name: form.name
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
