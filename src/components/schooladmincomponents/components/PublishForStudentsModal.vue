<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Assessment lifecycle</p>
          <h3 class="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Publish for students</h3>
          <p class="mt-1 text-sm text-slate-500">
            Choose the window during which students can take
            <span class="font-medium text-slate-700">{{ assessment?.title }}</span>.
          </p>
        </div>
        <button
          type="button"
          class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
          @click="$emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <form class="space-y-4 px-6 py-6" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="startsAt"
            type="datetime-local"
            label="Opens at"
            required
            :error="errors.startsAt"
            @blur="validate"
          />
          <AppInput
            v-model="endsAt"
            type="datetime-local"
            label="Closes at"
            required
            :error="errors.endsAt"
            @blur="validate"
          />
        </div>

        <div class="flex gap-2 border-t border-slate-100 pt-5">
          <AppButton type="button" text="Cancel" variant="outline" class="flex-1" @click="$emit('close')" />
          <AppButton type="submit" text="Publish for students" variant="primary" class="flex-1" />
        </div>
      </form>
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
