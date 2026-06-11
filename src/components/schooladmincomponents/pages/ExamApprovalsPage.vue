<template>
  <div class="space-y-6">
    <SectionCard title="Exam Approval" subtitle="Review teacher-submitted exams and activate them for student access.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton :icon="RefreshCcw" text="Refresh" variant="outline" @click="loadSubmittedExams" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Submitted Exams</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ submittedCount }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Activated Exams</p>
          <p class="mt-3 text-3xl font-semibold text-emerald-600">{{ activeCount }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Completed Exams</p>
          <p class="mt-3 text-3xl font-semibold text-blue-600">{{ completedCount }}</p>
        </div>
        <!-- <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Total Students Expected</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ totalExpectedAttempts }}</p>
        </div> -->
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Published Exams</p>
          <p class="mt-3 text-3xl font-semibold text-pruple-900">{{ completedPublishedCount }}</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Submitted Exams" subtitle="Exams submitted by teachers awaiting activation.">
      <div class="space-y-4 pt-6">
        <div v-if="store.loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-[24px] bg-slate-100" />
        </div>

        <div v-else-if="store.error" class="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-600">
          <p>{{ store.error }}</p>
          <AppButton class="mt-4" text="Retry" variant="outline" @click="loadSubmittedExams" />
        </div>

        <div v-else>
          <article
            v-for="exam in approvalExams"
            :key="exam.id"
            class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-semibold text-slate-900 truncate">{{ exam.title }}</h2>
                  <span :class="`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatus(exam.status))}`">
                    {{ normalizeStatus(exam.status) === 'active' ? 'Active' : normalizeStatus(exam.status) === 'submitted' ? 'Submitted' : 'Unknown' }}
                  </span>
                </div>
                <p class="mt-2 text-sm text-slate-500">
                  {{ exam.subject?.name || exam.subject || '—' }} • {{ exam.classLevel?.name || '—' }} • {{ exam.classArm?.name || '—' }}
                </p>

                <div class="mt-4 grid gap-3 sm:grid-cols-3">
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Expected Attempts</p>
                    <p class="mt-2 font-medium text-slate-900">{{ getExpectedAttempts(exam) }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Completed Attempts</p>
                    <p class="mt-2 font-medium text-slate-900">{{ getCompletedAttempts(exam) }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Total Questions</p>
                    <p class="mt-2 font-medium text-slate-900">{{ getQuestionCount(exam) }}</p>
                  </div>
                </div>
              </div>

                        <div class="flex flex-wrap items-center gap-2">
                          <AppButton
                            text="Activate Exam"
                            variant="primary"
                            size="sm"
                            v-if="normalizeStatus(exam.status) === 'submitted'"
                            :processing="processingId === exam.id"
                            @click="confirmActivate(exam)"
                          />
                          <AppButton
                            text="End Exam"
                            variant="danger"
                            size="sm"
                            v-else-if="normalizeStatus(exam.status) === 'active'"
                            :processing="processingId === exam.id"
                            @click="confirmEnd(exam)"
                          />
                          <AppButton
                            text="Publish Results"
                            variant="primary"
                            size="sm"
                            v-else-if="normalizeStatus(exam.status) === 'completed'"
                            :processing="processingId === exam.id"
                            @click="confirmPublish(exam)"
                          />
                          <AppButton text="View Details" variant="outline" size="sm" @click="previewExam(exam)" />
                          <AppButton v-if="normalizeStatus(exam.status) !== 'active' && normalizeStatus(exam.status) !== 'published'" :icon="Trash2" text="Delete" variant="danger" size="sm" @click="confirmDelete(exam)" :processing="processingId === exam.id" />
                        </div>
            </div>
          </article>

          <div v-if="!approvalExams.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            <p class="font-medium text-slate-700">No exams found for approval or publishing</p>
            <p class="mt-2">Teachers will see their submitted or active exams here once they push them forward.</p>
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Completed / Published Exams" subtitle="Finished exams ready for review or results publishing.">
      <div class="space-y-4 pt-6">
        <div v-if="store.loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-[24px] bg-slate-100" />
        </div>

        <div v-else-if="store.error" class="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-600">
          <p>{{ store.error }}</p>
          <AppButton class="mt-4" text="Retry" variant="outline" @click="loadSubmittedExams" />
        </div>

        <div v-else>
          <div v-if="!completedPublishedExams.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            <p class="font-medium text-slate-700">No completed or published exams found.</p>
            <p class="mt-2">Completed exams will appear here once they have been finished or published.</p>
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="exam in completedPublishedExams"
              :key="exam.id"
              class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-slate-900 truncate">{{ exam.title }}</h2>
                    <span :class="`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatus(exam.status))}`">
                      {{ normalizeStatus(exam.status) === 'completed' ? 'Completed' : normalizeStatus(exam.status) === 'published' ? 'Published' : 'Unknown' }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-slate-500">
                    {{ exam.subject?.name || exam.subject || '—' }} • {{ exam.classLevel?.name || '—' }} • {{ exam.classArm?.name || '—' }}
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <AppButton
                    v-if="normalizeStatus(exam.status) === 'completed'"
                    text="Publish Results"
                    variant="primary"
                    size="sm"
                    :processing="processingId === exam.id"
                    @click="confirmPublish(exam)"
                  />
                  <AppButton text="View Details" variant="outline" size="sm" @click="previewExam(exam)" />
                  <AppButton v-if="normalizeStatus(exam.status) !== 'active' && normalizeStatus(exam.status) !== 'published'" :icon="Trash2" text="Delete" variant="danger" size="sm" @click="confirmDelete(exam)" :processing="processingId === exam.id" />
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </SectionCard>

    <ConfirmModal
      v-if="pendingAction"
      :title="pendingAction.title"
      :message="pendingAction.message"
      :confirm-label="pendingAction.confirmLabel"
      :variant="pendingAction.variant"
      @confirm="runAction"
      @cancel="pendingAction = null"
    />

    <ExamPreviewModal
      v-if="previewExamData"
      :exam="previewExamData"
      @close="previewExamData = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RefreshCcw, Trash2 } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
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
  if (lower === 'activated') return 'active'
  return lower
}

const submittedExams = computed(() => store.exams.filter((exam) => normalizeStatus(exam.status) === 'submitted'))
const activeExams = computed(() => store.exams.filter((exam) => normalizeStatus(exam.status) === 'active'))
const completedExams = computed(() => store.exams.filter((exam) => normalizeStatus(exam.status) === 'completed'))
const completedPublishedExams = computed(() => store.exams.filter((exam) => ['completed', 'published'].includes(normalizeStatus(exam.status))))
const approvalExams = computed(() => store.exams.filter((exam) => ['submitted', 'active'].includes(normalizeStatus(exam.status))))

const submittedCount = computed(() => submittedExams.value.length)
const activeCount = computed(() => activeExams.value.length)
const completedCount = computed(() => completedExams.value.length)
const completedPublishedCount = computed(() => completedPublishedExams.value.length)
const totalExpectedAttempts = computed(() =>
  store.exams.reduce((sum, exam) => sum + Number(getExpectedAttempts(exam) || 0), 0),
)

const statusBadgeClass = (status) => {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'submitted') return 'bg-slate-100 text-slate-700'
  if (status === 'completed') return 'bg-blue-100 text-blue-700'
  if (status === 'published') return 'bg-indigo-100 text-indigo-700'
  return 'bg-slate-100 text-slate-700'
}

const getExpectedAttempts = (exam) =>
  exam.expected_attempts ??
  exam.total_students ??
  exam.class_arm?.student_count ??
  exam.class_arm?.students_count ??
  exam.class_level?.student_count ??
  exam.class_level?.students_count ??
  exam.students?.length ??
  0

const getCompletedAttempts = (exam) =>
  exam.completed_attempts ??
  exam.submitted_attempts ??
  exam.attempts_count ??
  exam.attempts?.filter((attempt) => ['submitted', 'completed'].includes((attempt?.status || '').toLowerCase())).length ??
  0

const getQuestionCount = (exam) => {
  if (!exam) return 0

  const explicitCount = [
    exam.question_count,
    exam.questions_count,
    exam.questionsCount,
    exam.questionCount,
  ].find((value) => value != null && value !== '')

  if (typeof explicitCount === 'number') return explicitCount
  if (typeof explicitCount === 'string' && !Number.isNaN(Number(explicitCount))) return Number(explicitCount)

  if (Array.isArray(exam.questions)) return exam.questions.length
  if (Array.isArray(exam.questions?.data)) return exam.questions.data.length
  if (Array.isArray(exam.exam_questions)) return exam.exam_questions.length

  return 0
}

const loadSubmittedExams = async () => {
  try {
    // Fetch all exams so stats (active, completed counts) are accurate
    await store.fetchExams()
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message || 'Failed to load exams.', variant: 'error' })
  }
}

const previewExam = (exam) => {
  previewExamData.value = exam
}

const confirmActivate = (exam) => {
  pendingAction.value = {
    examId: exam.id,
    action: 'activate',
    title: `Activate exam — “${exam.title}”?`,
    message: 'Activating this exam will make it live for students. Once active, student attempts will begin counting toward expected and completed totals.',
    confirmLabel: 'Activate Exam',
    variant: 'primary',
  }
}

const confirmEnd = (exam) => {
  pendingAction.value = {
    examId: exam.id,
    action: 'end',
    title: `End exam — “${exam.title}”?`,
    message: 'Ending this exam will force-complete any active student attempts and mark the exam completed.',
    confirmLabel: 'End Exam',
    variant: 'danger',
  }
}

const confirmDelete = (exam) => {
  pendingAction.value = {
    examId: exam.id,
    action: 'delete',
    title: `Delete exam — “${exam.title}”?`,
    message: 'This will permanently delete the exam and its data. This action cannot be undone.',
    confirmLabel: 'Delete Exam',
    variant: 'danger',
  }
}

const confirmPublish = (exam) => {
  pendingAction.value = {
    examId: exam.id,
    action: 'publish',
    title: `Publish results — “${exam.title}”?`,
    message: 'Publishing results will make exam scores visible to students on their dashboard.',
    confirmLabel: 'Publish Results',
    variant: 'primary',
  }
}

const runAction = async () => {
  if (!pendingAction.value) return
  const { examId, action } = pendingAction.value
  pendingAction.value = null
  processingId.value = examId

  try {
    if (action === 'activate') {
      await store.activateExam(examId)
      uiStore.addToast({ title: 'Exam activated', message: 'This exam is now live for students.', variant: 'success' })
    }
    if (action === 'publish') {
      await store.publishExam(examId)
      uiStore.addToast({ title: 'Results published', message: 'Students can now view their exam results.', variant: 'success' })
    }
    if (action === 'end') {
      await store.forceCompleteExam(examId)
      uiStore.addToast({ title: 'Exam ended', message: 'Active attempts were force-completed and exam is now ended.', variant: 'success' })
    }
    if (action === 'delete') {
      await store.deleteExam(examId)
      uiStore.addToast({ title: 'Exam deleted', message: 'The exam has been removed.', variant: 'success' })
    }
    await loadSubmittedExams()
  } catch (err) {
    uiStore.addToast({ title: 'Action failed', message: err.message || 'Unable to complete exam action.', variant: 'error' })
  } finally {
    processingId.value = null
  }
}

onMounted(loadSubmittedExams)
</script>
