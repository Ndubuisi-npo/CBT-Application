<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Preview</p>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ exam.title }}</h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ exam.subject?.name || exam.subject || '—' }} &nbsp;|&nbsp;
            {{ exam.class_level?.name || exam.class_arm?.name || exam.class_name || exam.className || '—' }} &nbsp;|&nbsp;
            {{ questionCount }} questions
          </p>
        </div>
        <button type="button" class="p-2 text-slate-400 hover:text-slate-600" @click="$emit('close')">✕</button>
      </div>

      <div class="space-y-4 p-6">
        <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Loading questions...</div>

        <div v-else-if="!questions.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No questions added to this exam yet.
        </div>

        <article
          v-for="(question, index) in questions"
          :key="question.id || index"
          class="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div class="flex items-start gap-4">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-semibold text-white">
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1 space-y-4">
              <p class="text-base font-semibold leading-7 text-slate-900">{{ getQuestionText(question) }}</p>
              <div v-if="getOptions(question).length" class="grid gap-2 md:grid-cols-2">
                <div
                  v-for="(opt, i) in getOptions(question)"
                  :key="i"
                  class="rounded-xl border px-4 py-3 text-sm"
                  :class="isCorrect(question, opt, i) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'"
                >
                  <span class="font-semibold">{{ String.fromCharCode(65 + i) }}.</span> {{ getOptionText(opt) }}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const props = defineProps({ exam: { type: Object, required: true } })
defineEmits(['close'])

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()
const questions = ref([])
const loading = ref(false)

const questionCount = computed(() => questions.value.length)

const getQuestionText = (q) => {
  const src = q?.question || q?.question_details || q
  return src?.content || src?.question_text || src?.text || 'Untitled question'
}

const getOptions = (q) => {
  const src = q?.question || q?.question_details || q
  const opts = src?.options || src?.answers || src?.choices || []
  return Array.isArray(opts) ? opts : []
}

const getOptionText = (opt) => {
  if (typeof opt === 'string') return opt
  return opt?.content || opt?.text || opt?.label || ''
}

const isCorrect = (q, opt, idx) => {
  if (opt?.is_correct === true) return true
  const src = q?.question || q?.question_details || q
  const answer = src?.correct_answer ?? src?.correctAnswer ?? src?.answer
  if (answer == null) return false
  const optId = opt?.id ? String(opt.id) : null
  const ansStr = String(answer)
  return (
    answer === idx || answer === idx + 1 ||
    ansStr === String(idx) || ansStr === String(idx + 1) ||
    (optId && ansStr === optId) ||
    ansStr.toLowerCase() === getOptionText(opt).toLowerCase()
  )
}

onMounted(async () => {
  loading.value = true
  try {
    questions.value = await store.fetchExamQuestions(props.exam.id)
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    loading.value = false
  }
})
</script>
