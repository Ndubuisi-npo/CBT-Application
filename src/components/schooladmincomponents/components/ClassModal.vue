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
            <FormField label="Class Level">
              <input :value="classLevelName" class="sa-input bg-slate-100" readonly />
            </FormField>

            <FormField :label="prefix ? 'Class Arm Suffix' : 'Class Arm Name'" :error="errors.suffix">
              <input v-model="form.suffix" class="sa-input" :placeholder="prefix ? 'A' : 'JSS 1A'" />
            </FormField>
          
            <div class="flex gap-2">
              <AppButton 
                type="submit" 
                :text="isEdit ? 'Update Class Arm' : 'Create Class Arm'" 
                full-width 
                variant="primary" 
                :loadingText="isEdit ? 'Updating Class Arm...' : 'Creating Class Arm...'"
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
  classItem: { type: Object, default: null },
  classLevelName: { type: String, default: '' }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.classItem)

const form = reactive({
  suffix: ''
})

const errors = reactive({
  suffix: ''
})

const loading = ref(false)

const prefix = computed(() => props.classLevelName?.trim())
const fullName = computed(() => {
  const suffix = form.suffix?.trim()
  if (!prefix.value) return suffix
  return suffix ? `${prefix.value} ${suffix}` : prefix.value
})

const resetForm = () => {
  Object.assign(form, { suffix: '' })
  Object.assign(errors, { suffix: '' })
}

// Watch for class item changes and update form
watch(() => [props.classItem, props.classLevelName], ([classItem, classLevelName]) => {
  if (classItem) {
    const existingName = classItem.name || ''
    const prefixText = classLevelName?.trim()
    if (prefixText && existingName.startsWith(prefixText)) {
      form.suffix = existingName.slice(prefixText.length).trim()
    } else {
      form.suffix = existingName
    }
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
  errors.suffix = form.suffix ? '' : (prefix.value ? 'Class arm suffix is required.' : 'Class arm name is required.')
  return !errors.suffix
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    await emit('submit', {
      id: props.classItem?.id,
      name: fullName.value
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
