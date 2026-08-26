<template>
  <div class="space-y-4">
    <AppPageHeader
      title="Submission Detail"
      :subtitle="submission?.description || (submission?.id ? 'No description provided by the teacher.' : 'Review the teacher submission and the questions created for it.')"
      eyebrow="Submission Review"
    >
      <template #actions>
        <AppButton text="All papers" variant="outline" size="sm" :icon="ArrowLeft" @click="router.push(`/school-admin/assessments/${assessmentId}/submissions`)" />
      </template>
    </AppPageHeader>

    <div v-if="submission?.id" class="-mt-2 mb-1 flex flex-wrap items-center gap-2">
      <AppBadge :label="getSubmissionStatusLabel(submission.status)" :variant="getSubmissionStatusVariant(submission.status)" dot />
      <AppBadge :label="assessment?.title || '—'" variant="default" />
    </div>

    <div v-if="store.loading && !submission?.id" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      <div class="space-y-6">
        <div class="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <!-- Questions -->
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 class="text-sm font-semibold text-slate-900">
            Questions
            <span class="ml-2 font-normal text-slate-400">{{ questionCount }} total</span>
          </h2>
          <span class="text-xs text-slate-400">{{ marksUsed }} of {{ assessmentTotalMarks }} marks used</span>
        </div>

        <AppEmptyState
          v-if="!questions.length"
          :icon="FileQuestion"
          title="No questions in this paper"
          description="The teacher has not added any questions yet."
        />

        <div v-else class="space-y-4 p-5 sm:p-6">
          <div
            v-for="(question, index) in questions"
            :key="question.id ?? index"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-900">Question {{ question.order ?? index + 1 }} · {{ questionTypeLabel(question.type) }}</p>
                <p class="mt-2 text-sm text-slate-700">{{ question.content }}</p>
                <img v-if="question.image_url" :src="question.image_url" alt="Question image" class="mt-3 max-h-40 rounded-xl border border-slate-200 object-contain" />
              </div>
              <div class="shrink-0 text-right text-sm text-slate-600">
                <span class="font-semibold text-slate-900">Marks:</span> {{ question.marks }}
              </div>
            </div>

            <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
              <div
                v-for="(option, optIndex) in question.options"
                :key="option.id ?? optIndex"
                class="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm"
                :class="option.is_correct ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700'"
              >
                <span v-if="option.label" class="font-semibold">{{ option.label }}.</span>
                <span>{{ option.content }}</span>
                <span v-if="option.is_correct" class="ml-auto text-xs font-semibold uppercase tracking-wide text-emerald-600">Correct</span>
              </div>
            </div>
            <p v-else-if="question.type !== 'fill_in_blank'" class="mt-4 text-xs text-slate-400">No options recorded.</p>

            <div v-if="question.explanation" class="mt-4">
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Explanation</p>
              <p class="mt-1 text-sm text-slate-700">{{ question.explanation }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Sidebar -->
      <div class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Paper summary</p>
          <dl class="space-y-3">
            <div v-for="fact in facts" :key="fact.label" class="flex items-baseline justify-between gap-4">
              <dt class="text-xs text-slate-400">{{ fact.label }}</dt>
              <dd class="text-right text-sm font-medium text-slate-900">{{ fact.value }}</dd>
            </div>
          </dl>
          <div class="mt-5 border-t border-slate-100 pt-4">
            <div class="flex items-baseline justify-between">
              <p class="text-xs text-slate-400">Marks coverage</p>
              <p class="text-3xl font-light leading-none text-slate-900">{{ completionPercent }}%</p>
            </div>
            <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-[#0B1F3A] transition-[width] duration-300" :style="{ width: `${completionPercent}%` }" />
            </div>
            <p class="mt-2 text-xs text-slate-400">{{ completionText }}</p>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Review</p>

          <div v-if="isApproved" class="rounded-xl bg-emerald-50 p-4">
            <p class="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 class="h-4 w-4" /> Approved
            </p>
            <p class="mt-1.5 text-xs leading-relaxed text-emerald-700">
              Once the parent assessment is activated this paper becomes a live exam for students automatically.
            </p>
          </div>

          <div v-else class="space-y-3">
            <AppTextarea
              v-model="commentText"
              label="Comment"
              :rows="4"
              :error="commentError"
              hint="Required when requesting changes."
              placeholder="Explain what needs to change, or leave a note for the record."
            />
            <div class="flex flex-col gap-2">
              <AppButton text="Approve paper" variant="success" full-width :processing="approving" @click="onApprove" />
              <AppButton text="Request changes" variant="danger" full-width :processing="requesting" @click="onRequestChanges" />
            </div>
          </div>

          <div class="mt-5 border-t border-slate-100 pt-4">
            <p class="mb-3 text-xs font-semibold text-slate-600">Review history</p>
            <p v-if="!comments.length" class="text-xs text-slate-400">No comments yet.</p>
            <ul v-else class="space-y-3">
              <li v-for="comment in comments" :key="comment.id" class="rounded-xl bg-slate-50/70 p-3">
                <p class="text-xs font-semibold text-slate-900">{{ comment.author || 'School admin' }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ comment.text ?? comment.body ?? comment.comment }}</p>
                <p class="mt-1.5 text-[11px] text-slate-400">{{ formatDate(comment.createdAt ?? comment.created_at) }}</p>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, FileQuestion } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import { useAssessmentsStore, getSubmissionStatusLabel, getSubmissionStatusVariant } from '../stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const assessmentId = route.params.assessmentId
const submissionId = route.params.submissionId

const commentText = ref('')
const commentError = ref('')
const requesting = ref(false)
const approving = ref(false)

const assessment = computed(() => store.current)
const submission = computed(() => store.currentSubmission || { questions: [] })
const questions = computed(() => submission.value?.questions ?? submission.value?.submissionQuestions ?? [])
const questionCount = computed(() => questions.value.length || submission.value?.question_count || 0)
// The backend doesn't document a `comments` relation on Submission — the
// request-changes `comment` is delivered to the teacher via notification,
// not stored as a thread. Render defensively in case the backend adds one
// later, but don't assume the shape.
const comments = computed(() => (Array.isArray(submission.value.comments) ? submission.value.comments : []))
const isApproved = computed(() => (submission.value.status || '').toLowerCase() === 'approved')

onMounted(async () => {
  await Promise.all([
    store.fetchRefData(),
    store.fetchAssessment(assessmentId),
    store.fetchSubmission(submissionId),
  ])
})

const teacherName = computed(() => {
  const t = submission.value.teacher || {}
  const first = t.first_name || t.firstName || ''
  const last = t.last_name || t.lastName || ''
  return `${first} ${last}`.trim() || t.name || 'Unknown teacher'
})
const subjectName = computed(() => {
  if (submission.value.subject?.name) return submission.value.subject.name
  const subjectId = submission.value.subject_id ?? submission.value.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(subjectId))?.label || 'Unknown subject'
})
const classText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = store.classLevelOptions.find((o) => String(o.value) === String(levelId))?.label || ''
  const arm = armId ? ` ${store.classArmOptions.find((o) => String(o.value) === String(armId))?.label || ''}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
})

const facts = computed(() => [
  { label: 'Teacher', value: teacherName.value },
  { label: 'Subject', value: subjectName.value },
  { label: 'Submitted', value: submission.value.submitted_at ? fmtDateTime(submission.value.submitted_at) : 'Not submitted' },
  { label: 'Class', value: classText.value },
])

const assessmentTotalMarks = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? 0)
// Submission total_marks is server-derived from the sum of question marks —
// prefer it when present, only fall back to a client-side sum otherwise.
const marksUsed = computed(() => {
  const serverTotal = submission.value.total_marks ?? submission.value.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  return questions.value.reduce((sum, q) => sum + Number(q.marks || 0), 0)
})
const remainingMarks = computed(() => Math.max(0, assessmentTotalMarks.value - marksUsed.value))
const completionPercent = computed(() => {
  if (!assessmentTotalMarks.value) return 0
  return Math.min(100, Math.round((marksUsed.value / assessmentTotalMarks.value) * 100))
})
const completionText = computed(() =>
  remainingMarks.value === 0 && assessmentTotalMarks.value > 0
    ? 'Full marks allocation used.'
    : `${remainingMarks.value} marks still unallocated.`
)

const questionTypeLabel = (type) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'fill_in_blank': return 'Fill in the Blank'
    default: return type || 'Unknown'
  }
}

const onRequestChanges = async () => {
  if (!commentText.value.trim()) {
    commentError.value = 'A comment is required when requesting changes.'
    return
  }
  commentError.value = ''
  requesting.value = true
  try {
    await store.requestChanges(submissionId, { comment: commentText.value.trim() })
    commentText.value = ''
  } catch {
    // Error toast surfaced by the store.
  } finally {
    requesting.value = false
  }
}

const onApprove = async () => {
  approving.value = true
  try {
    await store.approveSubmission(submissionId)
  } catch {
    // Error toast surfaced by the store.
  } finally {
    approving.value = false
  }
}

const formatDate = (value) => (value ? fmtDateTime(value) : 'N/A')
</script>
