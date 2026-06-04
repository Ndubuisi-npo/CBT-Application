<template>
  <div class="space-y-6">
    <!-- Header -->
    <section>
      <div class="overflow-hidden rounded-[28px] bg-[#0B1F3A] text-white shadow-xl shadow-slate-900/10">
        <div class="p-6 lg:p-8">
          <p class="text-xs font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">School Administration</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {{ adminName }}</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
            Manage your school's teachers, students, classes, and academic structure.
            Exam management is handled entirely by teachers.
          </p>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              <template v-if="card.loading">
                <span class="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
              </template>
              <template v-else>{{ card.value }}</template>
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="card.bg">
            <component :is="card.icon" class="h-6 w-6" :class="card.color" />
          </div>
        </div>
      </div>
    </section>

    <!-- Quick actions (admin-only, no exam items) -->
    <SectionCard title="Quick Actions" subtitle="Common administrative tasks.">
      <div class="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#D4AF37]/60 hover:shadow-sm"
          @click="goTo(action.to)"
        >
          <component :is="action.icon" class="h-6 w-6 text-[#0B1F3A]" />
          <p class="mt-3 font-semibold text-slate-900">{{ action.label }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ action.caption }}</p>
        </button>
      </div>
    </SectionCard>

    <!-- Notice: exam management is teacher's job -->
    <div class="rounded-[20px] border border-blue-200 bg-blue-50 px-6 py-4">
      <div class="flex items-start gap-3">
        <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">i</div>
        <div>
          <p class="font-semibold text-blue-900">Exam management is handled by teachers</p>
          <p class="mt-1 text-sm text-blue-700">
            Teachers create, launch, monitor, and publish results for all exams directly from the Teacher Portal.
            School admins manage the academic structure (classes, subjects, sessions) that teachers use.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarRange, Columns3, GraduationCap, School, Shapes, Users } from 'lucide-vue-next'
import SectionCard from '../components/SectionCard.vue'
import { useSchoolAdminStudentsStore } from '../stores/students'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { getAuthUser } from '../../../js/lib/auth'

const router = useRouter()
const studentsStore = useSchoolAdminStudentsStore()
const teachersStore = useSchoolAdminTeachersStore()
const classLevelsStore = useSchoolAdminClassLevelsStore()
const subjectsStore = useSchoolAdminSubjectsStore()

const adminName = computed(() => {
  const u = getAuthUser()
  return u?.name || u?.full_name || 'Admin'
})

const statCards = computed(() => [
  {
    label: 'Total Students',
    value: studentsStore.students?.length ?? '—',
    loading: studentsStore.loading,
    icon: GraduationCap,
    bg: 'bg-blue-100',
    color: 'text-blue-600',
  },
  {
    label: 'Total Teachers',
    value: teachersStore.teachers?.length ?? '—',
    loading: teachersStore.loading,
    icon: Users,
    bg: 'bg-emerald-100',
    color: 'text-emerald-600',
  },
  {
    label: 'Class Levels',
    value: classLevelsStore.classLevels?.length ?? '—',
    loading: classLevelsStore.loading,
    icon: Columns3,
    bg: 'bg-amber-100',
    color: 'text-amber-600',
  },
  {
    label: 'Subjects',
    value: subjectsStore.subjects?.length ?? '—',
    loading: subjectsStore.loading,
    icon: Shapes,
    bg: 'bg-indigo-100',
    color: 'text-indigo-600',
  },
])

const quickActions = [
  { label: 'Manage Teachers', caption: 'Add, edit, and assign teachers', to: '/school-admin/teachers', icon: Users },
  { label: 'Manage Students', caption: 'Add, import, and organise students', to: '/school-admin/students', icon: GraduationCap },
  { label: 'Academic Sessions', caption: 'Set up sessions and terms', to: '/school-admin/sessions', icon: CalendarRange },
  { label: 'Subjects', caption: 'Define subjects and assign teachers', to: '/school-admin/subjects', icon: Shapes },
]

const goTo = (path) => router.push(path)

onMounted(async () => {
  await Promise.allSettled([
    studentsStore.fetchStudents?.(),
    teachersStore.fetchTeachers?.(),
    classLevelsStore.fetchClassLevels?.(),
    subjectsStore.fetchSubjects?.(),
  ])
})
</script>
