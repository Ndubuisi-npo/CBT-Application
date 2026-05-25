<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
    <div>
      <div class="rounded-[20px] border border-slate-200 bg-white p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Question {{ currentIndex + 1 }} of {{ questions.length }}</h3>
            <p class="mt-2 text-sm text-slate-500">{{ currentQuestion?.topic || '' }}</p>
          </div>
          <div class="text-sm text-slate-500">Time left: {{ timeLeftLabel }}</div>
        </div>

        <div class="mt-4">
          <div class="rounded-lg bg-slate-50 p-4 text-slate-900">{{ currentQuestion?.content }}</div>

          <div class="mt-4 space-y-3">
            <label v-for="(opt, idx) in currentQuestion?.options || []" :key="idx" class="block rounded-lg border p-3">
              <input type="radio" :name="currentQuestion.id" :value="opt" v-model="answers[currentQuestion.id]" @change="handleAnswerChange(currentQuestion.id, opt)" />
              <span class="ml-3">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AppButton text="Previous" variant="ghost" :disabled="currentIndex === 0" @click="changeQuestion(-1)" />
            <AppButton text="Mark for Review" variant="outline" @click="toggleMark()" />
            <AppButton text="Clear Response" variant="ghost" @click="clearResponse()" />
          </div>
          <div>
            <AppButton text="Next" variant="primary" @click="changeQuestion(1)" />
          </div>
        </div>
      </div>
    </div>

    <aside>
      <div class="rounded-[20px] border border-slate-200 bg-white p-5">
        <h4 class="font-semibold text-slate-900">Question Palette</h4>
        <div class="mt-4 grid grid-cols-5 gap-2">
          <button v-for="(q, idx) in questions" :key="q.id" class="h-10 w-10 rounded border" :class="paletteClass(q)" @click="goTo(idx)">{{ idx + 1 }}</button>
        </div>

        <div class="mt-4 space-y-2 text-sm text-slate-600">
          <div class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-emerald-500"></span> Answered</div>
          <div class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-amber-400"></span> Marked</div>
          <div class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-slate-200 border"></span> Unanswered</div>
        </div>

        <div class="mt-6">
          <AppButton text="Submit" variant="primary" @click="submitExam" />
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { getQuestionBankForExam } from '../../teacherscomponent/data/mockTeacherData'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getStudentExamAttempt, getStudentExamQuestions, saveStudentAnswer, bulkSaveAnswers, getTimeRemaining, flagQuestion, submitStudentAttempt, getAttemptResult } from '../services/api/studentExams'

const route = useRoute()
const router = useRouter()
const uiStore = useSchoolAdminUiStore()
const examId = route.params.id

const exam = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const answers = reactive({})
const marked = reactive({})
const attemptId = ref(null)

const durationSeconds = ref(0)
const remaining = ref(0)
const loading = ref(true)
const isSubmitting = ref(false)
const savingAnswer = ref(false)
let timer = null
let autoSaveTimer = null

const normalizeAnswerKey = (item) => item.question_id || item.questionId || item.id
const normalizeAnswerValue = (item) => item.answer ?? item.response ?? item.selected_option ?? item.value

const setAnswersFromAttempt = (attemptAnswers = []) => {
  attemptAnswers.forEach((item) => {
    const questionId = normalizeAnswerKey(item)
    if (!questionId) return
    answers[questionId] = normalizeAnswerValue(item)
  })
}

const orderQuestions = (rawQuestions = [], order = []) => {
  if (!Array.isArray(order) || !order.length) return rawQuestions
  const lookup = Object.fromEntries(rawQuestions.map((question) => [String(question.id), question]))
  return order.map((questionId) => lookup[String(questionId)]).filter(Boolean)
}

const loadExamAttempt = async () => {
  loading.value = true
  try {
    const response = await getStudentExamAttempt(examId)
    const attempt = response.attempt || response.data?.attempt || response
    if (!attempt?.id && !attempt?.attempt_id) {
      throw new Error('No active attempt is available for this exam.')
    }

    attemptId.value = attempt.id || attempt.attempt_id
    exam.value = response.exam || attempt.exam || exam.value || {}
    
    // Try to get questions from the attempt response, otherwise fetch separately
    let rawQuestions = response.questions || attempt.questions || []
    if (!rawQuestions.length) {
      try {
        rawQuestions = await getStudentExamQuestions(examId)
      } catch (e) {
        // Fallback to mock data if API fails
        if (exam.value.questions) {
          rawQuestions = getQuestionBankForExam(exam.value.questions)
        }
      }
    }
    
    questions.value = orderQuestions(rawQuestions, response.order || [])

    setAnswersFromAttempt(attempt.answers || attempt.responses || [])
    
    // Try to get time remaining from API, otherwise use attempt data
    try {
      const timeResponse = await getTimeRemaining(attemptId.value)
      durationSeconds.value = Number(timeResponse.remaining_seconds ?? timeResponse.time_remaining ?? attempt.remaining_seconds ?? attempt.duration_seconds ?? exam.value.duration * 60) || (exam.value.duration || 60) * 60
    } catch (e) {
      durationSeconds.value = Number(attempt.remaining_seconds ?? attempt.duration_seconds ?? exam.value.duration * 60) || (exam.value.duration || 60) * 60
    }
    
    remaining.value = durationSeconds.value
    startTimer()
    startAutoSave()
  } catch (error) {
    uiStore.addToast({
      title: 'Unable to resume exam',
      message: error.message || 'Please return to your dashboard.',
      variant: 'error',
    })
    router.push({ name: 'StudentDashboard' })
  } finally {
    loading.value = false
  }
}

const startAutoSave = () => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  // Auto-save every 30 seconds
  autoSaveTimer = setInterval(() => {
    bulkSaveAllAnswers()
  }, 30000)
}

onMounted(loadExamAttempt)

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  // Final save before unmounting
  bulkSaveAllAnswers()
})

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      clearInterval(timer)
      submitExam()
    }
  }, 1000)
}

const timeLeftLabel = computed(() => {
  const mins = Math.floor(remaining.value / 60)
  const secs = remaining.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const changeQuestion = (delta) => {
  const next = currentIndex.value + delta
  if (next < 0 || next >= questions.value.length) return
  currentIndex.value = next
}

const goTo = (index) => {
  currentIndex.value = index
}

const toggleMark = async () => {
  const q = currentQuestion.value
  if (!q) return
  marked[q.id] = !marked[q.id]
  
  // Call the flagQuestion API if attemptId is available
  if (attemptId.value && marked[q.id]) {
    try {
      await flagQuestion(attemptId.value, q.id)
    } catch (error) {
      // Don't block UI if flag API fails
      console.error('Failed to flag question:', error)
    }
  }
}

const clearResponse = () => {
  const q = currentQuestion.value
  if (!q) return
  delete answers[q.id]
}

const paletteClass = (q) => {
  if (answers[q.id]) return 'border-0 bg-emerald-100'
  if (marked[q.id]) return 'border-0 bg-amber-100'
  return ''
}

const handleAnswerChange = async (questionId, value) => {
  answers[questionId] = value
  if (!questionId || !attemptId.value) return
  savingAnswer.value = true
  try {
    await saveStudentAnswer(attemptId.value, questionId, { answer: value })
  } catch (error) {
    uiStore.addToast({ title: 'Save failed', message: error.message || 'Could not save your answer.', variant: 'error' })
  } finally {
    savingAnswer.value = false
  }
}

const bulkSaveAllAnswers = async () => {
  if (!attemptId.value || Object.keys(answers).length === 0) return
  try {
    const answersPayload = Object.entries(answers).map(([questionId, answer]) => ({
      question_id: questionId,
      answer: answer,
    }))
    await bulkSaveAnswers(attemptId.value, { answers: answersPayload })
  } catch (error) {
    console.error('Bulk save failed:', error)
    // Don't show toast for bulk save failures to avoid annoying the user
  }
}

const submitExam = async () => {
  if (isSubmitting.value || !exam.value) return
  isSubmitting.value = true
  clearInterval(timer)

  try {
    const currentAttemptId = attemptId.value || route.query.attemptId
    if (!currentAttemptId) {
      throw new Error('Unable to identify the exam attempt.')
    }

    // Bulk save all answers before submitting
    await bulkSaveAllAnswers()

    await submitStudentAttempt(currentAttemptId)
    
    // Try to fetch the result after submission
    try {
      const result = await getAttemptResult(currentAttemptId)
      const score = result?.score || result?.result?.score || result?.total_score

      uiStore.addToast({
        title: 'Exam submitted',
        message: score != null ? `Your exam has been submitted. Score: ${score}` : 'Your exam has been submitted successfully.',
        variant: 'success',
      })
      
      // Store result in localStorage or route to results page if needed
      if (result) {
        localStorage.setItem(`exam_result_${currentAttemptId}`, JSON.stringify(result))
      }
    } catch (e) {
      // If result fetch fails, still show success message
      uiStore.addToast({
        title: 'Exam submitted',
        message: 'Your exam has been submitted successfully.',
        variant: 'success',
      })
    }
    
    router.push({ name: 'StudentDashboard' })
  } catch (error) {
    uiStore.addToast({
      title: 'Submission failed',
      message: error.message || 'Could not submit your exam.',
      variant: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
</style>
