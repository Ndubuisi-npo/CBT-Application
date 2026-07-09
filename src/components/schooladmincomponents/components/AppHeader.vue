<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
    <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
      <!-- Left: mobile hamburger + breadcrumb/title -->
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] lg:hidden"
          @click="$emit('toggle-sidebar')"
          aria-label="Toggle sidebar"
        >
          <Menu class="h-5 w-5" />
        </button>

        <!-- Breadcrumb trail -->
        <nav v-if="breadcrumbs.length" class="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
          <template v-for="(crumb, index) in breadcrumbs" :key="`${crumb.label}-${index}`">
            <RouterLink
              v-if="crumb.to"
              :to="crumb.to"
              class="max-w-[180px] truncate font-medium text-slate-500 transition hover:text-[#0B1F3A]"
            >
              {{ crumb.label }}
            </RouterLink>
            <span v-else class="max-w-[220px] truncate font-semibold text-slate-900">{{ crumb.label }}</span>
            <ChevronRight v-if="index < breadcrumbs.length - 1" class="h-3.5 w-3.5 shrink-0 text-slate-300" />
          </template>
        </nav>
        <!-- Mobile: just page title -->
        <span class="truncate text-base font-semibold text-slate-900 sm:hidden">{{ pageTitle }}</span>
      </div>

      <!-- Right: profile -->
      <div class="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronRight, Menu } from 'lucide-vue-next'
import ProfileDropdown from './ProfileDropdown.vue'
import NotificationBell from '../../shared/NotificationBell.vue'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminStudentsStore } from '../stores/students'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const teachersStore = useSchoolAdminTeachersStore()
const studentsStore = useSchoolAdminStudentsStore()
const sessionsStore = useSchoolAdminSessionsStore()
const classLevelsStore = useSchoolAdminClassLevelsStore()

const isTeacher = computed(() => route.path.startsWith('/teachers'))
const rootLabel = computed(() => isTeacher.value ? 'Teacher Portal' : 'School Admin')
const rootPath = computed(() => isTeacher.value ? '/teachers/dashboard' : '/school-admin/dashboard')

const titles = {
  '/school-admin/dashboard': 'Dashboard',
  '/school-admin/sessions': 'Academic Sessions',
  '/school-admin/terms': 'Terms',
  '/school-admin/classes': 'Classes',
  '/school-admin/class-levels': 'Class Levels',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/teachers/import': 'Import Teachers',
  '/school-admin/students': 'Students',
  '/school-admin/students/import': 'Import Students',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/settings': 'Settings',
  '/school-admin/profile': 'Profile',
  '/school-admin/exams': 'Exam Approvals',
  '/school-admin/notifications': 'Notifications',
  '/teachers/dashboard': 'Dashboard',
  '/teachers/my-classes': 'My Classes',
  '/teachers/questions': 'Question Bank',
  '/teachers/exam-wizard': 'Exam Wizard',
  '/teachers/exams': 'My Exams',
  '/teachers/notifications': 'Notifications',
  '/teachers/students': 'Students',
  '/teachers/attendance': 'Attendance',
  '/teachers/grading': 'Grading',
  '/teachers/results': 'Results',
  '/teachers/settings': 'Settings',
  '/teachers/profile': 'Profile',
}

const currentTeacher = computed(() => {
  const id = route.params.id
  return teachersStore.teachers.find((teacher) => String(teacher.id) === String(id)) || null
})

const currentStudent = computed(() => {
  const id = route.params.id || route.params.studentId
  return studentsStore.students.find((student) => String(student.id) === String(id)) || null
})

const currentSession = computed(() => {
  const id = route.params.id
  return sessionsStore.sessions.find((session) => String(session.id) === String(id)) || null
})

const currentClassLevel = computed(() => {
  const id = route.params.id
  return classLevelsStore.classLevels.find((level) => String(level.id) === String(id)) || null
})

const currentTeacherName = computed(() => {
  const first = currentTeacher.value?.first_name || currentTeacher.value?.user?.first_name || ''
  const last = currentTeacher.value?.last_name || currentTeacher.value?.user?.last_name || ''
  return `${first} ${last}`.trim() || 'Teacher'
})

const currentStudentName = computed(() => {
  const first = currentStudent.value?.first_name || currentStudent.value?.user?.first_name || ''
  const last = currentStudent.value?.last_name || currentStudent.value?.user?.last_name || ''
  return `${first} ${last}`.trim() || 'Student'
})

const currentSessionName = computed(() => currentSession.value?.name || 'Session')
const currentClassLevelName = computed(() => currentClassLevel.value?.name || 'Class Level')

const pageTitle = computed(() => {
  if (route.path.startsWith('/school-admin/terms/')) return 'Terms'
  if (route.path.startsWith('/school-admin/classes/')) return 'Arms'
  return titles[route.path] || route.path.split('/').pop()?.replace(/-/g, ' ') || 'Home'
})

const breadcrumbs = computed(() => {
  const base = [{ label: rootLabel.value, to: rootPath.value }]

  if (route.path.startsWith('/school-admin/teachers/') && route.params.id) {
    return [
      ...base,
      { label: 'Teachers', to: '/school-admin/teachers' },
      { label: currentTeacherName.value },
    ]
  }

  if ((route.path.startsWith('/school-admin/students/') || route.path.startsWith('/teachers/students/')) && (route.params.id || route.params.studentId)) {
    const parentPath = route.path.startsWith('/school-admin') ? '/school-admin/students' : '/teachers/students'
    const currentLabel = currentStudentName.value
    if (route.path.includes('/results/')) {
      return [
        ...base,
        { label: 'Students', to: parentPath },
        { label: currentLabel, to: route.path.startsWith('/school-admin') ? `/school-admin/students/${route.params.studentId || route.params.id}` : `/teachers/students/${route.params.studentId || route.params.id}` },
        { label: 'Exam History', to: route.path.startsWith('/school-admin') ? `/school-admin/students/${route.params.studentId || route.params.id}/results` : `/teachers/students/${route.params.studentId || route.params.id}/results` },
        { label: 'Result Detail' },
      ]
    }

    if (route.path.includes('/results')) {
      return [
        ...base,
        { label: 'Students', to: parentPath },
        { label: currentLabel, to: route.path.startsWith('/school-admin') ? `/school-admin/students/${route.params.studentId || route.params.id}` : `/teachers/students/${route.params.studentId || route.params.id}` },
        { label: 'Exam History' },
      ]
    }

    return [
      ...base,
      { label: 'Students', to: parentPath },
      { label: currentLabel },
    ]
  }

  if (route.path.startsWith('/school-admin/terms/') && route.params.id) {
    return [
      ...base,
      { label: 'Academic Sessions', to: '/school-admin/sessions' },
      { label: currentSessionName.value },
      { label: 'Terms' },
    ]
  }

  if (route.path.startsWith('/school-admin/classes/') && route.params.id) {
    return [
      ...base,
      { label: 'Class Levels', to: '/school-admin/class-levels' },
      { label: currentClassLevelName.value },
      { label: 'Arms' },
    ]
  }

  if (route.path === '/teachers/students') {
    return [
      ...base,
      { label: 'Students' },
    ]
  }

  if (route.path === '/school-admin/students') {
    return [
      ...base,
      { label: 'Students' },
    ]
  }

  if (route.path === '/school-admin/teachers') {
    return [
      ...base,
      { label: 'Teachers' },
    ]
  }

  return [
    ...base,
    { label: pageTitle.value },
  ]
})

const ensureRouteData = async () => {
  const studentIdValue = route.params.id || route.params.studentId

  if (route.path.startsWith('/school-admin/teachers/') && route.params.id) {
    const hasTeacher = teachersStore.teachers.some((teacher) => String(teacher.id) === String(route.params.id))
    if (!hasTeacher) {
      await teachersStore.fetchTeacher(route.params.id)
    }
  }

  if ((route.path.startsWith('/school-admin/students/') || route.path.startsWith('/teachers/students/')) && studentIdValue) {
    const hasStudent = studentsStore.students.some((student) => String(student.id) === String(studentIdValue))
    if (!hasStudent) {
      await studentsStore.fetchStudent(studentIdValue)
    }
  }

  if (route.path.startsWith('/school-admin/terms/') && route.params.id) {
    if (!sessionsStore.sessions.length) {
      await sessionsStore.fetchSessions()
    }
  }

  if (route.path.startsWith('/school-admin/classes/') && route.params.id) {
    if (!classLevelsStore.classLevels.length) {
      await classLevelsStore.fetchClassLevels()
    }
  }
}

onMounted(() => {
  void ensureRouteData()
})

watch(() => route.fullPath, () => {
  void ensureRouteData()
})
</script>
