<template>
  <article class="rounded-[20px] border bg-white p-6 shadow-sm" :class="cardBorderClass">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="text-sm font-semibold text-slate-500">Q{{ number }}</span>
          <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
            {{ typeLabel }}
          </span>
          <span v-if="isMultipleAnswerMcq" class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            Multiple Answer
          </span>
        </div>
        <p class="text-base font-medium leading-7 text-slate-900">{{ questionText }}</p>
        <img
          v-if="questionImage"
          :src="questionImage"
          alt="Question"
          class="mt-3 max-h-48 rounded-lg object-contain"
        />
      </div>
      <div class="shrink-0 text-right">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          :class="overallResultClass"
        >
          <span class="text-base leading-none">{{ overallResultIcon }}</span>
          {{ overallResultLabel }}
        </span>
        <p class="mt-1 text-xs text-slate-500">
          {{ marksAwarded ?? 0 }} / {{ marksAvailable ?? '?' }} marks
        </p>
      </div>
    </div>

    <!-- MCQ / True-False: option list -->
    <div v-if="questionType !== 'fill_in_blank'" class="mt-5 space-y-2">
      <div
        v-for="(opt, idx) in allOptions"
        :key="opt.id || idx"
        class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition"
        :class="optionClass(opt)"
      >
        <!-- Input type indicator (non-interactive) -->
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border"
          :class="isMultipleAnswerMcq ? 'rounded' : 'rounded-full'"
          :style="optionIndicatorStyle(opt)"
        />
        <span class="flex-1 text-sm" :class="optionTextClass(opt)">
          <span class="font-semibold">{{ String.fromCharCode(65 + idx) }}.</span>
          {{ getOptionText(opt) }}
        </span>
        <!-- Status icons -->
        <div class="flex items-center gap-1 shrink-0">
          <span v-if="isCorrectAndSelected(opt)" title="Correct & Selected" class="text-base">🟢</span>
          <span v-else-if="isCorrectNotSelected(opt)" title="Correct but not selected" class="text-base">🔵</span>
          <span v-else-if="isIncorrectSelected(opt)" title="Wrong selection" class="text-base">🔴</span>
        </div>
      </div>
    </div>

    <!-- FITB: text answer -->
    <div v-else class="mt-5 grid gap-3 sm:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Your Answer</p>
        <p class="mt-2 text-sm text-slate-700 italic">
          "{{ studentTextAnswer || 'No answer given' }}"
        </p>
      </div>
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Acceptable Answers</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="(acc, ai) in acceptableAnswers"
            :key="ai"
            class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
          >
            {{ typeof acc === 'object' ? acc.content : acc }}
            <span v-if="acc?.case_sensitive" class="opacity-60">(case-sensitive)</span>
          </span>
          <span v-if="!acceptableAnswers.length" class="text-xs text-slate-400">Not available</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div v-if="questionType !== 'fill_in_blank'" class="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
      <span class="flex items-center gap-1.5 text-xs text-slate-500"><span>🟢</span> Correct & Selected</span>
      <span class="flex items-center gap-1.5 text-xs text-slate-500"><span>🔵</span> Correct, not selected</span>
      <span class="flex items-center gap-1.5 text-xs text-slate-500"><span>🔴</span> Wrong selection</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { isMultipleAnswer, QUESTION_TYPE_LABELS } from '../../types/question'

const props = defineProps({
  /** Question number (1-based) */
  number: { type: Number, required: true },
  /** The result question object from the API */
  question: { type: Object, required: true },
})

// ── Derived from question object ─────────────────────────────────────────────

const questionType = computed(() => props.question?.type || '')
const typeLabel = computed(() => QUESTION_TYPE_LABELS[questionType.value] || questionType.value || 'Unknown')

const questionText = computed(() => {
  const q = props.question
  return q?.content || q?.question_text || q?.text || q?.title || 'Untitled question'
})

const questionImage = computed(() => {
  const q = props.question
  return q?.image_url || q?.image || null
})

const marksAwarded = computed(() => props.question?.marks_awarded ?? props.question?.marks_scored ?? null)
const marksAvailable = computed(() => props.question?.marks_available ?? props.question?.marks ?? null)

const isMultipleAnswerMcq = computed(() =>
  questionType.value === 'mcq' && isMultipleAnswer(props.question),
)

// ── Options & Answer resolution ───────────────────────────────────────────────

/**
 * All options for the question.
 * For FITB questions this is empty.
 */
const allOptions = computed(() => {
  if (questionType.value === 'fill_in_blank') return []
  return Array.isArray(props.question?.options) ? props.question.options : []
})

/**
 * Set of option IDs the student selected.
 */
const selectedOptionIds = computed(() => {
  const q = props.question
  // Prefer explicit selected_option_ids array
  if (Array.isArray(q?.selected_option_ids) && q.selected_option_ids.length) {
    return new Set(q.selected_option_ids.map(String))
  }
  // Fallback: selected_options array of objects
  if (Array.isArray(q?.selected_options) && q.selected_options.length) {
    return new Set(q.selected_options.map((o) => String(o?.id ?? o)))
  }
  // Fallback: single selected answer
  const single = q?.selected_answer ?? q?.selected_option ?? q?.answer
  if (single != null) return new Set([String(single)])
  return new Set()
})

/**
 * Set of option IDs that are correct.
 */
const correctOptionIds = computed(() => {
  const q = props.question
  // Prefer explicit correct_option_ids array
  if (Array.isArray(q?.correct_option_ids) && q.correct_option_ids.length) {
    return new Set(q.correct_option_ids.map(String))
  }
  // Infer from options' is_correct flag
  const opts = allOptions.value.filter((o) => o?.is_correct === true || o?.is_correct === 'true')
  if (opts.length) {
    return new Set(opts.map((o) => String(o.id ?? '')).filter(Boolean))
  }
  // Fallback: correct_options array
  if (Array.isArray(q?.correct_options) && q.correct_options.length) {
    return new Set(q.correct_options.map((o) => String(o?.id ?? o)))
  }
  return new Set()
})

// ── FITB ─────────────────────────────────────────────────────────────────────

const studentTextAnswer = computed(() => {
  const q = props.question
  return q?.text_answer ?? q?.submitted_text ?? q?.answer ?? ''
})

const acceptableAnswers = computed(() => {
  return Array.isArray(props.question?.acceptable_answers) ? props.question.acceptable_answers : []
})

// ── Option helpers ────────────────────────────────────────────────────────────

const getOptionId = (opt) => String(opt?.id ?? opt ?? '')
const getOptionText = (opt) => {
  if (typeof opt === 'string') return opt
  return opt?.content || opt?.text || opt?.label || ''
}

const isCorrect = (opt) => correctOptionIds.value.has(getOptionId(opt))
const isSelected = (opt) => selectedOptionIds.value.has(getOptionId(opt))

const isCorrectAndSelected = (opt) => isCorrect(opt) && isSelected(opt)
const isCorrectNotSelected = (opt) => isCorrect(opt) && !isSelected(opt)
const isIncorrectSelected = (opt) => !isCorrect(opt) && isSelected(opt)

const optionClass = (opt) => {
  if (isCorrectAndSelected(opt)) return 'border-emerald-400 bg-emerald-50'
  if (isCorrectNotSelected(opt)) return 'border-blue-300 bg-blue-50'
  if (isIncorrectSelected(opt)) return 'border-red-300 bg-red-50'
  return 'border-slate-200 bg-slate-50/50'
}

const optionTextClass = (opt) => {
  if (isCorrectAndSelected(opt)) return 'text-emerald-900 font-medium'
  if (isCorrectNotSelected(opt)) return 'text-blue-900'
  if (isIncorrectSelected(opt)) return 'text-red-900'
  return 'text-slate-700'
}

const optionIndicatorStyle = (opt) => {
  if (isCorrectAndSelected(opt)) return 'background:#10b981; border-color:#10b981;'
  if (isCorrectNotSelected(opt)) return 'background:#3b82f6; border-color:#3b82f6;'
  if (isIncorrectSelected(opt)) return 'background:#ef4444; border-color:#ef4444;'
  return 'background:transparent; border-color:#cbd5e1;'
}

// ── Overall result ────────────────────────────────────────────────────────────

const isFullyCorrect = computed(() => {
  const q = props.question
  if (q?.is_correct === true || q?.correct === true) return true
  // For FITB check marks
  if (questionType.value === 'fill_in_blank') {
    return marksAwarded.value != null && marksAvailable.value != null && marksAwarded.value >= marksAvailable.value
  }
  // For MCQ: all selected must be correct and all correct must be selected
  if (correctOptionIds.value.size > 0) {
    const selectedArr = Array.from(selectedOptionIds.value)
    const correctArr = Array.from(correctOptionIds.value)
    return (
      selectedArr.every((id) => correctOptionIds.value.has(id)) &&
      correctArr.every((id) => selectedOptionIds.value.has(id))
    )
  }
  return false
})

const isPartiallyCorrect = computed(() => {
  if (isFullyCorrect.value) return false
  if (marksAwarded.value != null && marksAwarded.value > 0) return true
  // Has some correct selections but not all
  const selectedArr = Array.from(selectedOptionIds.value)
  return selectedArr.some((id) => correctOptionIds.value.has(id))
})

const overallResultIcon = computed(() => {
  if (isFullyCorrect.value) return '✓'
  if (isPartiallyCorrect.value) return '~'
  return '✗'
})

const overallResultLabel = computed(() => {
  if (isFullyCorrect.value) return 'Correct'
  if (isPartiallyCorrect.value) return 'Partial'
  return 'Wrong'
})

const overallResultClass = computed(() => {
  if (isFullyCorrect.value) return 'bg-emerald-100 text-emerald-800'
  if (isPartiallyCorrect.value) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
})

const cardBorderClass = computed(() => {
  if (isFullyCorrect.value) return 'border-emerald-200'
  if (isPartiallyCorrect.value) return 'border-amber-200'
  return 'border-red-200'
})
</script>
