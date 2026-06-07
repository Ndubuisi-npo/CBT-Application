<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Timer bar (sticky) -->
    <div
      class="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 shadow-sm"
      :class="timerBarClass"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">{{ exam?.title || 'Exam' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4" :class="timerIconClass" />
            <span
              class="font-mono text-lg font-bold tabular-nums"
              :class="timerTextClass"
              :style="remaining <= 60 ? 'animation: pulse 1s infinite' : ''"
            >
              {{ timerLabel }}
            </span>
          </div>
          <span class="text-xs text-slate-500">{{ answeredCount }}/{{ questions.length }} answered</span>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
        <p class="mt-4 text-sm text-slate-500">Loading exam…</p>
      </div>
    </div>

    <div v-else-if="error" class="mx-auto max-w-lg py-24 text-center">
      <p class="text-lg font-semibold text-slate-900">{{ formattedError }}</p>
      <AppButton class="mt-4" text="Back to Dashboard" variant="primary" @click="goToDashboard" />
    </div>

    <div v-else-if="submitted" class="mx-auto max-w-lg py-24 text-center space-y-4">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 class="h-10 w-10 text-emerald-600" />
      </div>
      <h2 class="text-2xl font-bold text-slate-900">Exam Submitted!</h2>
      <p class="text-slate-500">Your answers have been recorded. Results will be available once your teacher publishes them.</p>
      <AppButton text="Back to Dashboard" variant="primary" @click="goToDashboard" />
    </div>

    <template v-else-if="questions.length">
      <div class="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <!-- Question card -->
        <div class="space-y-4">
          <div class="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Question {{ currentIndex + 1 }} of {{ questions.length }}
                </p>
                <div v-if="savedIndicator" class="mt-1 text-xs text-emerald-600 font-medium">✓ Saved</div>
              </div>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                :class="isFlagged(currentQuestion) ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="toggleFlag(currentQuestion)"
              >
                <Flag class="h-3.5 w-3.5" />
                {{ isFlagged(currentQuestion) ? 'Flagged' : 'Flag' }}
              </button>
            </div>

            <div class="mt-4 rounded-xl bg-slate-50 p-4">
              <p class="text-base font-semibold leading-7 text-slate-900">{{ getQuestionText(currentQuestion) }}</p>
            </div>

            <div class="mt-5 space-y-3">
              <label
                v-for="(opt, idx) in getOptions(currentQuestion)"
                :key="idx"
                class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition"
                :class="isSelected(currentQuestion, opt, idx)
                  ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
              >
                <input
                  type="radio"
                  :name="`q-${getQId(currentQuestion)}`"
                  :checked="isSelected(currentQuestion, opt, idx)"
                  class="mt-0.5 h-4 w-4 cursor-pointer text-[#0B1F3A]"
                  @change="selectAnswer(currentQuestion, opt, idx)"
                />
                <span class="text-sm leading-6 text-slate-900">
                  <span class="font-semibold">{{ String.fromCharCode(65 + idx) }}.</span>
                  {{ getOptionText(opt) }}
                </span>
              </label>
            </div>

            <!-- Navigation -->
            <div class="mt-6 flex items-center justify-between">
              <AppButton
                text="Previous"
                variant="ghost"
                :disabled="currentIndex === 0"
                @click="currentIndex--"
              />
              <AppButton
                v-if="currentIndex < questions.length - 1"
                text="Next"
                variant="primary"
                @click="currentIndex++"
              />
              <AppButton
                v-else
                text="Submit Exam"
                variant="primary"
                @click="confirmSubmit"
              />
            </div>
          </div>
        </div>

        <!-- Navigation panel -->
        <aside class="space-y-4">
          <!-- Progress bar -->
          <div class="rounded-[20px] border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Progress</p>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-2 rounded-full bg-[#0B1F3A] transition-all duration-300"
                :style="{ width: `${progressPct}%` }"
              />
            </div>
            <p class="mt-2 text-sm text-slate-600">{{ answeredCount }} of {{ questions.length }} answered</p>
          </div>

          <!-- Navigation dots -->
          <div class="rounded-[20px] border border-slate-200 bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Questions</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="(q, idx) in questions"
                :key="getQId(q, idx)"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition"
                :class="navDotClass(q, idx)"
                @click="currentIndex = idx"
              >
                {{ idx + 1 }}
              </button>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-emerald-500" /> Answered</div>
              <div class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-amber-400" /> Flagged</div>
              <div class="flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-slate-300" /> Unanswered</div>
              <div class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-[#0B1F3A]" /> Current</div>
            </div>

            <AppButton
              class="mt-4 w-full"
              text="Submit Exam"
              variant="primary"
              @click="confirmSubmit"
            />
          </div>
        </aside>
      </div>
    </template>

    <!-- Submit confirmation dialog -->
    <div v-if="showSubmitConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <h2 class="text-xl font-semibold text-slate-900">Submit Exam?</h2>
        <p class="mt-3 text-sm text-slate-500">
          You have answered {{ answeredCount }} of {{ questions.length }} questions.
          <span v-if="unansweredCount > 0" class="font-semibold text-amber-600">
            {{ unansweredCount }} question(s) unanswered.
          </span>
          This action cannot be undone.
        </p>
        <div class="mt-6 flex gap-3 justify-end">
          <AppButton text="Keep working" variant="ghost" @click="showSubmitConfirm = false" />
          <AppButton text="Submit now" variant="primary" :processing="submitting" @click="submitExam" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, Clock, Flag } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import {
  getStudentExamAttempt,
  getStudentExamQuestions,
  saveStudentAnswer,
  getTimeRemaining,
  flagQuestion,
  submitStudentAttempt,
} from '../services/api/studentExams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { fmtDateTime } from '../../../js/lib/helpers'

const route = useRoute()
const router = useRouter()
const uiStore = useSchoolAdminUiStore()
const examId = route.params.id

// ── State ──────────────────────────────────────────────────────────────────

const exam = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const attemptId = ref(null)
const answers = reactive({})   // { [questionId]: optionValue }
const flagged = reactive({})   // { [questionId]: boolean }
const loading = ref(true)
const error = ref(null)
const submitted = ref(false)
const submitting = ref(false)
const showSubmitConfirm = ref(false)
const savedIndicator = ref(false)

// Replace raw ISO timestamps in error messages with localised display times
const formattedError = computed(() => {
  if (!error.value) return ''
  return error.value.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g,
    (match) => fmtDateTime(match) || match
  )
})

// ── Timer (backend is source of truth per spec) ───────────────────────────

const remaining = ref(0)
let timerEnd = 0
let timerInterval = null

const timerLabel = computed(() => {
  const secs = Math.max(0, Math.round(remaining.value))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const timerBarClass = computed(() => {
  if (remaining.value <= 60) return 'bg-rose-50 border-rose-200'
  if (remaining.value <= 300) return 'bg-amber-50 border-amber-200'
  return ''
})

const timerIconClass = computed(() => {
  if (remaining.value <= 60) return 'text-rose-600'
  if (remaining.value <= 300) return 'text-amber-600'
  return 'text-slate-500'
})

const timerTextClass = computed(() => {
  if (remaining.value <= 60) return 'text-rose-600'
  if (remaining.value <= 300) return 'text-amber-600'
  return 'text-slate-900'
})

const startTimer = (seconds) => {
  timerEnd = Date.now() + seconds * 1000
  remaining.value = seconds
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    const newRemaining = (timerEnd - Date.now()) / 1000
    remaining.value = Math.max(0, newRemaining)
    if (remaining.value <= 0) {
      clearInterval(timerInterval)
      autoSubmit()
    }
  }, 1000)
}

const resyncTimer = async () => {
  if (!attemptId.value) return
  try {
    const data = await getTimeRemaining(attemptId.value)
    const secs = data?.time_remaining_seconds ?? data?.remaining ?? data
    if (typeof secs === 'number' && secs > 0) {
      timerEnd = Date.now() + secs * 1000
      remaining.value = secs
    }
  } catch {
    // Non-critical — local timer continues
  }
}

// Resync when tab becomes visible again (spec requirement)
const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    resyncTimer()
  }
}

// ── Computed ───────────────────────────────────────────────────────────────

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

const answeredCount = computed(() =>
  Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null).length,
)

const unansweredCount = computed(() => questions.value.length - answeredCount.value)

const progressPct = computed(() =>
  questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0,
)

// ── Helpers ────────────────────────────────────────────────────────────────

const getQId = (q, fallback = 0) => q?.id || q?.question_id || `q-${fallback}`

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
  return opt?.content || opt?.text || opt?.label || String(opt || '')
}

const getOptionValue = (opt, idx) => {
  if (opt?.id) return opt.id
  return `${idx}`
}

const isSelected = (q, opt, idx) => {
  const qId = getQId(q)
  const val = getOptionValue(opt, idx)
  return answers[qId] === val
}

const isFlagged = (q) => !!flagged[getQId(q)]

const navDotClass = (q, idx) => {
  const qId = getQId(q, idx)
  const isCurrent = idx === currentIndex.value
  const isAnswered = answers[qId] !== undefined && answers[qId] !== null
  const isFlag = flagged[qId]

  if (isCurrent) return 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
  if (isFlag) return 'border-amber-400 bg-amber-50 text-amber-700'
  if (isAnswered) return 'border-emerald-400 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 text-slate-600 hover:border-slate-400'
}

// ── Actions ────────────────────────────────────────────────────────────────

const selectAnswer = async (q, opt, idx) => {
  const qId = getQId(q)
  const val = getOptionValue(opt, idx)
  answers[qId] = val

  // Auto-save — fire and forget (spec requirement)
  if (attemptId.value) {
    try {
      await saveStudentAnswer(attemptId.value, qId, {
        selected_option_ids: [val],
        time_spent_seconds: null,
      })
      savedIndicator.value = true
      setTimeout(() => { savedIndicator.value = false }, 2000)
    } catch {
      // Non-blocking — answer saved locally, server-side check on submit
    }
  }
}

const toggleFlag = async (q) => {
  if (!q) return
  const qId = getQId(q)
  flagged[qId] = !flagged[qId]

  if (attemptId.value) {
    try {
      await flagQuestion(attemptId.value, qId)
    } catch {
      // Non-critical
    }
  }
}

const confirmSubmit = () => {
  showSubmitConfirm.value = true
}

const submitExam = async () => {
  if (!attemptId.value || submitting.value) return
  submitting.value = true
  showSubmitConfirm.value = false
  try {
    await submitStudentAttempt(attemptId.value)
    clearInterval(timerInterval)
    submitted.value = true
  } catch (err) {
    uiStore.addToast({
      title: 'Submit failed',
      message: err.message || 'Could not submit. Please check your connection and try again.',
      variant: 'error',
    })
    submitting.value = false
  }
}

const autoSubmit = async () => {
  if (submitted.value || !attemptId.value) return
  try {
    await submitStudentAttempt(attemptId.value)
    submitted.value = true
  } catch {
    // Backend will auto-submit on time expiry — show message
    submitted.value = true
  }
}

const goToDashboard = () => router.push({ name: 'StudentDashboard' })

// ── Load ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  try {
    // 1. Get or resume active attempt
    // API returns { attempt: {...}, questions: [...], order: [...], time_remaining_seconds: N }
    // or the attempt object directly — handle both shapes
    let raw
    try {
      raw = await getStudentExamAttempt(examId)
    } catch (err) {
      if (err?.status === 404 || (err?.message || '').includes('404')) {
        error.value = 'No active attempt found. Please go back to the dashboard and start the exam.'
        return
      }
      throw err
    }

    // Normalise: backend may wrap in { attempt, questions, ... } or return attempt directly
    const attempt = raw?.attempt ?? raw
    const embeddedQuestions = raw?.questions ?? null
    const embeddedTimeRemaining = raw?.time_remaining_seconds ?? null

    if (!attempt?.id) {
      error.value = 'Could not load your exam attempt.'
      return
    }

    attemptId.value = attempt.id
    // Use embedded exam data for title etc.
    exam.value = attempt.exam ?? attempt

    // 2. Load questions — use embedded if available, otherwise fetch separately
    let qs
    if (embeddedQuestions && Array.isArray(embeddedQuestions) && embeddedQuestions.length > 0) {
      qs = embeddedQuestions
    } else {
      const fetched = await getStudentExamQuestions(attempt.id)
      qs = Array.isArray(fetched) ? fetched : (fetched?.data || [])
    }

    // Questions may be wrapped as exam_question objects with nested question
    questions.value = qs.map((q) => {
      // If the item has a top-level `question` object, merge it up for easy access
      if (q?.question && typeof q.question === 'object') {
        return { ...q, ...q.question, _exam_question_id: q.id, id: q.question.id }
      }
      return q
    })

    // Restore saved answers from attempt data
    const savedAnswers = attempt.answers ?? raw?.answers
    if (savedAnswers && typeof savedAnswers === 'object') {
      if (Array.isArray(savedAnswers)) {
        savedAnswers.forEach((a) => {
          if (a?.question_id && a?.selected_option_ids?.length) {
            answers[a.question_id] = a.selected_option_ids[0]
          }
        })
      } else {
        Object.entries(savedAnswers).forEach(([qId, val]) => {
          answers[qId] = val
        })
      }
    }

    // 3. Start timer — backend time_remaining_seconds is source of truth
    const timeRemaining =
      embeddedTimeRemaining ??
      attempt.time_remaining_seconds ??
      attempt.timeRemainingSeconds ??
      (attempt.exam?.duration_minutes || attempt.duration_minutes || 60) * 60

    startTimer(timeRemaining)
  } catch (err) {
    error.value = err.message || 'Failed to load the exam. Please try again.'
  } finally {
    loading.value = false
  }

  // Visibility resync (spec requirement)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  clearInterval(timerInterval)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
