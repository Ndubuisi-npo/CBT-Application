<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Management"
      subtitle="View, search and operate on all assessments in the mock school system."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="Create Assessment" variant="primary" size="sm" @click="createAssessment" />
      </template>
    </AppPageHeader>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-4">
        <AppInput v-model="searchQuery" label="Search" placeholder="Search assessments…" />
        <AppSelect v-model="filterStatus" label="Status" :options="statusOptions" placeholder="All statuses" />
        <AppSelect v-model="filterSession" label="Session" :options="sessionOptions" placeholder="All sessions" />
        <AppSelect v-model="filterClassLevel" label="Class Level" :options="classLevelOptions" placeholder="All levels" />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Assessment</th>
              <th class="px-5 py-3">Session</th>
              <th class="px-5 py-3">Term</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Due</th>
              <th class="px-5 py-3">Total Marks</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Submissions</th>
              <th class="px-5 py-3">Created</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="assessment in pagedAssessments" :key="assessment.id" class="group hover:bg-slate-50">
              <td class="px-5 py-4 w-[260px] max-w-xs">
                <p class="font-semibold text-slate-900">{{ assessment.title }}</p>
                <p class="mt-1 text-xs text-slate-500 truncate">{{ assessment.description }}</p>
              </td>
              <td class="px-5 py-4">{{ getSessionName(assessment.sessionId) }}</td>
              <td class="px-5 py-4">{{ getTermLabel(assessment.term) }}</td>
              <td class="px-5 py-4">{{ getClassLevelName(assessment.classLevelId) }}{{ assessment.classArmId ? ` ${getClassArmName(assessment.classArmId)}` : '' }}</td>
              <td class="px-5 py-4">{{ assessment.dueDate }} · {{ assessment.dueTime }}</td>
              <td class="px-5 py-4">{{ assessment.totalMarks }}</td>
              <td class="px-5 py-4">
                <AppBadge :label="assessment.status" :variant="getStatusVariant(assessment.status)" />
              </td>
              <td class="px-5 py-4">{{ countSubmissions(assessment.id) }}</td>
              <td class="px-5 py-4">{{ assessment.createdAt }}</td>
              <td class="px-5 py-4">
                <ResponsiveTableActions
                  :actions="actionItems(assessment)"
                  :entity-label="assessment.title"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p class="text-xs text-slate-500">Showing {{ firstItem }}–{{ lastItem }} of {{ filteredAssessments.length }}</p>
        <div class="flex items-center gap-2">
          <AppButton text="Previous" variant="outline" size="sm" :disabled="page === 1" @click="page--" />
          <span class="text-sm text-slate-700">{{ page }} / {{ totalPages }}</span>
          <AppButton text="Next" variant="outline" size="sm" :disabled="page === totalPages" @click="page++" />
        </div>
      </div>
    </section>

    <AssessmentModal
      :show="showModal"
      :assessment="activeAssessment"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AssessmentModal from '../components/AssessmentModal.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import {
  getAllAssessments,
  getSessionOptions,
  getClassLevelOptions,
  getTermLabel,
  getClassLevelName,
  getClassArmName,
  getSessionName,
  getStatusVariant,
  getSubmissionsByAssessment,
  deleteAssessment,
  duplicateAssessment,
  toggleAssessmentStatus,
  saveAssessment,
} from '../../assessments/mockAssessments'

const router = useRouter()
const assessments = ref(getAllAssessments())
const searchQuery = ref('')
const filterStatus = ref('')
const filterSession = ref('')
const filterClassLevel = ref('')
const sortKey = ref('createdAt')
const sortDirection = ref('desc')
const page = ref(1)
const pageSize = 8

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
]
const sessionOptions = getSessionOptions()
const classLevelOptions = getClassLevelOptions()

const filteredAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let items = assessments.value.filter((assessment) => {
    const matchesSearch = query
      ? `${assessment.title} ${assessment.description}`.toLowerCase().includes(query)
      : true
    const matchesStatus = filterStatus.value ? assessment.status === filterStatus.value : true
    const matchesSession = filterSession.value ? assessment.sessionId === Number(filterSession.value) : true
    const matchesLevel = filterClassLevel.value ? assessment.classLevelId === Number(filterClassLevel.value) : true
    return matchesSearch && matchesStatus && matchesSession && matchesLevel
  })

  items.sort((a, b) => {
    const A = a[sortKey.value]
    const B = b[sortKey.value]
    if (A === B) return 0
    return sortDirection.value === 'asc' ? (A > B ? 1 : -1) : A > B ? -1 : 1
  })

  return items
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssessments.value.length / pageSize)))
const firstItem = computed(() => ((page.value - 1) * pageSize) + 1)
const lastItem = computed(() => Math.min(filteredAssessments.value.length, page.value * pageSize))
const pagedAssessments = computed(() => filteredAssessments.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const refreshAssessments = () => {
  assessments.value = getAllAssessments()
  if (page.value > totalPages.value) page.value = totalPages.value
}

const showModal = ref(false)
const activeAssessment = ref(null)

const openModal = (assessment) => {
  activeAssessment.value = assessment
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
  activeAssessment.value = null
}
const handleSubmit = (payload) => {
  // The trimmed modal only edits a subset of fields, so preserve everything
  // else on edit and provide sensible defaults for a brand-new assessment.
  const base = activeAssessment.value
    ? {}
    : { description: '', status: 'draft', sessionId: '', term: '', dueDate: '', dueTime: '' }
  saveAssessment({ ...base, ...payload })
  refreshAssessments()
  closeModal()
}

const createAssessment = () => openModal(null)
const viewAssessment = (assessment) => router.push(`/school-admin/assessments/${assessment.id}/submissions`)
const editAssessment = (assessment) => openModal(assessment)
const confirmDelete = (assessment) => {
  if (!window.confirm(`Delete ${assessment.title}? This will remove it from the mock assessment list.`)) return
  deleteAssessment(assessment.id)
  refreshAssessments()
}
const activateToggle = (assessment) => {
  toggleAssessmentStatus(assessment.id)
  refreshAssessments()
}
const copyAssessment = (assessment) => {
  duplicateAssessment(assessment.id)
  refreshAssessments()
}

const countSubmissions = (assessmentId) => getSubmissionsByAssessment(assessmentId).length
const actionItems = (assessment) => [
  { key: 'view', label: 'View Submissions', icon: null, onClick: () => viewAssessment(assessment) },
  { key: 'edit', label: 'Edit', icon: null, onClick: () => editAssessment(assessment) },
  { key: 'activate', label: assessment.status === 'active' ? 'Deactivate' : 'Activate', variant: assessment.status === 'active' ? 'danger' : 'success', onClick: () => activateToggle(assessment) },
  { key: 'duplicate', label: 'Duplicate', icon: null, onClick: () => copyAssessment(assessment) },
  { key: 'delete', label: 'Delete', variant: 'danger', onClick: () => confirmDelete(assessment) },
]
</script>
