<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Submission window</p>
          <h2 class="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{{ assessment?.schedule_id ? 'Edit submission window' : 'Add submission window' }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ assessment?.title }}</p>
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
        <AppInput v-model="form.question_submission_ends" label="Question submission ends" type="datetime-local" required :error="errors.question_submission_ends" hint="Teachers can build and revise their papers until this moment." />
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput v-model="form.assessment_starts" label="Assessment starts (optional)" type="datetime-local" :error="errors.assessment_starts" />
          <AppInput v-model="form.assessment_ends" label="Assessment ends (optional)" type="datetime-local" :error="errors.assessment_ends" />
        </div>
        <p v-if="error" class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error }}</p>
        <div class="flex gap-2 border-t border-slate-100 pt-5">
          <AppButton type="button" text="Cancel" variant="outline" class="flex-1" @click="$emit('close')" />
          <AppButton type="submit" :text="assessment?.schedule_id ? 'Update window' : 'Save window'" variant="primary" class="flex-1" :processing="saving" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const form = reactive({ question_submission_ends: '', assessment_starts: '', assessment_ends: '' })
const errors = reactive({})

const reset = () => {
  form.question_submission_ends = props.assessment?.question_submission_ends || ''
  form.assessment_starts = props.assessment?.assessment_starts || ''
  form.assessment_ends = props.assessment?.assessment_ends || ''
  Object.keys(errors).forEach((key) => delete errors[key])
}

watch(() => [props.show, props.assessment], ([show]) => {
  if (show) reset()
}, { immediate: true })

const submit = () => {
  Object.keys(errors).forEach((key) => delete errors[key])
  if (!form.question_submission_ends) errors.question_submission_ends = 'Required.'
  const questionEnds = new Date(form.question_submission_ends)
  const assessmentStarts = new Date(form.assessment_starts)
  const assessmentEnds = new Date(form.assessment_ends)
  if (form.question_submission_ends && form.assessment_starts && assessmentStarts < questionEnds) {
    errors.assessment_starts = 'Must be after question submission ends.'
  }
  if (form.assessment_starts && form.assessment_ends && assessmentEnds <= assessmentStarts) {
    errors.assessment_ends = 'Must be after assessment starts.'
  }
  if (!Object.keys(errors).length) emit('submit', { ...form })
}
</script>
