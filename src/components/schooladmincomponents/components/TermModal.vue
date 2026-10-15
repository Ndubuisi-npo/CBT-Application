<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md max-h-[80vh] transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Term' : 'Create Term' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
            <FormField label="Term Name" :error="errors.name">
              <input v-model="form.name" class="sa-input" placeholder="1st Term" />
            </FormField>
            
            <FormField label="Start Date" :error="errors.startDate">
              <input v-model="form.startDate" type="date" class="sa-input" />
            </FormField>
            
            <FormField label="End Date" :error="errors.endDate">
              <input v-model="form.endDate" type="date" class="sa-input" />
            </FormField>
            
            <div class="flex items-center gap-2">
              <input v-model="form.isCurrent" type="checkbox" id="is-current-term" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" />
              <label for="is-current-term" class="text-sm font-medium text-slate-700">Set as current term</label>
            </div>
          
            <div class="flex gap-2">
              <AppButton 
                type="submit" 
                :text="isEdit ? 'Update Term' : 'Create Term'" 
                full-width 
                variant="primary" 
                :loadingText="isEdit ? 'Updating Term...' : 'Creating Term...'"
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
  term: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.term)

const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  isCurrent: false
})

const errors = reactive({
  name: '',
  startDate: '',
  endDate: ''
})

const loading = ref(false)

const resetForm = () => {
  Object.assign(form, { name: '', startDate: '', endDate: '', isCurrent: false })
  Object.assign(errors, { name: '', startDate: '', endDate: '' })
}

// Watch for term changes and update form
watch(() => props.term, (term) => {
  if (term) {
    form.name = term.name || ''
    form.startDate = term.startDate || term.start_date || ''
    form.endDate = term.endDate || term.end_date || ''
    form.isCurrent = term.current || term.is_current || term.status === 'Active'
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
  errors.name = form.name ? '' : 'Term name is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.startDate && !errors.endDate
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const payload = {
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
      is_current: Boolean(form.isCurrent),
    }
    
    await emit('submit', {
      id: props.term?.id,
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
