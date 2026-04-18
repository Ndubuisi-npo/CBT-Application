<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Session' : 'Create Session' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <form class="space-y-4" @submit.prevent="submit">
          <FormField label="Session name" :error="errors.name">
            <input v-model="form.name" class="sa-input" placeholder="2025/2026" />
          </FormField>
          
          <FormField label="Start date" :error="errors.startDate">
            <input v-model="form.startDate" type="date" class="sa-input" />
          </FormField>
          
          <FormField label="End date" :error="errors.endDate">
            <input v-model="form.endDate" type="date" class="sa-input" />
          </FormField>
          
          <div class="flex items-center gap-2">
            <input v-model="form.isCurrent" type="checkbox" id="is-current" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" />
            <label for="is-current" class="text-sm font-medium text-slate-700">Set as current academic session</label>
          </div>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Session' : 'Create Session'" 
              full-width 
              variant="primary" 
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
  session: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.session)

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

// Watch for session changes and update form
watch(() => props.session, (session) => {
  if (session) {
    form.name = session.name || ''
    form.startDate = session.startDate || session.start_date || ''
    form.endDate = session.endDate || session.end_date || ''
    form.isCurrent = session.current || session.is_current || session.status === 'Active'
  } else {
    resetForm()
  }
}, { immediate: true })

const validate = () => {
  errors.name = form.name ? '' : 'Session name is required.'
  errors.startDate = form.startDate ? '' : 'Start date is required.'
  errors.endDate = form.endDate ? '' : 'End date is required.'
  return !errors.name && !errors.startDate && !errors.endDate
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    console.log('Form data before submission:', form)
    
    const payload = {
      name: form.name,
      start_date: form.startDate ? new Date(form.startDate + 'T00:00:00').toISOString() : null,
      end_date: form.endDate ? new Date(form.endDate + 'T00:00:00').toISOString() : null,
    }
    
    console.log('Payload before submission:', payload)
    
    // Only include isCurrent if it's true, to avoid sending false
    if (form.isCurrent) {
      payload.is_current = true
    }
    
    await emit('submit', {
      id: props.session?.id,
      ...payload
    })
    
    resetForm()
    emit('close')
  } catch (error) {
    console.error('Session form error:', error)
  } finally {
    loading.value = false
  }
}
</script>
