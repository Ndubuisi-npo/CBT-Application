<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Class Level' : 'Create Class Level' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <form class="space-y-4" @submit.prevent="submit">
          <FormField label="Class Level Name" :error="errors.name">
            <input v-model="form.name" class="sa-input" placeholder="JSS 1" />
          </FormField>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Class Level' : 'Create Class Level'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Class Level...' : 'Creating Class Level...'"
              :processing="loading" 
              :disabled="loading"
            />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
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
  classLevel: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.classLevel)

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

// Watch for class level changes and update form
watch(() => props.classLevel, (classLevel) => {
  console.log('ClassLevel changed:', classLevel)
  if (classLevel) {
    console.log('Populating form with class level data:', classLevel)
    form.name = classLevel.name || ''
    console.log('Form after population:', form)
  } else {
    console.log('Resetting form')
    resetForm()
  }
}, { immediate: true })

const validate = () => {
  errors.name = form.name ? '' : 'Class level name is required.'
  return !errors.name
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    await emit('submit', {
      id: props.classLevel?.id,
      name: form.name
    })
    
    resetForm()
  } catch (error) {
    console.error('Class level form error:', error)
  } finally {
    // Add a small delay to ensure loading state is visible
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
}
</script>
