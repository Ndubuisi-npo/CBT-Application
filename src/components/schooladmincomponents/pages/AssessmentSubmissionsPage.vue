<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment submissions"
      subtitle="Review scheduled assessments, set their submission windows, and open the teacher papers waiting on you."
      eyebrow="Assessment Management"
    />

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl bg-[#0B1F3A] p-5 text-white shadow-sm sm:col-span-1">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Scheduled assessments</p>
        <p class="mt-2 text-5xl font-light leading-none">{{ assessmentRows.length }}</p>
        <p class="mt-2 text-sm text-white/60">Across every class level this session.</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Open for questions</p>
        <p class="mt-2 text-3xl font-light leading-none text-[#0B1F3A]">{{ openForQuestionsCount }}</p>
        <p class="mt-2 text-sm text-slate-500">Teachers can still submit or revise papers.</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Missing a window</p>
        <p class="mt-2 text-3xl font-light leading-none text-[#0B1F3A]">{{ missingWindowCount }}</p>
        <p class="mt-2 text-sm text-slate-500">Scheduled assessments with no submission window set yet.</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <AppInput v-model="search" label="Search" placeholder="Search assessments…" class="min-w-[220px] flex-1" />
        <AppSelect v-model="filterLevel" label="Class level" :options="classLevelOptions" placeholder="All levels" class="w-full sm:w-40" />
        <AppSelect v-model="filterStatus" label="Status" :options="statusOptions" placeholder="All statuses" class="w-full sm:w-44" />
      </div>

      <AppEmptyState
        v-if="!filteredRows.length"
        :icon="ClipboardList"
        title="No assessments match these filters"
        description="Try clearing the search or choosing a different class level."
      />

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th scope="col" class="px-5 py-3 font-semibold sm:px-6">Assessment</th>
              <th scope="col" class="px-4 py-3 font-semibold">Class</th>
              <th scope="col" class="px-4 py-3 font-semibold">Session · term</th>
              <th scope="col" class="px-4 py-3 font-semibold">Questions close</th>
              <th scope="col" class="px-4 py-3 font-semibold">Status</th>
              <th scope="col" class="px-5 py-3 text-right font-semibold sm:px-6"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="assessment in filteredRows" :key="assessment.id" class="transition hover:bg-slate-50/60">
              <td class="px-5 py-4 align-top sm:px-6">
                <p class="font-semibold text-slate-900">{{ assessment.title }}</p>
                <p class="mt-0.5 max-w-md truncate text-xs text-slate-400">{{ assessment.description || 'No description provided.' }}</p>
                <p class="mt-1.5 text-xs text-slate-400">{{ assessment.total_marks ?? '—' }} marks</p>
              </td>
              <td class="px-4 py-4 align-top text-slate-600">{{ classText(assessment) }}</td>
              <td class="px-4 py-4 align-top text-slate-600">
                {{ sessionName(assessment) }}
                <span class="block text-xs text-slate-400">{{ termName(assessment) }}</span>
              </td>
              <td class="px-4 py-4 align-top text-slate-600">{{ assessment.question_submission_ends ? formatDate(assessment.question_submission_ends) : 'Not set' }}</td>
              <td class="px-4 py-4 align-top">
                <div class="flex flex-col items-start gap-1.5">
                  <AppBadge :label="assessmentStatusLabel(assessment)" :variant="assessmentVariant(assessment)" dot />
                  <AppBadge :label="questionSubmissionStatusLabel(assessment)" :variant="questionSubmissionVariant(assessment)" />
                </div>
              </td>
              <td class="px-5 py-4 align-top sm:px-6">
                <div class="flex justify-end gap-2">
                  <AppButton :text="assessment.schedule_id ? 'Edit window' : 'Add window'" variant="ghost" size="xs" @click="editAssessment(assessment)" />
                  <AppButton text="View papers" variant="outline" size="xs" @click="viewSubmissions(assessment)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <SubmissionConfigurationModal
      :show="showSubmissionModal"
      :assessment="selectedAssessment"
      :saving="saving"
      :error="saveError"
      @close="closeSubmissionModal"
      @submit="saveSubmission"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClipboardList } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import SubmissionConfigurationModal from '../components/SubmissionConfigurationModal.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const saving = ref(false)
const saveError = ref('')
const showSubmissionModal = ref(false)
const search = ref('')
const filterLevel = ref('')
const filterStatus = ref('')

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending setup' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
]

const assessmentRows = computed(() => store.scheduledAssessments)
const classLevelOptions = computed(() => store.classLevelOptions)
const selectedAssessment = computed(() => store.selectedAssessment || store.getAssessmentById(route.params.assessmentId || route.params.id))

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()
  return assessmentRows.value.filter((assessment) => {
    const matchesSearch = query ? String(assessment.title || '').toLowerCase().includes(query) : true
    const levelId = assessment.class_level_id ?? assessment.classLevelId
    const matchesLevel = filterLevel.value ? String(levelId) === String(filterLevel.value) : true
    const matchesStatus = filterStatus.value
      ? (assessment.assessment_status || assessment.status || '').toLowerCase() === filterStatus.value
      : true
    return matchesSearch && matchesLevel && matchesStatus
  })
})

const openForQuestionsCount = computed(() => assessmentRows.value.filter((a) => (a.question_submission_status || 'open').toLowerCase() === 'open').length)
const missingWindowCount = computed(() => assessmentRows.value.filter((a) => !a.schedule_id).length)

const classText = (assessment) => {
  const level = store.classLevelOptions.find((option) => String(option.value) === String(assessment.class_level_id ?? assessment.classLevelId))?.label || '—'
  const arm = assessment.class_arm_id ?? assessment.classArmId
    ? store.classArmOptions.find((option) => String(option.value) === String(assessment.class_arm_id ?? assessment.classArmId))?.label || ''
    : 'Whole level'
  return `${level} · ${arm}`
}
const sessionName = (assessment) => store.sessionOptions.find((option) => String(option.value) === String(assessment.session_id ?? assessment.sessionId ?? assessment.academic_session_id ?? assessment.academicSessionId))?.label || '—'
const termName = (assessment) => store.activeTermLabel || assessment.term?.name || '—'
const formatDate = (value) => value ? fmtDateTime(value) : 'Not set'

const questionSubmissionStatusLabel = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'Question submission open' : 'Question submission closed')
const questionSubmissionVariant = (assessment) => ((assessment?.question_submission_status || 'open') === 'open' ? 'success' : 'default')
const assessmentVariant = (assessment) => getStatusVariant(assessment?.assessment_status || assessment?.status)
const assessmentStatusLabel = (assessment) => getAssessmentStatusLabel(assessment?.assessment_status || assessment?.status)

const editAssessment = (assessment) => {
  store.selectAssessment(assessment.id)
  saveError.value = ''
  showSubmissionModal.value = true
}

const closeSubmissionModal = () => {
  showSubmissionModal.value = false
  saveError.value = ''
}

const viewSubmissions = (assessment) => router.push(`/school-admin/assessments/${assessment.id}/submissions`)

const saveSubmission = async (form) => {
  if (!selectedAssessment.value) return
  saving.value = true
  try {
    await store.saveSubmissionConfiguration(selectedAssessment.value.id, { ...form, question_submission_status: 'open', assessment_status: 'pending' })
    closeSubmissionModal()
  } catch (error) {
    saveError.value = error?.message || 'Unable to save submission configuration.'
  } finally {
    saving.value = false
  }
}

watch(selectedAssessment, (assessment) => {
  if (!assessment) return
  store.selectAssessment(assessment.id)
}, { immediate: true })

onMounted(async () => {
  await Promise.all([store.fetchRefData(), store.fetchAssessments()])
  if (route.params.assessmentId) {
    const assessment = store.getAssessmentById(route.params.assessmentId)
    if (assessment) editAssessment(assessment)
  }
})
</script>
