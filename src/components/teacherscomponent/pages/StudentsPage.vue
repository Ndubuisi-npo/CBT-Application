<template>
  <div class="space-y-6">

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
      <div v-if="loading" class="divide-y divide-slate-100">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4">
          <div class="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredStudents.length" class="px-5 py-16 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <GraduationCap class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">
          {{ searchQuery ? 'No students found' : 'No students assigned' }}
        </h3>
        <p class="mt-1.5 text-sm text-slate-500">
          {{ searchQuery ? 'Try a different search term.' : 'No students are currently assigned to your classes.' }}
        </p>
        <button
          v-if="searchQuery"
          class="mt-4 text-sm font-medium text-[#0B1F3A] underline"
          @click="searchQuery = ''"
        >Clear search</button>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
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
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="group transition hover:bg-slate-50/70"
            >
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
              <td class="px-5 py-3.5 text-sm text-slate-600">
                {{ getClassName(student) }}
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-600">
                {{ student.phone || student.user?.phone || 'N/A' }}
              </td>
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="student.is_active !== false
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-200'"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="student.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'"
                  />
                  {{ student.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <button
                  class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
                  @click="viewStudent(student)"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

    <!-- Student Detail Drawer -->
    <Teleport to="body">
      <Transition name="drawer-backdrop">
        <div
          v-if="drawerOpen"
          class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          @click="closeDrawer"
        />
      </Transition>
      <Transition name="drawer-panel">
        <div
          v-if="drawerOpen"
          class="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
        >
          <!-- Drawer header -->
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F3A]/10 text-xl font-bold text-[#0B1F3A]">
                {{ selectedStudent ? initials(selectedStudent) : '?' }}
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Student Profile</p>
                <h2 class="mt-0.5 text-xl font-semibold text-slate-900">{{ drawerFullName }}</h2>
                <span
                  class="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="selectedStudent?.is_active !== false
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-200'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="selectedStudent?.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'" />
                  {{ selectedStudent?.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              @click="closeDrawer"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Drawer body -->
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <div v-if="!selectedStudent" class="flex h-full items-center justify-center text-slate-400">
              No student selected.
            </div>
            <div v-else class="space-y-6">

              <!-- A. Personal Information -->
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Personal Information</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">First Name</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ selectedStudent.first_name || selectedStudent.user?.first_name || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Last Name</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ selectedStudent.last_name || selectedStudent.user?.last_name || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3 col-span-2">
                    <p class="text-xs font-medium text-slate-400">Email</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ selectedStudent.email || selectedStudent.user?.email || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Phone</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ selectedStudent.phone || selectedStudent.user?.phone || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Gender</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.gender || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Date of Birth</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.date_of_birth || 'N/A' }}</p>
                  </div>
                </div>
              </div>

              <!-- B. Academic Information -->
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Academic Information</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Admission Number</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.admission_number || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Admission Date</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.admission_date || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Class</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.class_arm?.name || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Class Level</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.class_arm?.class_level?.name || sp?.class_level?.name || 'N/A' }}</p>
                  </div>
                </div>
              </div>

              <!-- C. Guardian Information -->
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Guardian Information</p>
                <div v-if="sp?.guardian_name || sp?.guardian_email || sp?.guardian_phone" class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-slate-50 px-4 py-3 col-span-2">
                    <p class="text-xs font-medium text-slate-400">Guardian Name</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.guardian_name || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Guardian Email</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.guardian_email || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Guardian Phone</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.guardian_phone || 'N/A' }}</p>
                  </div>
                </div>
                <div v-else class="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                  No guardian information on file.
                </div>
              </div>

              <!-- D. Additional Information -->
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Additional Information</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">State of Origin</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.state_of_origin || 'N/A' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 px-4 py-3">
                    <p class="text-xs font-medium text-slate-400">Blood Group</p>
                    <p class="mt-0.5 text-xs font-semibold text-slate-900">{{ sp?.blood_group || 'N/A' }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="shrink-0 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="closeDrawer"
            >
              Close
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, GraduationCap, Search, X } from 'lucide-vue-next'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { getAuthUser } from '../../../js/lib/auth'

const uiStore = useSchoolAdminUiStore()

// ── State ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const allStudents = ref([])
const loading = ref(false)
const itemsPerPage = 10
const page = ref(1)
const drawerOpen = ref(false)
const selectedStudent = ref(null)

// ── Helpers ──────────────────────────────────────────────────────────────────
const initials = (s) => {
  const fn = s?.first_name || s?.user?.first_name || ''
  const ln = s?.last_name || s?.user?.last_name || ''
  return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?'
}

const getClassName = (student) => {
  const sp = student?.studentProfile || student?.student_profile
  return sp?.class_arm?.name || sp?.class_arm?.class_level?.name || sp?.class_name || 'N/A'
}

// Shorthand for selected student profile
const sp = computed(() => {
  if (!selectedStudent.value) return null
  return selectedStudent.value.studentProfile || selectedStudent.value.student_profile || null
})

const drawerFullName = computed(() => {
  if (!selectedStudent.value) return ''
  const fn = selectedStudent.value.first_name || selectedStudent.value.user?.first_name || ''
  const ln = selectedStudent.value.last_name || selectedStudent.value.user?.last_name || ''
  return `${fn} ${ln}`.trim()
})

// ── Filtered & paginated ─────────────────────────────────────────────────────
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

// ── Drawer ───────────────────────────────────────────────────────────────────
const viewStudent = (student) => {
  selectedStudent.value = student
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
  selectedStudent.value = null
}

// ── Load ─────────────────────────────────────────────────────────────────────
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

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active { transition: opacity 0.2s ease; }
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to { opacity: 0; }
.drawer-panel-enter-active,
.drawer-panel-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-panel-enter-from,
.drawer-panel-leave-to { transform: translateX(100%); }
</style>
