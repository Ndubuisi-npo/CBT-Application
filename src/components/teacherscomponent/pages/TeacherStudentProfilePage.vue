<template>
  <div class="space-y-6 pb-10">
    <div v-if="loading" class="space-y-6">
      <div class="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>

    <AppEmptyState
      v-else-if="!student"
      :icon="UserX"
      title="Student not found"
      description="This student may not be assigned to your classes, or the link is out of date."
    >
      <template #actions>
        <AppButton text="Back to Students" variant="primary" size="sm" @click="router.push({ name: 'TeachersStudentsPage' })" />
      </template>
    </AppEmptyState>

    <template v-else>
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4 bg-gradient-to-r from-[#0B1F3A] to-[#0B1F3A]/80 px-5 pb-5 pt-6 sm:px-6">
          <div class="flex items-end gap-4">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-50 text-xl font-bold text-emerald-700 shadow-sm">
              {{ initials }}
            </div>
            <div class="pb-1">
              <h1 class="text-xl font-semibold tracking-tight text-white">{{ fullName }}</h1>
              <p class="mt-0.5 text-sm text-slate-200">{{ admissionNumber }}</p>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2 pb-1">
            <AppButton :icon="BarChart2" text="View Exam Results" variant="primary" size="sm" @click="viewResults" />
            <AppButton text="Back to Students" variant="outline" size="sm" @click="router.push({ name: 'TeachersStudentsPage' })" />
          </div>
        </div>
        <div class="px-5 pb-5 sm:px-6">
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <AppBadge :label="statusLabel" :variant="student.is_active !== false ? 'success' : 'danger'" dot />
          </div>

          <div class="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Class</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ classArmName }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Arm</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ armOnly }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Session</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ session }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Parent Name</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ guardianName }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ email }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ phone }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AppStatCard label="Attendance Rate" value="—" sub="Not tracked yet" :icon="CalendarCheck" icon-bg="bg-blue-50" icon-color="text-blue-600" />
        <AppStatCard label="Days Present" value="—" sub="Not tracked yet" :icon="CalendarCheck" icon-bg="bg-blue-50" icon-color="text-blue-600" />
        <AppStatCard label="Exams Taken" value="—" sub="Not tracked yet" :icon="FileText" icon-bg="bg-amber-50" icon-color="text-amber-600" />
        <AppStatCard label="Average Score" value="—" sub="Not tracked yet" :icon="Percent" icon-bg="bg-purple-50" icon-color="text-purple-600" />
        <AppStatCard label="Highest Score" value="—" sub="Not tracked yet" :icon="TrendingUp" icon-bg="bg-emerald-50" icon-color="text-emerald-600" />
        <AppStatCard label="Pass Rate" value="—" sub="Not tracked yet" :icon="ClipboardCheck" icon-bg="bg-slate-100" icon-color="text-slate-600" />
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Personal Information</h2>
            <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Full Name" :value="fullName" />
              <InfoField label="Email" :value="email" />
              <InfoField label="Phone" :value="phone" />
              <InfoField label="Gender" :value="gender" />
              <InfoField label="Date of Birth" :value="dob" />
              <InfoField label="Blood Group" :value="bloodGroup" />
              <InfoField label="State of Origin" :value="stateOfOrigin" />
            </dl>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Academic Information</h2>
            <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Class" :value="classArmName" />
              <InfoField label="Arm" :value="armOnly" />
              <InfoField label="Session" :value="session" />
              <InfoField label="Admission Number" :value="admissionNumber" />
              <InfoField label="Enrollment Date" :value="admissionDate" />
            </dl>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Results</h2>
            <p class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              Result history is available from the Exam Results view. Use the action above to inspect this student’s full score history.
            </p>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Recent Exams</h2>
            <p class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              No recent exam history available yet.
            </p>
          </section>
        </div>

        <div class="space-y-6">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Parent / Guardian</h2>
            <dl class="mt-4 space-y-4">
              <InfoField label="Parent Name" :value="guardianName" />
              <InfoField label="Phone" :value="guardianPhone" />
              <InfoField label="Email" :value="guardianEmail" />
            </dl>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Actions</h2>
            <div class="mt-4 space-y-2">
              <AppButton :icon="BarChart2" text="View Exam Results" variant="primary" full-width class="justify-start" @click="viewResults" />
              <AppButton text="Back to Students" variant="outline" full-width class="justify-start" @click="router.push({ name: 'TeachersStudentsPage' })" />
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BarChart2, CalendarCheck, ClipboardCheck, FileText, Percent, TrendingUp, UserX } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppStatCard from '../../shared/AppStatCard.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getStudents } from '../../schooladmincomponents/services/api/students'
import { getAuthUser } from '../../../js/lib/auth'

const InfoField = (props) => h('div', [
  h('dt', { class: 'text-[10px] font-semibold uppercase tracking-wide text-slate-400' }, props.label),
  h('dd', { class: 'mt-1 text-sm font-medium text-slate-700 break-words' }, props.value),
])
InfoField.props = ['label', 'value']

const route = useRoute()
const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const NOT_PROVIDED = 'Not provided'
const displayValue = (v) => (v === null || v === undefined || v === '' ? NOT_PROVIDED : v)

const student = ref(null)
const loading = ref(true)

const sp = computed(() => student.value?.studentProfile || student.value?.student_profile || student.value?.profile || null)
const fullName = computed(() => {
  const t = student.value || {}
  const fn = t.first_name || t.user?.first_name || ''
  const ln = t.last_name || t.user?.last_name || ''
  return `${fn} ${ln}`.trim() || 'Student'
})
const initials = computed(() => fullName.value.split(' ').map((p) => p[0] || '').join('').toUpperCase().slice(0, 2) || 'NA')
const statusLabel = computed(() => (student.value?.is_active !== false ? 'Active' : 'Inactive'))
const email = computed(() => displayValue(student.value?.email || student.value?.user?.email))
const phone = computed(() => displayValue(student.value?.phone || student.value?.user?.phone))
const studentId = computed(() => displayValue(student.value?.id))
const gender = computed(() => displayValue(sp.value?.gender || student.value?.gender))
const dob = computed(() => displayValue(sp.value?.date_of_birth || sp.value?.dateOfBirth || student.value?.date_of_birth))
const bloodGroup = computed(() => displayValue(sp.value?.blood_group || sp.value?.bloodGroup))
const stateOfOrigin = computed(() => displayValue(sp.value?.state_of_origin || sp.value?.stateOfOrigin))
const admissionNumber = computed(() => displayValue(sp.value?.admission_number || sp.value?.admissionNumber || student.value?.admission_number))
const admissionDate = computed(() => displayValue(sp.value?.admission_date || sp.value?.admissionDate || student.value?.created_at?.slice?.(0, 10)))
const guardianName = computed(() => displayValue(sp.value?.guardian_name || sp.value?.guardianName))
const guardianPhone = computed(() => displayValue(sp.value?.guardian_phone || sp.value?.guardianPhone))
const guardianEmail = computed(() => displayValue(sp.value?.guardian_email || sp.value?.guardianEmail))
const session = computed(() => displayValue(sp.value?.academic_session?.name || sp.value?.session?.name || sp.value?.session_name))

const classArm = computed(() => sp.value?.class_arm || sp.value?.classArm || {})
const classLevel = computed(() => sp.value?.class_level || sp.value?.classLevel || classArm.value?.class_level || classArm.value?.classLevel || {})
const classArmName = computed(() => {
  const level = classLevel.value?.name
  const arm = classArm.value?.name
  if (level && arm) return `${level} ${arm}`
  return displayValue(level || arm)
})
const armOnly = computed(() => displayValue(classArm.value?.name))

const loadStudent = async () => {
  loading.value = true
  try {
    const user = getAuthUser()
    const params = user?.id ? { teacher_id: user.id } : {}
    const response = await getStudents(params)
    const list = Array.isArray(response) ? response : (response?.data || response?.students || [])
    student.value = list.find((s) => String(s.id) === String(route.params.id)) || null
  } catch (error) {
    student.value = null
    uiStore.addToast({ title: 'Error', message: error?.message || 'Failed to load student.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

const viewResults = () => {
  router.push({ name: 'TeacherStudentHistory', params: { studentId: student.value.id } })
}

onMounted(loadStudent)
</script>
