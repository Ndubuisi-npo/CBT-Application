<template>
  <div class="space-y-6">
    <SectionCard title="Assessments" subtitle="Browse admin-created assessments and add questions from your question bank.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton :icon="Plus" text="Question Bank" variant="primary" @click="$router.push('/teachers/questions')" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">All Assessments</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ exams.length }}</p>
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

    <section class="space-y-6">
      <SectionCard title="Assessment Library" subtitle="Every assessment in your current teaching cycle.">
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
                <p class="text-sm text-slate-500">{{ exam.subject }} | {{ exam.className }} | {{ exam.type }}</p>
                <div class="grid gap-3 md:grid-cols-4">
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                    <p class="mt-2 font-medium text-slate-900">{{ scheduleLabel(exam) }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Questions</p>
                    <p class="mt-2 font-medium text-slate-900">{{ exam.questions?.length || 0 }}</p>
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
                <AppButton :icon="Edit3" text="Add Questions" variant="secondary" size="sm" @click="$router.push({ path: '/teachers/questions', query: { examId: exam.id } })" />
                <AppButton
                  v-if="exam.status === 'Live'"
                  :icon="Activity"
                  text="Monitor"
                  variant="outline"
                  size="sm"
                  @click="scrollToMonitor"
                />
              </div>
            </div>
          </article>

          <div v-if="!filteredExams.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
            No assessments match the current filter. Ask the school admin to create an assessment or switch tabs.
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
import { computed, onMounted, ref } from 'vue'
import { Activity, Edit3, Eye, Plus, X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { useSchoolAdminAssessmentsStore } from '../../schooladmincomponents/stores/assessments'
import SectionCard from '../components/SectionCard.vue'
import { cloneMock, liveMonitoring } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()
const assessmentsStore = useSchoolAdminAssessmentsStore()

const activeTab = ref('All')
const selectedExamPreview = ref(null)
const confirmModal = ref(null)
const monitorAnchor = ref(null)

const tabs = ['All', 'Live', 'Completed']
const exams = computed(() => assessmentsStore.assessments)

const examCounts = computed(() => ({
  live: exams.value.filter((exam) => exam.status === 'Live').length,
  completed: exams.value.filter((exam) => exam.status === 'Completed').length,
}))

const filteredExams = computed(() => {
  if (activeTab.value === 'All') return exams.value
  return exams.value.filter((exam) => exam.status === activeTab.value)
})

const statusClass = (status) => {
  const classes = {
    Draft: 'bg-slate-100 text-slate-700',
    Published: 'bg-blue-100 text-blue-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Live: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-indigo-100 text-indigo-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

const previewExam = (exam) => {
  selectedExamPreview.value = cloneMock(exam)
}

const scheduleLabel = (exam) => {
  if (!exam.startTime && !exam.endTime) return 'Not scheduled'
  const start = exam.startTime ? exam.startTime.replace('T', ' ') : 'Not set'
  const end = exam.endTime ? exam.endTime.replace('T', ' ') : 'Not set'
  return `${start} - ${end}`
}

const confirmAction = (action, exam) => {
  const messages = {
    delete: {
      title: `Delete ${exam.title}?`,
      message: 'This mock action removes the assessment card from the showcase flow.',
      buttonLabel: 'Delete assessment',
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

  if (action === 'delete') {
    exams.value = exams.value.filter((item) => item.id !== examId)
    uiStore.addToast({
      title: 'Assessment updated',
      message: `${exam.title} has been removed.`,
      variant: 'success',
    })
  }
  confirmModal.value = null
}

const scrollToMonitor = () => {
  monitorAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  try {
    await assessmentsStore.fetchAssessments()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load assessments.', variant: 'error' })
  }
})
</script>
