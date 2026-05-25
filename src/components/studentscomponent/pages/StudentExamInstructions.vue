<template>
  <div class="max-w-4xl mx-auto">
    <SectionCard title="Exam Instructions" subtitle="Please read carefully before beginning.">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500">Candidate ID: {{ candidateId }}</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-900">{{ exam.title || 'Exam' }}</h2>
        </div>
        <div class="text-sm text-slate-500">Duration: {{ exam.duration }} minutes</div>
      </div>

      <div class="mt-6 space-y-6">
        <!-- General Instructions -->
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 p-2">
              <Info class="h-5 w-5 text-blue-600" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900">General Instructions</h3>
          </div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li>The examination contains {{ exam.questions?.length || 50 }} multiple-choice questions.</li>
            <li>Each question carries 1 mark. There is no negative marking.</li>
            <li>Total duration of the examination is {{ exam.duration }} minutes.</li>
            <li>The timer will start as soon as you begin the exam.</li>
            <li>You can navigate between questions using the question palette.</li>
          </ul>
        </div>

        <!-- Question Navigation -->
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-emerald-100 p-2">
              <Navigation class="h-5 w-5 text-emerald-600" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900">Question Navigation</h3>
          </div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li>Click on a question number to navigate to that question.</li>
            <li>You can mark questions for review and come back to them later.</li>
            <li>Answered questions will be highlighted in green.</li>
            <li>Questions marked for review will be highlighted in yellow.</li>
            <li>Unanswered questions will remain white.</li>
          </ul>
        </div>

        <!-- Important Notes -->
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-amber-100 p-2">
              <AlertTriangle class="h-5 w-5 text-amber-600" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900">Important Notes</h3>
          </div>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li>Once submitted, you cannot change your answers.</li>
            <li>The exam will auto-submit when the time expires.</li>
            <li>Ensure stable internet connection throughout the exam.</li>
            <li>Do not refresh the browser during the exam.</li>
            <li>Do not use the browser back button.</li>
          </ul>
        </div>
      </div>

      <div class="mt-6">
        <label class="flex items-center gap-3">
          <input type="checkbox" v-model="agreed" class="h-4 w-4" />
          <span>I have read and understood all the instructions. I am ready to begin the examination.</span>
        </label>
      </div>

      <div v-if="!canBegin && !loading" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ disabledMessage }}
      </div>

      <div class="mt-6 flex justify-end">
        <AppButton
          :disabled="!canBegin || !agreed || isStarting || loading"
          :loadingText="isStarting ? 'Starting exam...' : null"
          :processing="isStarting"
          text="Begin Exam"
          variant="primary"
          @click="beginExam"
        />
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Info, Navigation, AlertTriangle } from 'lucide-vue-next'
import SectionCard from '../../schooladmincomponents/components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser } from '../../../js/lib/auth'
import { getStudentExam, startStudentExam } from '../services/api/studentExams'
import { mockStudentExams } from '../data/mockStudentExams'

const route = useRoute()
const router = useRouter()
const uiStore = useSchoolAdminUiStore()
const examId = route.params.id
const exam = ref({})
const candidateId = ref('Candidate')
const agreed = ref(false)
const loading = ref(true)
const isStarting = ref(false)
const usingFallback = ref(false)

const loadExam = async () => {
  loading.value = true
  try {
    exam.value = await getStudentExam(examId)
    const user = getAuthUser()
    candidateId.value = user?.admissionNo || user?.admission_number || user?.identifier || user?.id || 'Candidate'
    usingFallback.value = false
  } catch (error) {
    uiStore.addToast({ title: 'Exam unavailable', message: 'Unable to load exam details.', variant: 'error' })
    exam.value = mockStudentExams.find((e) => String(e.id) === String(examId)) || {}
    candidateId.value = 'Candidate'
    usingFallback.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadExam)

const renderedInstructions = computed(() => {
  const text = exam.value.instructions || 'No specific instructions provided. Follow the standard exam rules.'
  return text.replace(/\n/g, '<br/>')
})

const canBegin = computed(() => {
  const hasAttempts = exam.value.remaining_attempts == null || exam.value.remaining_attempts > 0
  return exam.value.status === 'Live' && hasAttempts
})

const disabledMessage = computed(() => {
  if (exam.value.status !== 'Live') {
    return 'This exam is not active yet. Please return when it is live.'
  }
  if (exam.value.remaining_attempts === 0) {
    return 'You have no remaining attempts for this exam.'
  }
  return ''
})

const beginExam = async () => {
  if (!canBegin.value || isStarting.value) return
  isStarting.value = true
  try {
    const response = await startStudentExam(examId)
    const attemptId = response?.attempt?.id || response?.attempt_id || response?.attempt?.attempt_id
    if (!attemptId) {
      throw new Error('Exam attempt could not be started.')
    }

    router.push({ name: 'StudentExam', params: { id: examId }, query: { attemptId } })
  } catch (error) {
    uiStore.addToast({
      title: 'Unable to begin exam',
      message: error.message || 'Failed to start the exam attempt.',
      variant: 'error',
    })
  } finally {
    isStarting.value = false
  }
}
</script>

<style scoped>
.prose p { margin: 0 0 0.6rem 0; }
</style>
