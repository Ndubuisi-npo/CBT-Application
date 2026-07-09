<template>
  <div class="space-y-6 pb-10">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-6">
      <div class="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>

    <!-- Not found -->
    <AppEmptyState
      v-else-if="!teacher"
      :icon="UserX"
      title="Teacher not found"
      description="This teacher may have been removed, or the link is out of date."
    >
      <template #actions>
        <AppButton text="Back to Teachers" variant="primary" size="sm" @click="router.push('/school-admin/teachers')" />
      </template>
    </AppEmptyState>

    <template v-else>
      <!-- ── Header card ─────────────────────────────────────────────────── -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4 bg-gradient-to-r from-[#0B1F3A] to-[#0B1F3A]/80 px-5 pb-5 pt-6 sm:px-6">
          <div class="flex items-end gap-4">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-50 text-xl font-bold text-emerald-700 shadow-sm">
              {{ initials }}
            </div>
            <div class="pb-1">
              <h1 class="text-xl font-semibold tracking-tight text-white">{{ fullName }}</h1>
              <p class="mt-0.5 text-sm text-slate-200">{{ staffId }} &middot; {{ qualification }}</p>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2 pb-1">
            <AppButton :icon="Pencil" text="Edit" variant="outline" size="sm" @click="showEditDrawer = true" />
            <AppButton :icon="Ban" text="Suspend" variant="warning" size="sm" :processing="revoking" @click="handleSuspend" v-if="teacher.is_active !== false" />
            <AppButton :icon="Trash2" text="Delete" variant="danger" size="sm" :processing="deleting" @click="handleDelete" />
          </div>
        </div>
        <div class="px-5 pb-5 sm:px-6">
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <AppBadge :label="statusLabel" :variant="teacher.is_active !== false ? 'success' : 'danger'" dot />
          </div>

          <!-- Quick contact / meta row -->
          <div class="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Subject(s)</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ subjectSummary }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Class(es)</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ classSummary }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Department</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ department }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ email }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ phone }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date Joined</p>
              <p class="mt-0.5 truncate text-sm font-medium text-slate-700">{{ dateJoined }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Teaching statistics ─────────────────────────────────────────── -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AppStatCard label="Total Classes" :value="stats.totalClasses" :icon="School" icon-bg="bg-blue-50" icon-color="text-blue-600" />
        <AppStatCard label="Subjects" :value="stats.totalSubjects" :icon="BookOpen" icon-bg="bg-purple-50" icon-color="text-purple-600" />
        <AppStatCard label="Students" :value="stats.totalStudents" :icon="Users" icon-bg="bg-emerald-50" icon-color="text-emerald-600" />
        <AppStatCard label="Exams Created" value="—" sub="Not tracked yet" :icon="FileText" icon-bg="bg-amber-50" icon-color="text-amber-600" />
        <AppStatCard label="Questions Created" value="—" sub="Not tracked yet" :icon="HelpCircle" icon-bg="bg-rose-50" icon-color="text-rose-600" />
        <AppStatCard label="Results Published" value="—" sub="Not tracked yet" :icon="ClipboardCheck" icon-bg="bg-slate-100" icon-color="text-slate-600" />
      </div>

      <!-- ── Main grid ───────────────────────────────────────────────────── -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left column -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Personal Information -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Personal Information</h2>
            <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Full Name" :value="fullName" />
              <InfoField label="Username" :value="username" />
              <InfoField label="Email" :value="email" />
              <InfoField label="Phone" :value="phone" />
              <InfoField label="Gender" :value="gender" />
              <InfoField label="Date of Birth" :value="dob" />
              <InfoField label="Address" :value="address" class="sm:col-span-2" />
              <InfoField label="Emergency Contact" :value="emergencyContact" />
              <InfoField label="State" :value="state" />
              <InfoField label="Country" :value="country" />
            </dl>
          </section>

          <!-- Professional Information -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Professional Information</h2>
            <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Employee ID" :value="staffId" />
              <InfoField label="Department" :value="department" />
              <InfoField label="Subjects" :value="subjectSummary" />
              <InfoField label="Classes" :value="classSummary" />
              <InfoField label="Qualification" :value="qualification" />
              <InfoField label="Years of Experience" :value="yearsOfExperience" />
              <InfoField label="Employment Status" :value="statusLabel" />
              <InfoField label="Date Hired" :value="dateJoined" />
            </dl>
          </section>

          <!-- Assigned Subjects -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Assigned Subjects</h2>
            <div v-if="assignments.length" class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="asgn in assignments"
                :key="asgn.id"
                class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p class="text-sm font-semibold text-slate-900">{{ asgn.subjectName }}</p>
                <span class="inline-flex items-center rounded-full bg-[#0B1F3A]/8 px-2.5 py-0.5 text-xs font-semibold text-[#0B1F3A]">
                  {{ asgn.levelName }}
                </span>
              </div>
            </div>
            <p v-else class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              No subject assignments yet.
            </p>
          </section>

          <!-- Assigned Classes -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Assigned Classes</h2>
            <div v-if="classes.length" class="mt-4 grid gap-3 sm:grid-cols-2">
              <div v-for="cls in classes" :key="cls.id || cls.name" class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-sm font-semibold text-slate-900">{{ cls.name }}</p>
                <div class="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                  <span v-if="cls.levelName && cls.levelName !== 'Not provided'">{{ cls.levelName }}</span>
                  <span v-if="cls.studentCount !== 'Not provided'">{{ cls.studentCount }} students</span>
                  <span>{{ cls.subjectCount }} subject{{ cls.subjectCount === 1 ? '' : 's' }}</span>
                </div>
              </div>
            </div>
            <p v-else class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              No classes assigned yet.
            </p>
          </section>
        </div>

        <!-- Right column -->
        <div class="space-y-6">
          <!-- Recent Activity -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <div v-if="activitiesLoading" class="mt-4 space-y-3">
              <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <ol v-else-if="recentActivity.length" class="mt-4 space-y-4">
              <li v-for="(item, i) in recentActivity" :key="item.id || i" class="flex gap-3">
                <div class="flex flex-col items-center">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A]/8 text-[#0B1F3A]">
                    <component :is="activityIcon(item)" class="h-3.5 w-3.5" />
                  </span>
                  <span v-if="i < recentActivity.length - 1" class="mt-1 w-px flex-1 bg-slate-100" />
                </div>
                <div class="pb-4">
                  <p class="text-sm text-slate-700">{{ formatActivityDescription(item) }}</p>
                  <p class="mt-0.5 text-xs text-slate-400">{{ formatRelativeTime(item.created_at) }}</p>
                </div>
              </li>
            </ol>
            <p v-else class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              No recorded activity yet.
            </p>
          </section>

          <!-- Action bar -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-slate-900">Actions</h2>
            <div class="mt-4 space-y-2">
              <AppButton :icon="Pencil" text="Edit Teacher" variant="outline" full-width class="justify-start" @click="showEditDrawer = true" />
              <AppButton :icon="KeyRound" text="Reset Password" variant="outline" full-width class="justify-start" :processing="resettingPassword" @click="handleResetPassword" />
              <AppButton
                v-if="teacher.is_active !== false"
                :icon="Ban"
                text="Suspend Teacher"
                variant="warning"
                full-width
                class="justify-start"
                :processing="revoking"
                @click="handleSuspend"
              />
              <AppButton :icon="Trash2" text="Delete Teacher" variant="danger" full-width class="justify-start" :processing="deleting" @click="handleDelete" />
            </div>
          </section>
        </div>
      </div>
    </template>

    <TeacherFormDrawer :show="showEditDrawer" :teacher="teacher" :saving="savingTeacher" @close="showEditDrawer = false" @submit="handleUpdate" />
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Ban, BookOpen, ClipboardCheck, FileText, HelpCircle,
  KeyRound, Pencil, School, Trash2, UserX, Users,
} from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppStatCard from '../../shared/AppStatCard.vue'
import TeacherFormDrawer from '../components/TeacherFormDrawer.vue'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'
import { useActivities } from '../composables/useActivities'

// Tiny local component for a label/value pair in the info sections.
const InfoField = (props) => h('div', { class: props.class }, [
  h('dt', { class: 'text-[10px] font-semibold uppercase tracking-wide text-slate-400' }, props.label),
  h('dd', { class: 'mt-1 text-sm font-medium text-slate-700 break-words' }, props.value),
])
InfoField.props = ['label', 'value', 'class']

const route = useRoute()
const router = useRouter()
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()
const { fetchAllActivities, formatActivityDescription, getActivityIcon } = useActivities()

const NOT_PROVIDED = 'Not provided'
const displayValue = (v) => (v === null || v === undefined || v === '' ? NOT_PROVIDED : v)

const teacher = ref(null)
const loading = ref(true)
const showEditDrawer = ref(false)
const savingTeacher = ref(false)
const revoking = ref(false)
const deleting = ref(false)
const resettingPassword = ref(false)
const activitiesLoading = ref(false)
const teacherActivities = ref([])

const teacherId = computed(() => route.params.id)

const tp = computed(() => teacher.value?.teacherProfile || teacher.value?.teacher_profile || teacher.value?.profile || null)

const fullName = computed(() => {
  const t = teacher.value || {}
  return `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Teacher'
})
const initials = computed(() => fullName.value.split(' ').map((p) => p[0] || '').join('').toUpperCase().slice(0, 2) || 'NA')
const statusLabel = computed(() => (teacher.value?.is_active !== false ? 'Active' : 'Inactive'))
const email = computed(() => displayValue(teacher.value?.email || teacher.value?.user?.email))
const phone = computed(() => displayValue(teacher.value?.phone || teacher.value?.user?.phone))
const staffId = computed(() => displayValue(tp.value?.staff_id || tp.value?.staffId || teacher.value?.staff_id))
const qualification = computed(() => displayValue(tp.value?.qualification || teacher.value?.qualification))
const department = computed(() => displayValue(tp.value?.department || teacher.value?.department))
const dateJoined = computed(() => displayValue(tp.value?.date_joined || tp.value?.dateJoined || teacher.value?.created_at?.slice?.(0, 10)))
const username = computed(() => displayValue(teacher.value?.user?.username || teacher.value?.username))
const gender = computed(() => displayValue(tp.value?.gender || teacher.value?.gender))
const dob = computed(() => displayValue(tp.value?.date_of_birth || tp.value?.dob || teacher.value?.date_of_birth))
const address = computed(() => displayValue(tp.value?.address || teacher.value?.address))
const emergencyContact = computed(() => displayValue(tp.value?.emergency_contact || tp.value?.emergencyContact))
const state = computed(() => displayValue(tp.value?.state || teacher.value?.state))
const country = computed(() => displayValue(tp.value?.country || teacher.value?.country))
const yearsOfExperience = computed(() => displayValue(tp.value?.years_of_experience ?? tp.value?.yearsOfExperience))

// Assigned classes — merge assignedClasses with anything implied by teacherAssignments, de-duped.
const classes = computed(() => {
  const t = teacher.value
  if (!t) return []
  const direct = t.assignedClasses || t.assigned_classes || []
  const fromAsgn = (t.teacherAssignments || t.assignments || []).map((a) => a.class_level || a.class || null).filter(Boolean)
  const combined = [...direct, ...fromAsgn]
  const seen = new Map()
  combined.forEach((c) => {
    const key = c?.id || c?.name
    if (key && !seen.has(key)) {
      seen.set(key, {
        id: c.id,
        name: c.name || c.class_name || 'Untitled class',
        levelName: c.class_level?.name || c.class_level_name || NOT_PROVIDED,
        studentCount: c.student_count ?? c.studentCount ?? NOT_PROVIDED,
        subjectCount: (t.teacherAssignments || []).filter((a) => (a.class_level?.id || a.class_level_id) === c.id).length,
      })
    }
  })
  return Array.from(seen.values())
})

const assignments = computed(() => {
  const t = teacher.value
  if (!t) return []
  const src = t.teacherAssignments || t.assignments || t.assignedSubjects || []
  return src.map((a, i) => ({
    id: a.id || i,
    subjectName: a.subject?.name || a.subject_name || 'Unknown subject',
    levelName: a.class_level?.name || a.class_level_name || NOT_PROVIDED,
  }))
})

const subjectSummary = computed(() => {
  const names = [...new Set(assignments.value.map((a) => a.subjectName).filter((n) => n && n !== 'Unknown subject'))]
  return names.length ? names.join(', ') : NOT_PROVIDED
})
const classSummary = computed(() => {
  const names = classes.value.map((c) => c.name).filter(Boolean)
  return names.length ? names.join(', ') : NOT_PROVIDED
})

const stats = computed(() => {
  const numericStudentCounts = classes.value.map((c) => c.studentCount).filter((v) => typeof v === 'number')
  return {
    totalClasses: classes.value.length || 0,
    totalSubjects: new Set(assignments.value.map((a) => a.subjectName)).size || 0,
    totalStudents: numericStudentCounts.length ? numericStudentCounts.reduce((a, b) => a + b, 0) : '—',
  }
})

// Recent activity — filtered from the shared activity log to just this teacher.
const recentActivity = computed(() =>
  teacherActivities.value.filter((a) => a.entity_type === 'teacher' && String(a.details?.id) === String(teacherId.value)).slice(0, 8),
)

const activityIconMap = {
  Plus: () => h('span'), // fallback, replaced below via lucide import map if needed
}

import * as LucideIcons from 'lucide-vue-next'
const activityIcon = (item) => {
  const name = getActivityIcon(item.action_type)
  return LucideIcons[name] || LucideIcons.Activity
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

const loadTeacher = async () => {
  loading.value = true
  try {
    teacher.value = await teachersStore.fetchTeacher(teacherId.value)
  } catch (error) {
    teacher.value = null
    uiStore.addToast({ title: 'Error', message: error?.message || 'Failed to load teacher.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  activitiesLoading.value = true
  try {
    teacherActivities.value = await fetchAllActivities({ entity_type: 'teacher' })
  } catch (error) {
    teacherActivities.value = []
  } finally {
    activitiesLoading.value = false
  }
}

const handleUpdate = async (data) => {
  savingTeacher.value = true
  try {
    const { id, ...payload } = data
    await teachersStore.updateTeacher(id, payload)
    uiStore.addToast({ title: 'Teacher updated', message: 'Changes have been saved.', variant: 'success' })
    showEditDrawer.value = false
    await loadTeacher()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error?.response?.data?.message || error?.message || 'Failed to update teacher.', variant: 'error' })
  } finally {
    savingTeacher.value = false
  }
}

const handleSuspend = async () => {
  if (!window.confirm("Suspend this teacher's access? They will be moved to the archive.")) return
  revoking.value = true
  try {
    await teachersStore.revokeTeacher(teacher.value.id)
    uiStore.addToast({ title: 'Teacher suspended', message: 'This teacher has been moved to the archive.', variant: 'success' })
    router.push('/school-admin/teachers')
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error?.message || 'Failed to suspend teacher.', variant: 'error' })
  } finally {
    revoking.value = false
  }
}

const handleDelete = async () => {
  if (!window.confirm('Permanently delete this teacher? This cannot be undone.')) return
  deleting.value = true
  try {
    await teachersStore.deleteTeacherFromStore(teacher.value.id)
    uiStore.addToast({ title: 'Teacher deleted', message: 'The teacher record has been permanently deleted.', variant: 'success' })
    router.push('/school-admin/teachers')
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error?.message || 'Failed to delete teacher.', variant: 'error' })
  } finally {
    deleting.value = false
  }
}

const handleResetPassword = async () => {
  if (!window.confirm("Reset this teacher's password to the default?")) return
  resettingPassword.value = true
  try {
    await teachersStore.resetPassword(teacher.value.id)
  } finally {
    resettingPassword.value = false
  }
}

onMounted(() => {
  loadTeacher()
  loadActivities()
})
</script>
