<template>
  <div data-tour="students-page" class="space-y-6">

    <!-- Page header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Teacher Portal</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Students</h1>
        <p class="mt-1 text-sm text-slate-500">Search and view students attached to your teaching classes.</p>
      </div>
    </div>

    <!-- Students table -->
    <section class="rounded-2xl border border-slate-200 bg-white">

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, admission no., class…"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#0B1F3A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">{{ filteredStudents.length }} student{{ filteredStudents.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="hidden divide-y divide-slate-100 lg:block">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4">
          <div class="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div v-if="loading" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <!-- Empty -->
      <AppEmptyState
        v-else-if="!filteredStudents.length"
        :icon="GraduationCap"
        :title="searchQuery ? 'No students found' : 'No students assigned'"
        :description="searchQuery ? 'Try a different search term.' : 'No students are currently assigned to your classes.'"
        class="m-4 border-0"
      >
        <template v-if="searchQuery" #actions>
          <AppButton text="Clear Search" variant="outline" size="sm" @click="searchQuery = ''" />
        </template>
      </AppEmptyState>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Admission No.</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Class</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="student in paginatedStudents" :key="student.id" class="group transition hover:bg-slate-50/70">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A]/10 text-xs font-semibold text-[#0B1F3A]">
                      {{ initials(student) }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">
                        {{ student.first_name || student.user?.first_name || '' }}
                        {{ student.last_name || student.user?.last_name || '' }}
                      </p>
                      <p class="text-xs text-slate-500">{{ student.email || student.user?.email || 'N/A' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-600">
                  {{ student.studentProfile?.admission_number || student.student_profile?.admission_number || 'N/A' }}
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ getClassName(student) }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ student.phone || student.user?.phone || 'N/A' }}</td>
                <td class="px-5 py-3.5">
                  <AppBadge :label="student.is_active !== false ? 'Active' : 'Inactive'" :variant="student.is_active !== false ? 'success' : 'danger'" dot />
                </td>
                <td class="px-5 py-3.5">
                  <ResponsiveTableActions :actions="studentActions(student)" :entity-label="studentFullName(student)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="student in paginatedStudents"
            :key="student.id"
            :avatar-text="initials(student)"
            avatar-color="bg-[#0B1F3A]/10 text-[#0B1F3A]"
            :title="studentFullName(student)"
            :subtitle="student.email || student.user?.email || 'N/A'"
            :fields="[
              { label: 'Admission No.', value: student.studentProfile?.admission_number || student.student_profile?.admission_number || 'N/A' },
              { label: 'Phone', value: student.phone || student.user?.phone || 'N/A' },
              { label: 'Class', value: getClassName(student), span: 2 },
            ]"
            clickable
            @click="viewStudent(student)"
          >
            <template #badge>
              <AppBadge :label="student.is_active !== false ? 'Active' : 'Inactive'" :variant="student.is_active !== false ? 'success' : 'danger'" dot />
            </template>
            <template #actions>
              <ResponsiveTableActions :actions="studentActions(student)" :entity-label="studentFullName(student)" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>

      <!-- Pagination -->
      <div v-if="filteredStudents.length > itemsPerPage" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">
          Showing {{ startIndex }}–{{ endIndex }} of {{ filteredStudents.length }}
        </p>
        <div class="flex items-center gap-1.5">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page === 1"
            @click="page--"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ page }} / {{ totalPages }}</span>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page === totalPages"
            @click="page++"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart2, ChevronLeft, ChevronRight, Eye, GraduationCap, Search } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { getAuthUser } from '../../../js/lib/auth'

const uiStore = useSchoolAdminUiStore()
const router = useRouter()

const searchQuery = ref('')
const allStudents = ref([])
const loading = ref(false)
const itemsPerPage = 10
const page = ref(1)

const initials = (s) => {
  const fn = s?.first_name || s?.user?.first_name || ''
  const ln = s?.last_name || s?.user?.last_name || ''
  return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?'
}

const studentFullName = (s) => {
  const fn = s?.first_name || s?.user?.first_name || ''
  const ln = s?.last_name || s?.user?.last_name || ''
  return `${fn} ${ln}`.trim() || 'Student'
}

const getClassName = (student) => {
  const sp = student?.studentProfile || student?.student_profile
  return sp?.class_arm?.name || sp?.class_arm?.class_level?.name || sp?.class_name || 'N/A'
}

const studentActions = (student) => [
  { key: 'view', label: 'View', icon: Eye, onClick: () => viewStudent(student) },
  { key: 'results', label: 'Results', icon: BarChart2, onClick: () => viewResults(student) },
]

const filteredStudents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return allStudents.value
  return allStudents.value.filter((s) => {
    const profile = s.studentProfile || s.student_profile
    const name = `${s.first_name || s.user?.first_name || ''} ${s.last_name || s.user?.last_name || ''}`.toLowerCase()
    const email = (s.email || s.user?.email || '').toLowerCase()
    const admNo = (profile?.admission_number || '').toLowerCase()
    const cls = (profile?.class_arm?.name || profile?.class_name || '').toLowerCase()
    return name.includes(q) || email.includes(q) || admNo.includes(q) || cls.includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / itemsPerPage)))
const paginatedStudents = computed(() =>
  filteredStudents.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
)
const startIndex = computed(() =>
  filteredStudents.value.length ? (page.value - 1) * itemsPerPage + 1 : 0,
)
const endIndex = computed(() =>
  Math.min(page.value * itemsPerPage, filteredStudents.value.length),
)

watch(searchQuery, () => { page.value = 1 })
watch(totalPages, (t) => { if (page.value > t) page.value = t })

const viewStudent = (student) => {
  router.push({ name: 'TeacherStudentProfile', params: { id: student.id } })
}

const viewResults = (student) => {
  router.push({ name: 'TeacherStudentHistory', params: { studentId: student.id } })
}

const loadStudents = async () => {
  loading.value = true
  try {
    const user = getAuthUser()
    const params = user?.id ? { teacher_id: user.id } : {}
    const response = await getStudents(params)
    allStudents.value = Array.isArray(response) ? response : (response?.data || response?.students || [])
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err?.message || 'Failed to load students.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(loadStudents)
</script>
