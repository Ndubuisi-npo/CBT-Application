<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Reopen for Teachers</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>

        <p class="mb-4 text-sm text-slate-500">
          Reopening requires a new, future submission deadline for
          <span class="font-medium text-slate-700">{{ assessment?.title }}</span>.
          Teachers will be able to submit or revise their papers again until then.
        </p>

        <form class="space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="deadline"
            type="datetime-local"
            label="New Submission Deadline"
            required
            :error="error"
            @blur="validate"
          />

          <div class="flex gap-2 pt-2">
            <AppButton type="submit" text="Reopen Assessment" full-width variant="primary" />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import { toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const deadline = ref('')
const error = ref('')

watch(
  () => props.show,
  (show) => {
    if (show) {
      deadline.value = ''
      error.value = ''
    }
  }
)

const validate = () => {
  if (!deadline.value) {
    error.value = 'A submission deadline is required.'
    return false
  }
  const when = new Date(deadline.value)
  if (Number.isNaN(when.getTime())) {
    error.value = 'Enter a valid date and time.'
    return false
  }
  if (when.getTime() <= Date.now()) {
    error.value = 'The deadline must be in the future.'
    return false
  }
  error.value = ''
  return true
}

const submit = () => {
  if (!validate()) return
  emit('submit', { submission_closes_at: toDatetimeLocalIsoWithOffset(deadline.value) })
}
</script>
