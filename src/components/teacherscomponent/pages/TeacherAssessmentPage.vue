<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Workspace"
      subtitle="Create your submission and manage questions for this assessment."
      eyebrow="Submissions"
    />

    <div v-if="loadingSubmission && !assessment" class="space-y-6">
      <div class="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>

    <template v-else>
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Assessment</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ assessment?.title }}</p>
            <p v-if="assessment?.instructions" class="mt-1 text-sm text-slate-500">{{ assessment.instructions }}</p>
            <div v-if="deadline" class="mt-4">
              <SubmissionCountdown :deadline="deadline" @expired="deadlinePassed = true" />
            </div>
          </div>
          <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <div class="flex items-center justify-between"><span>Submission status</span><AppBadge :label="getSubmissionStatusLabel(submissionStatus)" :variant="getSubmissionStatusVariant(submissionStatus)" /></div>
            <div class="flex items-center justify-between"><span>Marks Cap</span><span>{{ assessmentTotalMarks }}</span></div>
            <div class="flex items-center justify-between"><span>Class</span><span>{{ classText }}</span></div>
            <div class="flex items-center justify-between"><span>Term</span><span>{{ termText }}</span></div>
          </div>
        </div>

        <div v-if="deadlinePassed" class="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          The submission window has closed. You can no longer edit or submit this assessment.
        </div>
        <div v-else-if="submissionStatus === 'changes_requested'" class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Changes were requested. Update your questions and submit for review again.
        </div>
        <div v-else-if="submissionStatus === 'submitted'" class="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Your submission is awaiting review. Editing is locked until the reviewer responds.
        </div>
        <div v-else-if="submissionStatus === 'approved'" class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          This submission has been approved. Once the assessment is activated it becomes a live exam automatically.
        </div>
      </section>

    <!-- Create submission -->
    <section v-if="!loadingSubmission && !submission" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid gap-4 lg:grid-cols-2 flex-1">
          <AppSelect v-model="form.subjectId" label="Subject" :options="subjectOptions" placeholder="Choose subject" required :error="errors.subjectId" @blur="touch('subjectId')" />
          <AppInput v-model="form.title" label="Paper Title" placeholder="e.g. Mathematics — First Term" required :error="errors.title" @blur="touch('title')" />
        </div>
        <AppButton text="Create Submission" variant="primary" size="sm" :disabled="deadlinePassed" :processing="creating" @click="createSubmission" />
      </div>
      <div class="mt-4">
        <AppTextarea v-model="form.description" label="Short Description (optional)" placeholder="e.g. Covers algebra chapters 1-4" :rows="2" />
      </div>
    </section>

    <!-- Question builder -->
    <section v-else-if="submission" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="rounded-2xl bg-slate-50 p-5">
        <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Submission</p>
        <p class="mt-1 text-base font-semibold text-slate-900">{{ submission.title }} — {{ submissionSubjectName }}</p>
        <p v-if="submission.description" class="mt-1 text-sm text-slate-500">{{ submission.description }}</p>
      </div>

      <div class="mt-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Question Builder</p>
            <p class="mt-1 text-sm text-slate-500">Manage the questions within this submission.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              text="Add Question from Bank"
              variant="primary"
              size="sm"
              :disabled="!canAddQuestion"
              :title="!canAddQuestion ? `Marks cap (${assessmentCap}) reached` : null"
              @click="openQuestionBankModal"
            />
            <AppButton
              text="Submit for Review"
              variant="success"
              size="sm"
              :disabled="!canSubmitForReview"
              :processing="submitting"
              @click="submitForReview"
            />
          </div>
        </div>

        <div class="mt-4 grid gap-4">
          <div v-for="(question, index) in questions" :key="question.id ?? index" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">Question {{ question.order ?? index + 1 }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ questionTypeLabel(question.type) }} • {{ question.marks }} marks</p>
              </div>
              <div class="flex items-center gap-2">
                <AppButton text="Edit" variant="outline" size="xs" :disabled="!editable" @click="editQuestion(question)" />
                <AppButton text="Delete" variant="danger" size="xs" :disabled="!editable" @click="removeQuestion(question.id)" />
              </div>
            </div>
            <p class="mt-3 text-sm text-slate-700">{{ question.content }}</p>
            <img
              v-if="question.image_url"
              :src="question.image_url"
              alt="Question image"
              class="mt-3 max-h-32 rounded-xl border border-slate-200 object-contain"
            />
            <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
              <div
                v-for="(option, optIndex) in question.options"
                :key="option.id ?? optIndex"
                class="rounded-2xl px-3 py-2 text-sm"
                :class="option.is_correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-700'"
              >
                <span v-if="option.label" class="font-semibold">{{ option.label }}.</span> {{ option.content }}
              </div>
            </div>
            <p v-if="question.explanation" class="mt-3 text-xs text-slate-500">
              <span class="font-semibold text-slate-700">Explanation:</span> {{ question.explanation }}
            </p>
          </div>
          <p v-if="!questions.length" class="text-sm text-slate-500">No questions yet. Add your first question to get started.</p>
        </div>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Total Questions</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ questionCount }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Marks Used</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ marksUsed }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Remaining Marks</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ remainingMarks }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 text-sm">
              <p class="text-slate-500">Completion</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ completionPercent }}%</p>
            </div>
          </div>

          <div class="mt-4 h-2 rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-[#0B1F3A]" :style="`width: ${completionPercent}%`" />
          </div>

          <p class="mt-3 text-sm text-slate-500">{{ completionText }}</p>
        </section>
      </div>
    </section>

    <QuestionModal
      v-if="showQuestionModal"
      :show="showQuestionModal"
      :question="activeQuestion"
      :saving="savingQuestion"
      @close="closeQuestionModal"
      @submit="saveQuestion"
    />

    <QuestionBankModal
      v-if="showQuestionBankModal"
      :show="showQuestionBankModal"
      :subject-id="submission?.subject_id ?? submission?.subjectId"
      :subject-label="submissionSubjectName"
      :class-level-id="assessment?.class_level_id ?? assessment?.classLevelId"
      :remaining-marks="remainingMarks"
      :saving="addingSelectedQuestions"
      @close="showQuestionBankModal = false"
      @submit="addSelectedBankQuestions"
    />
    </template>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import QuestionModal from '../components/QuestionModal.vue'
import QuestionBankModal from '../components/QuestionBankModal.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import {
  useAssessmentsStore,
  getSubmissionStatusLabel,
  getSubmissionStatusVariant,
} from '../../schooladmincomponents/stores/assessments'

const route = useRoute()
const store = useAssessmentsStore()
const assessmentId = route.params.id

const form = reactive({ subjectId: '', title: '', description: '' })
const errors = reactive({ subjectId: '', title: '' })
const showQuestionModal = ref(false)
const showQuestionBankModal = ref(false)
const activeQuestion = ref(null)
const deadlinePassed = ref(false)
const creating = ref(false)
const submitting = ref(false)
const savingQuestion = ref(false)
const addingSelectedQuestions = ref(false)
const loadingSubmission = ref(true)

const assessment = computed(() => store.current)
const submission = computed(() => store.currentSubmission)
const questions = computed(() => submission.value?.questions ?? submission.value?.submissionQuestions ?? [])
const questionCount = computed(() => questions.value.length || submission.value?.question_count || 0)
const subjectOptions = computed(() => store.subjectOptions)

const submissionStatus = computed(() => (submission.value?.status || 'draft').toLowerCase())
const deadline = computed(() => assessment.value?.question_submission_ends || null)

// Editing is allowed while the question window is open and the submission is
// either a fresh draft or has been sent back for changes. `changes_requested`
// naturally re-enables the builder; `submitted`/`approved` lock it (§4).
const editable = computed(() =>
  !deadlinePassed.value &&
  (assessment.value?.question_submission_status ?? 'open') === 'open' &&
  ['draft', 'changes_requested'].includes(submissionStatus.value)
)
const assessmentCap = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? 0)
const canAddQuestion = computed(() => editable.value && marksUsed.value < assessmentCap.value)
const canSubmitForReview = computed(() => editable.value && questionCount.value > 0)

onMounted(async () => {
  await Promise.all([store.fetchRefData(), store.fetchAssessment(assessmentId)])
  loadingSubmission.value = true
  await store.fetchMySubmission(assessmentId)
  loadingSubmission.value = false
  if (deadline.value && new Date(deadline.value).getTime() <= Date.now()) {
    deadlinePassed.value = true
  }
})

const assessmentTotalMarks = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? 0)
const classText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  const nestedLevel = a.classLevel?.name || a.class_level?.name || ''
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = nestedLevel || store.classLevelOptions.find((o) => String(o.value) === String(levelId))?.label || ''
  const arm = armId ? ` ${store.classArmOptions.find((o) => String(o.value) === String(armId))?.label || ''}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
})
const termText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  return a.term?.name || a.term_name || a.term?.title || '—'
})
const submissionSubjectName = computed(() => {
  const s = submission.value
  if (!s) return ''
  if (s.subject?.name) return s.subject.name
  const subjectId = s.subject_id ?? s.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(subjectId))?.label || 'Submission'
})

// total_marks is server-derived from the sum of question marks (§3) —
// prefer the server value, fall back to a client sum only if absent.
const marksUsed = computed(() => {
  const serverTotal = submission.value?.total_marks ?? submission.value?.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  return questions.value.reduce((sum, q) => sum + Number(q.marks || 0), 0)
})
const remainingMarks = computed(() => Math.max(0, assessmentTotalMarks.value - marksUsed.value))
const completionPercent = computed(() => {
  if (!assessmentTotalMarks.value) return 0
  return Math.min(100, Math.round((marksUsed.value / assessmentTotalMarks.value) * 100))
})
const completionText = computed(() => {
  const cap = assessmentTotalMarks.value
  if (!cap || cap === 0) return 'No marks cap set'
  if (marksUsed.value >= cap) return 'Marks cap reached'
  return `${remainingMarks.value} marks remaining`
})

const questionTypeLabel = (type) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'fill_in_blank': return 'Fill in the Blank'
    default: return type || 'Unknown'
  }
}

const touch = (field) => {
  if (field === 'subjectId') errors.subjectId = form.subjectId ? '' : 'Subject is required.'
  if (field === 'title') errors.title = form.title.trim() ? '' : 'Title is required.'
}

const createSubmission = async () => {
  touch('subjectId')
  touch('title')
  if (errors.subjectId || errors.title) return
  creating.value = true
  try {
    await store.createSubmission(assessmentId, {
      subject_id: form.subjectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
    })
    form.subjectId = ''
    form.title = ''
    form.description = ''
  } catch {
    // Store surfaces the error toast (e.g. duplicate teacher/subject/assessment — §3).
  } finally {
    creating.value = false
  }
}

const openQuestionBankModal = () => {
  showQuestionBankModal.value = true
}
const closeQuestionModal = () => {
  showQuestionModal.value = false
  activeQuestion.value = null
  savingQuestion.value = false
}
const addSelectedBankQuestions = async (chosen) => {
  if (!submission.value || !chosen?.length) return

  addingSelectedQuestions.value = true
  try {
    const payloads = chosen.map(({ question, marks }) => {
      const payload = {
        type: question.type,
        content: question.content || '',
        marks,
        explanation: question.explanation || null,
        image_url: question.image_url || null,
      }
      if (question.type !== 'fill_in_blank' && Array.isArray(question.options) && question.options.length) {
        payload.options = question.options.map((option, index) => ({
          content: option.content || '',
          is_correct: !!option.is_correct,
          label: option.label || null,
          image_url: option.image_url || null,
          order: index + 1,
        }))
      }
      return payload
    })

    await store.addQuestions(submission.value.id, payloads)
    showQuestionBankModal.value = false
  } catch (error) {
    // 422 means cap was exceeded — store already showed the error toast.
    // Keep modal open if it's a cap error so they can adjust, close otherwise.
    if (error?.status !== 422) {
      showQuestionBankModal.value = false
    }
  } finally {
    addingSelectedQuestions.value = false
  }
}
const saveQuestion = async (question) => {
  if (!submission.value) return
  const payload = {
    type: question.type,
    content: question.content,
    marks: question.marks,
    explanation: question.explanation,
    image_url: question.image_url,
    ...(question.type !== 'fill_in_blank' ? { options: question.options } : {}),
  }
  savingQuestion.value = true
  try {
    if (question.id) {
      // The backend only documents POST (create) and DELETE for submission
      // questions (§7) — there's no PATCH endpoint. "Edit" is implemented as
      // delete-then-recreate so it still only calls documented endpoints.
      await store.deleteQuestion(submission.value.id, question.id)
      await store.addQuestion(submission.value.id, payload)
    } else {
      await store.addQuestion(submission.value.id, payload)
    }
    closeQuestionModal()
  } catch {
    // Store surfaces the error toast; keep the modal open for retry.
    savingQuestion.value = false
  }
}
const editQuestion = (question) => {
  activeQuestion.value = { ...question }
  showQuestionModal.value = true
}
const removeQuestion = async (questionId) => {
  if (!window.confirm('Delete this question?')) return
  await store.deleteQuestion(submission.value.id, questionId).catch(() => {})
}

const submitForReview = async () => {
  if (!submission.value) return
  submitting.value = true
  try {
    await store.submitForReview(submission.value.id)
  } catch {
    // Store surfaces the error toast (e.g. marks exceed assessment cap — §4).
  } finally {
    submitting.value = false
  }
}
</script>
