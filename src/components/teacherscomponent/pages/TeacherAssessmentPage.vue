<template>
  <div class="space-y-6">
    <AppPageHeader
      :title="assessment?.title || 'Assessment Workspace'"
      :subtitle="assessment?.description || 'Build your paper for this assessment.'"
      eyebrow="Submissions"
    >
      <template #actions>
        <AppButton text="All submissions" variant="outline" size="sm" :icon="ArrowLeft" @click="router.push('/teachers/assessments')" />
      </template>
    </AppPageHeader>

    <div v-if="assessment" class="-mt-2 mb-1 flex flex-wrap items-center gap-2">
      <SubmissionCountdown v-if="deadline" :deadline="deadline" @expired="deadlinePassed = true" />
      <AppBadge v-if="submission" :label="getSubmissionStatusLabel(submissionStatus)" :variant="getSubmissionStatusVariant(submissionStatus)" dot />
      <AppBadge :label="classText" variant="default" />
    </div>

    <div v-if="loadingSubmission && !assessment" class="space-y-6">
      <div class="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>

    <template v-else-if="assessment">
      <p v-if="deadlinePassed" class="rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-800">
        The submission window closed on {{ formatDate(deadline) }}. Your paper is now read-only.
      </p>
      <p v-else-if="banner" class="rounded-2xl px-5 py-4 text-sm" :class="banner.tone">{{ banner.text }}</p>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="space-y-6">
          <!-- Step 1: create paper -->
          <section v-if="!submission" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Step 1</p>
            <h2 class="text-3xl font-light leading-tight tracking-tight text-[#0B1F3A]">Start your paper</h2>
            <p class="mt-2 max-w-lg text-sm text-slate-500">
              Name the paper and pick the subject it covers. You can add questions from your bank straight after.
            </p>

            <div class="mt-6 max-w-lg space-y-4">
              <AppSelect v-model="form.subjectId" label="Subject" :options="subjectOptions" placeholder="Select subject" required :error="errors.subjectId" @blur="touch('subjectId')" />
              <AppInput v-model="form.title" label="Paper title" placeholder="e.g. Mathematics — First Term" required :error="errors.title" @blur="touch('title')" />
              <AppTextarea v-model="form.description" label="Short description" placeholder="e.g. Covers algebra chapters 1–4" :rows="2" />
              <AppButton text="Create paper" variant="primary" :disabled="deadlinePassed" :processing="creating" @click="createSubmission" />
            </div>
          </section>

          <!-- Question builder -->
          <section v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-slate-900">{{ submission.title }}</h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ submissionSubjectName }} · {{ questionCount }} {{ questionCount === 1 ? 'question' : 'questions' }}
                  <template v-if="submission.description"> · {{ submission.description }}</template>
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <AppButton
                  text="Add from bank"
                  variant="outline"
                  size="sm"
                  :icon="Plus"
                  :disabled="!canAddQuestion"
                  :title="!canAddQuestion && editable ? `Marks cap (${assessmentCap}) reached` : null"
                  @click="openQuestionBankModal"
                />
                <AppButton
                  text="Submit for review"
                  variant="success"
                  size="sm"
                  :icon="Send"
                  :disabled="!canSubmitForReview"
                  :processing="submitting"
                  @click="submitForReview"
                />
              </div>
            </div>

            <AppEmptyState
              v-if="!questions.length"
              :icon="FileQuestion"
              title="No questions yet"
              description="Add your first question from the bank to get started."
            >
              <template #actions>
                <AppButton text="Add from bank" variant="primary" :icon="Plus" :disabled="!editable" @click="openQuestionBankModal" />
              </template>
            </AppEmptyState>

            <div v-else class="space-y-4 p-5 sm:p-6">
              <div v-for="(question, index) in questions" :key="question.id ?? index" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900">Question {{ question.order ?? index + 1 }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ questionTypeLabel(question.type) }} · {{ question.marks }} marks</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <AppButton text="Edit" variant="outline" size="xs" :disabled="!editable" @click="editQuestion(question)" />
                    <AppButton :icon="Trash2" variant="ghost" size="xs" :disabled="!editable" aria-label="Delete question" @click="removeQuestion(question.id)" />
                  </div>
                </div>
                <p class="mt-3 text-sm text-slate-700">{{ question.content }}</p>
                <img v-if="question.image_url" :src="question.image_url" alt="Question image" class="mt-3 max-h-32 rounded-xl border border-slate-200 object-contain" />
                <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="option.id ?? optIndex"
                    class="rounded-2xl px-3 py-2 text-sm"
                    :class="option.is_correct ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700'"
                  >
                    <span v-if="option.label" class="font-semibold">{{ option.label }}.</span> {{ option.content }}
                  </div>
                </div>
                <p v-if="question.explanation" class="mt-3 text-xs text-slate-500">
                  <span class="font-semibold text-slate-700">Explanation:</span> {{ question.explanation }}
                </p>
              </div>
            </div>
          </section>

          <!-- Admin feedback -->
          <section v-if="submission && comments.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Admin feedback</p>
            <ul class="space-y-3">
              <li v-for="comment in comments" :key="comment.id" class="rounded-xl bg-slate-50/70 p-4">
                <p class="text-xs font-semibold text-slate-900">{{ comment.author || 'School admin' }}</p>
                <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ comment.text ?? comment.body ?? comment.comment }}</p>
                <p class="mt-1.5 text-[11px] text-slate-400">{{ formatDate(comment.createdAt ?? comment.created_at) }}</p>
              </li>
            </ul>
          </section>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Marks allocation</p>
            <p class="text-5xl font-light leading-none text-[#0B1F3A]">
              {{ marksUsed }}<span class="text-2xl text-slate-400">/{{ assessmentCap }}</span>
            </p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-[#0B1F3A] transition-[width] duration-300" :style="{ width: `${completionPercent}%` }" />
            </div>
            <p class="mt-2 text-xs text-slate-400">{{ completionText }}</p>

            <dl class="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Questions</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ questionCount }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Term</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ termText }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Window closes</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ formatDate(deadline) }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="scheduleSubjects.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Exam day slots</p>
            <ul class="space-y-2.5">
              <li v-for="slot in scheduleSubjects" :key="slot.id" class="flex items-baseline justify-between gap-3 text-sm">
                <span class="font-medium text-slate-900">{{ slotSubjectName(slot) }}</span>
                <span class="text-xs text-slate-400">{{ formatDate(slot.starts_at) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>

    <AppEmptyState
      v-else
      :icon="Inbox"
      title="Assessment not found"
      description="This assessment is no longer available to you."
    >
      <template #actions>
        <AppButton text="Back to submissions" variant="outline" @click="router.push('/teachers/assessments')" />
      </template>
    </AppEmptyState>

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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, FileQuestion, Inbox, Plus, Send, Trash2 } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import QuestionModal from '../components/QuestionModal.vue'
import QuestionBankModal from '../components/QuestionBankModal.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import {
  useAssessmentsStore,
  getSubmissionStatusLabel,
  getSubmissionStatusVariant,
} from '../../schooladmincomponents/stores/assessments'

const route = useRoute()
const router = useRouter()
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
const scheduleSubjects = computed(() => store.scheduleSubjects)
// The backend doesn't document a `comments` relation on Submission — the
// request-changes comment is delivered to the teacher via notification, not
// stored as a thread. Render defensively in case the backend adds one later.
const comments = computed(() => (Array.isArray(submission.value?.comments) ? submission.value.comments : []))

const submissionStatus = computed(() => (submission.value?.status || 'draft').toLowerCase())
const deadline = computed(() => assessment.value?.question_submission_ends || null)

const BANNERS = {
  changes_requested: { tone: 'bg-amber-50 text-amber-800', text: 'Changes were requested on this paper. Update it and submit again before the window closes.' },
  submitted: { tone: 'bg-sky-50 text-sky-800', text: 'Your paper is awaiting review by the school admin. Editing is locked until they respond.' },
  approved: { tone: 'bg-emerald-50 text-emerald-800', text: 'This paper has been approved. Once the assessment is activated it becomes a live exam automatically.' },
}
const banner = computed(() => (submission.value ? BANNERS[submissionStatus.value] : undefined))

// Editing is allowed while the question window is open and the submission is
// either a fresh draft or has been sent back for changes. `changes_requested`
// naturally re-enables the builder; `submitted`/`approved` lock it.
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
  if (assessment.value?.schedule_id) await store.fetchScheduleSubjects(assessmentId).catch(() => {})
  if (deadline.value && new Date(deadline.value).getTime() <= Date.now()) {
    deadlinePassed.value = true
  }
})

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
const slotSubjectName = (slot) => {
  if (slot.subject?.name) return slot.subject.name
  const id = slot.subject_id ?? slot.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(id))?.label || 'Subject'
}

// total_marks is server-derived from the sum of question marks — prefer the
// server value, fall back to a client sum only if absent.
const marksUsed = computed(() => {
  const serverTotal = submission.value?.total_marks ?? submission.value?.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  return questions.value.reduce((sum, q) => sum + Number(q.marks || 0), 0)
})
const remainingMarks = computed(() => Math.max(0, assessmentCap.value - marksUsed.value))
const completionPercent = computed(() => {
  if (!assessmentCap.value) return 0
  return Math.min(100, Math.round((marksUsed.value / assessmentCap.value) * 100))
})
const completionText = computed(() => {
  const cap = assessmentCap.value
  if (!cap || cap === 0) return 'No marks cap set'
  if (marksUsed.value >= cap) return 'Marks cap reached'
  return `${remainingMarks.value} marks remaining · ${completionPercent.value}% complete`
})

const questionTypeLabel = (type) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'fill_in_blank': return 'Fill in the Blank'
    default: return type || 'Unknown'
  }
}
const formatDate = (value) => (value ? fmtDateTime(value) : 'N/A')

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
    // Store surfaces the error toast (e.g. duplicate teacher/subject/assessment).
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
      // questions — there's no PATCH endpoint. "Edit" is implemented as
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
    // Store surfaces the error toast (e.g. marks exceed assessment cap).
  } finally {
    submitting.value = false
  }
}
</script>
