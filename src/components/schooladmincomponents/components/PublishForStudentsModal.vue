<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Publish for Students</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>

        <p class="mb-4 text-sm text-slate-500">
          Choose the window during which students can take
          <span class="font-medium text-slate-700">{{ assessment?.title }}</span>.
        </p>

        <form class="space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="startsAt"
            type="datetime-local"
            label="Opens At"
            required
            :error="errors.startsAt"
            @blur="validate"
          />
          <AppInput
            v-model="endsAt"
            type="datetime-local"
            label="Closes At"
            required
            :error="errors.endsAt"
            @blur="validate"
          />

          <div class="flex gap-2 pt-2">
            <AppButton type="submit" text="Publish for Students" full-width variant="primary" />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import { toDatetimeLocalIsoWithOffset } from '../../../js/lib/helpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const startsAt = ref('')
const endsAt = ref('')
const errors = reactive({ startsAt: '', endsAt: '' })

watch(
  () => props.show,
  (show) => {
    if (show) {
      startsAt.value = ''
      endsAt.value = ''
      errors.startsAt = ''
      errors.endsAt = ''
    }
  }
)

const validate = () => {
  errors.startsAt = ''
  errors.endsAt = ''

  if (!startsAt.value) errors.startsAt = 'A start date and time is required.'
  if (!endsAt.value) errors.endsAt = 'An end date and time is required.'
  if (errors.startsAt || errors.endsAt) return false

  const start = new Date(startsAt.value)
  const end = new Date(endsAt.value)
  if (Number.isNaN(start.getTime())) errors.startsAt = 'Enter a valid date and time.'
  if (Number.isNaN(end.getTime())) errors.endsAt = 'Enter a valid date and time.'
  if (errors.startsAt || errors.endsAt) return false

  if (end.getTime() <= start.getTime()) {
    errors.endsAt = 'The closing time must be after the opening time.'
    return false
  }
  return true
}

const submit = () => {
  if (!validate()) return
  emit('submit', {
    student_starts_at: toDatetimeLocalIsoWithOffset(startsAt.value),
    student_ends_at: toDatetimeLocalIsoWithOffset(endsAt.value),
  })
}
</script>
