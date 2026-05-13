<template>
  <div class="space-y-6">
    <SectionCard title="Exams" subtitle="Manage drafts, scheduled assessments, published results, and live monitoring from one place.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton :icon="Plus" text="Create Exam" variant="primary" @click="$router.push('/teachers/exam-wizard')" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Draft Exams</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ examCounts.draft }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Scheduled</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ examCounts.scheduled }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Live Now</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ examCounts.live }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Completed</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ examCounts.completed }}</p>
        </div>
      </div>
    </SectionCard>

    <section ref="monitorAnchor">
      <SectionCard title="Live Exam Monitoring" subtitle="Track in-progress student activity, attendance, and suspicious behaviour.">
        <div class="space-y-5 pt-6">
          <div class="">
            <div class="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
              <p class="text-sm text-emerald-700">Live students</p>
              <p class="mt-3 text-3xl font-semibold text-emerald-800">{{ liveMonitoring.summary.activeStudents }}</p>
              <p class="mt-2 text-sm text-emerald-700">{{ liveMonitoring.summary.timeRemaining }}</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Submitted</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ liveMonitoring.summary.submitted }}</p>
            </div>
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Disconnected</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ liveMonitoring.summary.disconnected }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <article
              v-for="student in liveMonitoring.students"
              :key="student.id"
              class="rounded-[24px] border border-slate-200 bg-white p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base font-semibold text-slate-900">{{ student.name }}</h3>
                  </div>
                  <p class="mt-2 text-sm text-slate-500">{{ student.className }} • {{ student.connection }} • {{ student.attendance }}</p>
                </div>
                <div class="min-w-[220px] space-y-2">
                  <div class="flex items-center justify-between text-sm text-slate-500">
                    <span>Exam progress</span>
                    <span>{{ student.progress }}%</span>
                  </div>
                  <div class="h-2 rounded-full bg-slate-200">
                    <div class="h-2 rounded-full bg-[#0B1F3A]" :style="{ width: `${student.progress}%` }"></div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </SectionCard>
    </section>

    <section class="space-y-6">
      <SectionCard title="Exam Library" subtitle="Every assessment in your current teaching cycle.">
        <template #header>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="tab in tabs"
              :key="tab"
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition"
              :class="activeTab === tab ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </template>

        <div class="space-y-4 pt-6">
          <article
            v-for="exam in filteredExams"
            :key="exam.id"
            class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37]/70 hover:shadow-md"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h2>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(exam.status)">{{ exam.status }}</span>
                </div>
                <p class="text-sm text-slate-500">{{ exam.subject }} • {{ exam.className }} • {{ exam.type }}</p>
                <div class="grid gap-3 md:grid-cols-4">
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                    <p class="mt-2 font-medium text-slate-900">{{ exam.scheduleLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Questions</p>
                    <p class="mt-2 font-medium text-slate-900">{{ exam.questions.length }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Candidates</p>
                    <p class="mt-2 font-medium text-slate-900">{{ exam.candidates }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Submitted</p>
                    <p class="mt-2 font-medium text-slate-900">{{ exam.submitted }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <AppButton :icon="Eye" text="Preview" variant="outline" size="sm" @click="previewExam(exam)" />
                <AppButton :icon="Edit3" text="Edit" variant="secondary" size="sm" @click="$router.push('/teachers/exam-wizard')" />
                <AppButton
                  v-if="exam.status === 'Draft'"
                  :icon="Send"
                  text="Publish"
                  variant="primary"
                  size="sm"
                  @click="confirmAction('publish', exam)"
                />
                <AppButton
                  v-if="exam.status === 'Scheduled'"
                  :icon="Clock4"
                  text="Reschedule"
                  variant="outline"
                  size="sm"
                  @click="confirmAction('schedule', exam)"
                />
                <AppButton
                  v-if="exam.status === 'Live'"
                  :icon="Activity"
                  text="Monitor"
                  variant="outline"
                  size="sm"
                  @click="scrollToMonitor"
                />
                <AppButton :icon="Trash2" variant="ghost" size="sm" @click="confirmAction('delete', exam)" />
              </div>
            </div>
          </article>

          <div v-if="!filteredExams.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
            No exams match the current filter. Switch tabs or create a new assessment.
          </div>
        </div>
      </SectionCard>
    </section>

    <div v-if="confirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Confirm Action</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ confirmModal.title }}</h2>
          </div>
          <AppButton :icon="X" variant="ghost" @click="confirmModal = null" />
        </div>
        <p class="mt-4 text-sm leading-6 text-slate-500">{{ confirmModal.message }}</p>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <AppButton text="Cancel" variant="ghost" @click="confirmModal = null" />
          <AppButton :text="confirmModal.buttonLabel" :variant="confirmModal.variant" @click="runAction" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Activity, Clock4, Edit3, Eye, Plus, Send, Trash2, X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { cloneMock, examLibrary, getQuestionBankForExam, liveMonitoring } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()

const activeTab = ref('All')
const exams = ref(cloneMock(examLibrary))
const selectedExamPreview = ref(cloneMock(examLibrary[0]))
const confirmModal = ref(null)
const monitorAnchor = ref(null)

const tabs = ['All', 'Draft', 'Scheduled', 'Live', 'Completed']

const examCounts = computed(() => ({
  draft: exams.value.filter((exam) => exam.status === 'Draft').length,
  scheduled: exams.value.filter((exam) => exam.status === 'Scheduled').length,
  live: exams.value.filter((exam) => exam.status === 'Live').length,
  completed: exams.value.filter((exam) => exam.status === 'Completed').length,
}))

const filteredExams = computed(() => {
  if (activeTab.value === 'All') return exams.value
  return exams.value.filter((exam) => exam.status === activeTab.value)
})

const selectedExamQuestions = computed(() => getQuestionBankForExam(selectedExamPreview.value?.questions || []))

const statusClass = (status) => {
  const classes = {
    Draft: 'bg-slate-100 text-slate-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Live: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-indigo-100 text-indigo-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

const previewExam = (exam) => {
  selectedExamPreview.value = cloneMock(exam)
}

const confirmAction = (action, exam) => {
  const messages = {
    publish: {
      title: `Publish ${exam.title}?`,
      message: 'Students in the selected class will see this exam immediately in their active assessment list.',
      buttonLabel: 'Publish exam',
      variant: 'primary',
    },
    schedule: {
      title: `Reschedule ${exam.title}?`,
      message: 'This keeps the exam published but lets you update the sitting window and invigilation plan.',
      buttonLabel: 'Confirm schedule',
      variant: 'outline',
    },
    delete: {
      title: `Delete ${exam.title}?`,
      message: 'This mock action removes the exam card from the showcase flow.',
      buttonLabel: 'Delete exam',
      variant: 'danger',
    },
  }
  confirmModal.value = { ...messages[action], action, examId: exam.id }
}

const runAction = () => {
  if (!confirmModal.value) return

  const { action, examId } = confirmModal.value
  const exam = exams.value.find((item) => item.id === examId)

  if (!exam) {
    confirmModal.value = null
    return
  }

  if (action === 'publish') exam.status = 'Published'
  if (action === 'schedule') exam.status = 'Scheduled'
  if (action === 'delete') exams.value = exams.value.filter((item) => item.id !== examId)

  uiStore.addToast({
    title: 'Exam updated',
    message: `${exam.title} has been ${action === 'delete' ? 'removed from the list' : action === 'publish' ? 'published successfully' : 'rescheduled successfully'}.`,
    variant: 'success',
  })
  confirmModal.value = null
}

const scrollToMonitor = () => {
  monitorAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
