<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Submission Detail"
      subtitle="Review the teacher assessment submission and the questions created for it."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="Back to submissions" variant="outline" size="sm" @click="router.push(`/school-admin/assessments/${assessmentId}/submissions`)" />
      </template>
    </AppPageHeader>

    <div v-if="store.loading && !submission?.id" class="grid gap-6 xl:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-52 animate-pulse rounded-2xl bg-slate-100" />
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-3">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Teacher Information</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Name:</span> {{ teacherName }}</div>
          <div><span class="font-semibold text-slate-900">Subject:</span> {{ subjectName }}</div>
          <div><span class="font-semibold text-slate-900">Submission:</span> {{ formatDate(submission.submitted_at) }}</div>
          <div><span class="font-semibold text-slate-900">Status:</span> <AppBadge :label="getSubmissionStatusLabel(submission.status)" :variant="getSubmissionStatusVariant(submission.status)" /></div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Assessment Information</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Title:</span> {{ assessment?.title }}</div>
          <div><span class="font-semibold text-slate-900">Class:</span> {{ classText }}</div>
          <div><span class="font-semibold text-slate-900">Total Marks:</span> {{ assessmentTotalMarks }}</div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
        <h2 class="text-sm font-semibold text-slate-900">Question Summary</h2>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <div><span class="font-semibold text-slate-900">Total Questions:</span> {{ questionCount }}</div>
          <div><span class="font-semibold text-slate-900">Marks Used:</span> {{ marksUsed }}</div>
          <div><span class="font-semibold text-slate-900">Remaining:</span> {{ remainingMarks }}</div>
          <div><span class="font-semibold text-slate-900">Completion:</span> {{ completionPercent }}%</div>
          <p class="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{{ completionText }}</p>
        </div>
      </section>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-900">Review</h2>
        <p class="text-sm text-slate-500">Send the submission back for changes, or approve it.</p>
      </div>

      <div v-if="isApproved" class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        This submission has been approved. Once the parent assessment is activated, it will automatically become a
        live exam for students — no further action is needed here.
      </div>

      <div v-else class="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <label class="text-sm font-semibold text-slate-700" for="review-comment">Comment</label>
        <textarea
          id="review-comment"
          v-model="commentText"
          rows="4"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 focus:border-[#0B1F3A]"
          placeholder="Explain what needs to change before requesting changes…"
        />
        <p v-if="commentError" class="mt-1 text-xs text-rose-600">{{ commentError }}</p>
        <div class="mt-3 flex flex-wrap justify-end gap-2">
          <AppButton
            text="Request Changes & Send Back"
            variant="danger"
            size="sm"
            :processing="requesting"
            @click="onRequestChanges"
          />
          <AppButton
            text="Approve"
            variant="success"
            size="sm"
            :processing="approving"
            @click="onApprove"
          />
        </div>
      </div>

      <div v-if="comments.length" class="mt-4 space-y-3">
        <div v-for="comment in comments" :key="comment.id" class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p class="text-sm text-slate-700">{{ comment.text ?? comment.body ?? comment.comment }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ formatDate(comment.createdAt ?? comment.created_at) }}</p>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">No comments yet.</p>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Questions</h2>
      <div v-if="store.loading && !questions.length" class="mt-4 space-y-4">
        <div v-for="i in 3" :key="i" class="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div v-else-if="!questions.length" class="mt-4 text-sm text-slate-500">No questions have been added to this submission.</div>
      <div v-else class="mt-4 space-y-4">
        <div
          v-for="(question, index) in questions"
          :key="question.id ?? index"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-semibold text-slate-900">Question {{ question.order ?? index + 1 }} • {{ questionTypeLabel(question.type) }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ question.content }}</p>
              <img
                v-if="question.image_url"
                :src="question.image_url"
                alt="Question image"
                class="mt-3 max-h-40 rounded-xl border border-slate-200 object-contain"
              />
            </div>
            <div class="text-right text-sm text-slate-600">
              <span class="font-semibold text-slate-900">Marks:</span> {{ question.marks }}
            </div>
          </div>

          <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
            <div
              v-for="(option, optIndex) in question.options"
              :key="option.id ?? optIndex"
              class="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm"
              :class="option.is_correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-white text-slate-700'"
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
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
// request-changes `comment` is delivered to the teacher via notification
// (§6), not stored as a thread. Render defensively in case the backend adds
// one later, but don't assume the shape.
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

const assessmentTotalMarks = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? 0)
// Submission total_marks is server-derived from the sum of question marks
// (§3) — prefer it when present, and only fall back to a client-side sum
// when the field hasn't been returned on this response.
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
  marksUsed.value >= assessmentTotalMarks.value && assessmentTotalMarks.value > 0
    ? 'Assessment Complete'
    : `Remaining Marks: ${remainingMarks.value}`
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
