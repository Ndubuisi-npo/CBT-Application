<template>
  <div class="space-y-6">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Exam Approvals</h1>
        <p class="mt-1 text-sm text-slate-500">Review teacher-submitted exams, activate them for students, and publish results.</p>
      </div>
      <AppButton :icon="RefreshCcw" text="Refresh" variant="outline" size="sm" @click="loadSubmittedExams" />
    </div>

    <!-- ── Summary cards ──────────────────────────────────────────────────── -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AppStatCard label="Submitted" :value="submittedCount" :loading="store.loading" :icon="Send" icon-bg="bg-slate-100" icon-color="text-slate-600" sub="Awaiting activation" />
      <AppStatCard label="Active" :value="activeCount" :loading="store.loading" :icon="Zap" icon-bg="bg-emerald-50" icon-color="text-emerald-600" sub="Currently live" />
      <AppStatCard label="Completed" :value="completedCount" :loading="store.loading" :icon="CheckCircle2" icon-bg="bg-blue-50" icon-color="text-blue-600" sub="Awaiting publish" />
      <AppStatCard label="Published" :value="completedPublishedCount" :loading="store.loading" :icon="BookOpen" icon-bg="bg-violet-50" icon-color="text-violet-600" sub="Results visible" />
    </div>

    <!-- ── Submitted & Active exams ───────────────────────────────────────── -->
    <section class="rounded-2xl border border-slate-200 bg-white">
      <div class="border-b border-slate-100 px-6 py-5">
        <h2 class="text-lg font-semibold text-slate-900">Submitted &amp; Active Exams</h2>
        <p class="mt-0.5 text-sm text-slate-500">Exams awaiting activation or currently live for students.</p>
      </div>

      <div class="p-6">
        <div v-if="store.loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="!approvalExams.length" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <ClipboardList class="mx-auto h-8 w-8 text-slate-400" />
          <p class="mt-3 text-sm font-semibold text-slate-700">No exams awaiting action</p>
          <p class="mt-1 text-sm text-slate-500">Submitted exams from teachers will appear here.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="exam in approvalExams"
            :key="exam.id"
            class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:bg-white lg:flex-row lg:items-start lg:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-base font-semibold text-slate-900">{{ exam.title }}</h3>
                <StatusBadge :status="normalizeStatus(exam.status)" />
              </div>
              <p class="mt-1 text-sm text-slate-500">
                {{ exam.subject?.name || exam.subject || '—' }} · {{ exam.classLevel?.name || '—' }} · {{ exam.classArm?.name || '—' }}
              </p>
              <div class="mt-3 flex flex-wrap gap-3">
                <div class="rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-200">
                  <p class="text-slate-400">Expected</p>
                  <p class="mt-0.5 font-semibold text-slate-900">{{ getExpectedAttempts(exam) }}</p>
                </div>
                <div class="rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-200">
                  <p class="text-slate-400">Completed</p>
                  <p class="mt-0.5 font-semibold text-slate-900">{{ getCompletedAttempts(exam) }}</p>
                </div>
                <div class="rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-200">
                  <p class="text-slate-400">Questions</p>
                  <p class="mt-0.5 font-semibold text-slate-900">{{ getQuestionCount(exam) }}</p>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 lg:shrink-0">
              <AppButton v-if="normalizeStatus(exam.status) === 'submitted'" text="Activate" variant="primary" size="sm" :processing="processingId === exam.id" @click="confirmActivate(exam)" />
              <AppButton v-else-if="normalizeStatus(exam.status) === 'active'" text="End Exam" variant="danger" size="sm" :processing="processingId === exam.id" @click="confirmEnd(exam)" />
              <AppButton text="Preview" variant="outline" size="sm" @click="previewExam(exam)" />
              <button v-if="canDeleteExam(exam.status)" class="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50" :disabled="processingId === exam.id" @click="confirmDelete(exam)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Completed / Published ──────────────────────────────────────────── -->
    <section class="rounded-2xl border border-slate-200 bg-white">
      <div class="border-b border-slate-100 px-6 py-5">
        <h2 class="text-lg font-semibold text-slate-900">Completed &amp; Published</h2>
        <p class="mt-0.5 text-sm text-slate-500">Finished exams ready for results publishing.</p>
      </div>

      <div class="p-6">
        <div v-if="store.loading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="!completedPublishedExams.length" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <CheckCircle2 class="mx-auto h-8 w-8 text-slate-400" />
          <p class="mt-3 text-sm font-semibold text-slate-700">No completed exams yet</p>
          <p class="mt-1 text-sm text-slate-500">Completed exams will appear here once finished.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="exam in completedPublishedExams"
            :key="exam.id"
            class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:bg-white lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-base font-semibold text-slate-900">{{ exam.title }}</h3>
                <StatusBadge :status="normalizeStatus(exam.status)" />
              </div>
              <p class="mt-1 text-sm text-slate-500">
                {{ exam.subject?.name || exam.subject || '—' }} · {{ exam.classLevel?.name || '—' }} · {{ exam.classArm?.name || '—' }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 lg:shrink-0">
              <AppButton v-if="normalizeStatus(exam.status) === 'completed'" text="Publish Results" variant="primary" size="sm" :processing="processingId === exam.id" @click="confirmPublish(exam)" />
              <AppButton text="Preview" variant="outline" size="sm" @click="previewExam(exam)" />
              <button v-if="canDeleteExam(exam.status)" class="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50" @click="confirmDelete(exam)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Confirm modal ───────────────────────────────────────────────────── -->
    <ConfirmModal
      v-if="pendingAction"
      :title="pendingAction.title"
      :message="pendingAction.message"
      :confirm-label="pendingAction.confirmLabel"
      :variant="pendingAction.variant"
      @confirm="runAction"
      @cancel="pendingAction = null"
    />

    <ExamPreviewModal v-if="previewExamData" :exam="previewExamData" @close="previewExamData = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { BookOpen, CheckCircle2, ClipboardList, RefreshCcw, Send, Zap } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppStatCard from '../../shared/AppStatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ConfirmModal from '../../teacherscomponent/components/ConfirmModal.vue'
import ExamPreviewModal from '../../teacherscomponent/components/ExamPreviewModal.vue'
import { useTeacherExamsStore } from '../../teacherscomponent/stores/exams'
import { useSchoolAdminUiStore } from '../stores/ui'

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const processingId = ref(null)
const pendingAction = ref(null)
const previewExamData = ref(null)

const normalizeStatus = (status) => {
  const lower = (status || '').toLowerCase()
  return lower === 'activated' ? 'active' : lower
}

const submittedExams = computed(() => store.exams.filter((e) => normalizeStatus(e.status) === 'submitted'))
const activeExams = computed(() => store.exams.filter((e) => normalizeStatus(e.status) === 'active'))
const completedExams = computed(() => store.exams.filter((e) => normalizeStatus(e.status) === 'completed'))
const completedPublishedExams = computed(() => store.exams.filter((e) => ['completed', 'published'].includes(normalizeStatus(e.status))))
const approvalExams = computed(() => store.exams.filter((e) => ['submitted', 'active'].includes(normalizeStatus(e.status))))

const submittedCount = computed(() => submittedExams.value.length)
const activeCount = computed(() => activeExams.value.length)
const completedCount = computed(() => completedExams.value.length)
const completedPublishedCount = computed(() => completedPublishedExams.value.length)

const getExpectedAttempts = (e) => e.expected_attempts ?? e.total_students ?? e.class_arm?.student_count ?? e.class_level?.student_count ?? e.students?.length ?? 0
const getCompletedAttempts = (e) => e.completed_attempts ?? e.submitted_attempts ?? e.attempts_count ?? e.attempts?.filter((a) => ['submitted', 'completed'].includes((a?.status || '').toLowerCase())).length ?? 0
const canDeleteExam = (status) => !['active', 'published', 'draft'].includes(normalizeStatus(status))
const getQuestionCount = (exam) => {
  const explicit = [exam.question_count, exam.questions_count, exam.questionsCount, exam.questionCount].find((v) => v != null && v !== '')
  if (typeof explicit === 'number') return explicit
  if (typeof explicit === 'string' && !isNaN(Number(explicit))) return Number(explicit)
  if (Array.isArray(exam.questions)) return exam.questions.length
  if (Array.isArray(exam.exam_questions)) return exam.exam_questions.length
  return 0
}

const loadSubmittedExams = async () => {
  try { await store.fetchExams() }
  catch (err) { uiStore.addToast({ title: 'Error', message: err.message || 'Failed to load exams.', variant: 'error' }) }
}

const previewExam = (exam) => { previewExamData.value = exam }
const confirmActivate = (exam) => { pendingAction.value = { examId: exam.id, action: 'activate', title: `Activate "${exam.title}"?`, message: 'This will make the exam live for students. Active attempts will start.', confirmLabel: 'Activate Exam', variant: 'primary' } }
const confirmEnd = (exam) => { pendingAction.value = { examId: exam.id, action: 'end', title: `End "${exam.title}"?`, message: 'This will force-complete all active attempts and mark the exam as completed.', confirmLabel: 'End Exam', variant: 'danger' } }
const confirmDelete = (exam) => { pendingAction.value = { examId: exam.id, action: 'delete', title: `Delete "${exam.title}"?`, message: 'This will permanently delete the exam and all its data. This cannot be undone.', confirmLabel: 'Delete Exam', variant: 'danger' } }
const confirmPublish = (exam) => { pendingAction.value = { examId: exam.id, action: 'publish', title: `Publish results for "${exam.title}"?`, message: 'Publishing will make exam scores visible to students on their dashboard.', confirmLabel: 'Publish Results', variant: 'primary' } }

const runAction = async () => {
  if (!pendingAction.value) return
  const { examId, action } = pendingAction.value
  pendingAction.value = null
  processingId.value = examId
  try {
    const messages = {
      activate: ['Exam activated', 'This exam is now live for students.'],
      publish: ['Results published', 'Students can now view their results.'],
      end: ['Exam ended', 'All active attempts were force-completed.'],
      delete: ['Exam deleted', 'The exam has been permanently removed.'],
    }
    if (action === 'activate') await store.activateExam(examId)
    if (action === 'publish') await store.publishExam(examId)
    if (action === 'end') await store.forceCompleteExam(examId)
    if (action === 'delete') await store.deleteExam(examId)
    const [title, message] = messages[action] || ['Done', '']
    uiStore.addToast({ title, message, variant: 'success' })
    await loadSubmittedExams()
  } catch (err) {
    uiStore.addToast({ title: 'Action failed', message: err.message || 'Unable to complete action.', variant: 'error' })
  } finally { processingId.value = null }
}

onMounted(loadSubmittedExams)
</script>
