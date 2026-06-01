<template>
  <div class="space-y-6">
    <!-- Stats bar -->
    <SectionCard title="Exam Management" subtitle="Create, manage, launch, and monitor your exams. You own the full lifecycle.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton :icon="Plus" text="Create Exam" variant="primary" @click="openCreateModal" />
          <AppButton :icon="FileQuestion" text="Question Bank" variant="outline" @click="$router.push('/teachers/questions')" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">All Exams</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ store.exams.length }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Live Now</p>
          <p class="mt-3 text-3xl font-semibold text-emerald-600">{{ countByStatus('active') }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Draft</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ countByStatus('draft') }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Published</p>
          <p class="mt-3 text-3xl font-semibold text-blue-600">{{ countByStatus('published') }}</p>
        </div>
      </div>
    </SectionCard>

    <!-- Filter tabs -->
    <SectionCard title="Exam Library" subtitle="All exams in your teaching cycle. Click an exam to manage it.">
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition"
            :class="activeTab === tab.value ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </template>

      <!-- Loading skeleton -->
      <div v-if="store.loading" class="space-y-4 pt-6">
        <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <!-- Error state -->
      <div v-else-if="store.error" class="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-8 text-center pt-6">
        <p class="text-sm text-rose-600">{{ store.error }}</p>
        <AppButton class="mt-4" text="Retry" variant="outline" @click="loadExams" />
      </div>

      <!-- Exam list -->
      <div v-else class="space-y-4 pt-6">
        <article
          v-for="exam in filteredExams"
          :key="exam.id"
          class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37]/60 hover:shadow-md"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3 flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h2>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="store.getStatusClass(exam.status)"
                >
                  {{ store.getStatusLabel(exam.status) }}
                </span>
              </div>
              <p class="text-sm text-slate-500">
                {{ exam.subject?.name || exam.subject || '—' }} &nbsp;|&nbsp; {{ exam.class_level?.name || '—' }} &nbsp;|&nbsp; {{ exam.class_arm?.name || '—' }} &nbsp;|&nbsp; {{ exam.type || 'exam' }}
              </p>
              <div class="grid gap-3 md:grid-cols-4">
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                  <p class="mt-2 font-medium text-slate-900">{{ exam.duration_minutes || exam.duration || '—' }} min</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Questions</p>
                  <p class="mt-2 font-medium text-slate-900">{{ getQuestionCount(exam) }}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Pass Mark</p>
                  <p class="mt-2 font-medium text-slate-900">{{ exam.pass_mark ?? exam.passMark ?? '—' }}%</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Attempts</p>
                  <p class="mt-2 font-medium text-slate-900">{{ exam.attempts_count ?? '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Action buttons derived from valid transitions -->
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <!-- Always available -->
              <AppButton :icon="Eye" text="Preview" variant="ghost" size="sm" @click="previewExam(exam)" />

              <!-- Edit/Questions — only for draft -->
              <template v-if="store.canEdit(exam)">
                <AppButton :icon="Edit3" text="Edit" variant="outline" size="sm" @click="openEditModal(exam)" />
                <AppButton :icon="ListChecks" text="Questions" variant="secondary" size="sm" @click="manageQuestions(exam)" />
              </template>

              <!-- Active exam — monitoring & end session -->
              <template v-if="(exam.status || '').toLowerCase() === 'active'">
                <AppButton :icon="Activity" text="Monitor" variant="primary" size="sm" @click="openMonitor(exam)" />
              </template>

              <!-- Results — grading or published -->
              <template v-if="['grading', 'published'].includes((exam.status || '').toLowerCase())">
                <AppButton :icon="BarChart2" text="Results" variant="outline" size="sm" @click="viewResults(exam)" />
              </template>

              <!-- Dynamic lifecycle actions from state machine -->
              <template v-for="action in store.getValidActions(exam)" :key="action.action">
                <AppButton
                  :text="action.label"
                  :variant="action.variant"
                  size="sm"
                  :processing="processingId === `${exam.id}-${action.action}`"
                  @click="handleLifecycleAction(exam, action)"
                />
              </template>

              <!-- Delete — only for draft/locked -->
              <template v-if="store.canDelete(exam)">
                <AppButton :icon="Trash2" text="Delete" variant="danger" size="sm" @click="confirmDelete(exam)" />
              </template>
            </div>
          </div>
        </article>

        <div
          v-if="!filteredExams.length && !store.loading"
          class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500"
        >
          <p class="font-medium text-slate-700">No exams found</p>
          <p class="mt-2">Create your first exam to get started.</p>
          <AppButton class="mt-4" :icon="Plus" text="Create Exam" variant="primary" @click="openCreateModal" />
        </div>
      </div>
    </SectionCard>

    <!-- ── Modals ── -->

    <!-- Lifecycle action confirmation -->
    <ConfirmModal
      v-if="pendingAction"
      :title="pendingAction.title"
      :message="pendingAction.message"
      :confirm-label="pendingAction.confirmLabel"
      :variant="pendingAction.variant"
      :extra-field="pendingAction.extraField"
      :extra-field-label="pendingAction.extraFieldLabel"
      :extra-field-placeholder="pendingAction.extraFieldPlaceholder"
      @confirm="runAction"
      @cancel="pendingAction = null"
    />

    <!-- Create / Edit modal -->
    <ExamFormModal
      v-if="showFormModal"
      :exam="editingExam"
      @saved="onExamSaved"
      @close="closeFormModal"
    />

    <!-- Question management panel -->
    <ExamQuestionsPanel
      v-if="questionsPanelExam"
      :exam="questionsPanelExam"
      @close="questionsPanelExam = null"
      @updated="loadExams"
    />

    <!-- Monitoring panel -->
    <ExamMonitorPanel
      v-if="monitorExam"
      :exam="monitorExam"
      @close="monitorExam = null"
    />

    <!-- Results panel -->
    <ExamResultsPanel
      v-if="resultsExam"
      :exam="resultsExam"
      @close="resultsExam = null"
    />

    <!-- Preview modal (read-only) -->
    <ExamPreviewModal
      v-if="previewExamData"
      :exam="previewExamData"
      @close="previewExamData = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Activity, BarChart2, Edit3, Eye, FileQuestion, ListChecks, Plus, Trash2 } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ExamFormModal from '../components/ExamFormModal.vue'
import ExamQuestionsPanel from '../components/ExamQuestionsPanel.vue'
import ExamMonitorPanel from '../components/ExamMonitorPanel.vue'
import ExamResultsPanel from '../components/ExamResultsPanel.vue'
import ExamPreviewModal from '../components/ExamPreviewModal.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const store = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

// ── State ──────────────────────────────────────────────────────────────────

const activeTab = ref('all')
const processingId = ref(null)
const pendingAction = ref(null)  // { examId, action, title, message, confirmLabel, variant, extraField? }
const showFormModal = ref(false)
const editingExam = ref(null)
const questionsPanelExam = ref(null)
const monitorExam = ref(null)
const resultsExam = ref(null)
const previewExamData = ref(null)

// ── Computed ───────────────────────────────────────────────────────────────

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Live', value: 'active' },
  { label: 'Grading', value: 'grading' },
  { label: 'Published', value: 'published' },
  { label: 'Locked', value: 'locked' },
]

const filteredExams = computed(() => {
  if (activeTab.value === 'all') return store.exams
  return store.exams.filter((e) => (e.status || '').toLowerCase() === activeTab.value)
})

const countByStatus = (status) =>
  store.exams.filter((e) => (e.status || '').toLowerCase() === status).length

const getQuestionCount = (exam) =>
  exam.question_count ?? exam.questions_count ?? exam.questionsCount ??
  (Array.isArray(exam.questions) ? exam.questions.length : 0)

// ── Load ───────────────────────────────────────────────────────────────────

const loadExams = async () => {
  try {
    await store.fetchExams()
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message || 'Failed to load exams.', variant: 'error' })
  }
}

onMounted(loadExams)

// ── CRUD handlers ──────────────────────────────────────────────────────────

const openCreateModal = () => {
  editingExam.value = null
  showFormModal.value = true
}

const openEditModal = (exam) => {
  editingExam.value = { ...exam }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingExam.value = null
}

const onExamSaved = async () => {
  closeFormModal()
  await loadExams()
  uiStore.addToast({ title: 'Exam saved', message: 'Your exam has been saved.', variant: 'success' })
}

const manageQuestions = (exam) => {
  questionsPanelExam.value = exam
}

const openMonitor = (exam) => {
  monitorExam.value = exam
}

const viewResults = (exam) => {
  resultsExam.value = exam
}

const previewExam = (exam) => {
  previewExamData.value = exam
}

const confirmDelete = (exam) => {
  pendingAction.value = {
    examId: exam.id,
    action: 'delete',
    title: `Delete "${exam.title}"?`,
    message: 'This action cannot be undone. The exam and all its questions will be permanently deleted.',
    confirmLabel: 'Delete Exam',
    variant: 'danger',
  }
}

// ── Lifecycle action handling ──────────────────────────────────────────────

const handleLifecycleAction = (exam, actionDef) => {
  if (actionDef.confirm) {
    // Build confirm modal config
    const config = {
      examId: exam.id,
      action: actionDef.action,
      title: `${actionDef.label} — "${exam.title}"?`,
      message: actionDef.description,
      confirmLabel: actionDef.label,
      variant: actionDef.variant === 'danger' ? 'danger' : 'primary',
    }

    // activate needs session_duration_minutes input
    if (actionDef.action === 'activate') {
      config.extraField = 'sessionDuration'
      config.extraFieldLabel = 'Session Duration (minutes)'
      config.extraFieldPlaceholder = '60'
    }

    pendingAction.value = config
  } else {
    // Run immediately without confirm
    executeAction(exam.id, actionDef.action)
  }
}

const runAction = async (extraValues = {}) => {
  if (!pendingAction.value) return
  const { examId, action } = pendingAction.value
  pendingAction.value = null
  await executeAction(examId, action, extraValues)
}

const executeAction = async (examId, action, extraValues = {}) => {
  const key = `${examId}-${action}`
  processingId.value = key

  try {
    switch (action) {
      case 'activate':
        await store.activateExam(examId, Number(extraValues.sessionDuration) || 60)
        uiStore.addToast({ title: 'Exam launched!', message: 'The exam is now live. Students can join.', variant: 'success' })
        break
      case 'endSession':
        await store.endSession(examId)
        uiStore.addToast({ title: 'Session ended', message: 'All remaining attempts have been submitted. Exam moved to grading.', variant: 'success' })
        break
      case 'publish':
        await store.publishExam(examId)
        uiStore.addToast({ title: 'Results published!', message: 'Students can now view their results.', variant: 'success' })
        break
      case 'lock':
        await store.lockExam(examId)
        uiStore.addToast({ title: 'Exam locked', message: 'The exam is frozen.', variant: 'success' })
        break
      case 'unlock':
        await store.unlockExam(examId)
        uiStore.addToast({ title: 'Exam unlocked', message: 'Exam returned to draft.', variant: 'success' })
        break
      case 'delete':
        await store.deleteExam(examId)
        uiStore.addToast({ title: 'Exam deleted', variant: 'success' })
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  } catch (err) {
    uiStore.addToast({
      title: 'Action failed',
      message: err.message || 'Something went wrong. Please try again.',
      variant: 'error',
    })
  } finally {
    processingId.value = null
  }
}
</script>
