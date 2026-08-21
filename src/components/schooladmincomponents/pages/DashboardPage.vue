<template>
  <div class="space-y-6">

    <!-- ── Welcome banner ─────────────────────────────────────────────────── -->
    <div class="overflow-hidden rounded-2xl bg-[#0B1F3A] text-white">
      <div class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">School Administration</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Good {{ timeOfDay }}, {{ adminName }}</h1>
          <p class="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Here's what's happening across your school today.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 sm:shrink-0">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-medium text-white transition hover:border-[#D4AF37]/60 hover:bg-white/12"
            @click="goTo(action.to)"
          >
            <component :is="action.icon" class="h-4 w-4 text-[#D4AF37]" />
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Stat cards ──────────────────────────────────────────────────────── -->
    <div data-tour="admin-stats-cards" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AppStatCard
        label="Total Students"
        :value="studentsStore.students?.length ?? 'N/A'"
        :loading="studentsStore.loading"
        :icon="GraduationCap"
        icon-bg="bg-blue-50"
        icon-color="text-blue-600"
        sub="Enrolled & active"
      />
      <AppStatCard
        label="Total Teachers"
        :value="teachersStore.teachers?.length ?? 'N/A'"
        :loading="teachersStore.loading"
        :icon="Users"
        icon-bg="bg-emerald-50"
        icon-color="text-emerald-600"
        sub="Staff members"
      />
      <AppStatCard
        label="Class Levels"
        :value="classLevelsStore.classLevels?.length ?? 'N/A'"
        :loading="classLevelsStore.loading"
        :icon="Columns3"
        icon-bg="bg-violet-50"
        icon-color="text-violet-600"
        sub="Academic levels"
      />
      <AppStatCard
        label="Subjects"
        :value="subjectsStore.subjects?.length ?? 'N/A'"
        :loading="subjectsStore.loading"
        :icon="Shapes"
        icon-bg="bg-amber-50"
        icon-color="text-amber-600"
        sub="Curriculum subjects"
      />
    </div>

    <!-- ── Main content grid ───────────────────────────────────────────────── -->
    <div class="grid gap-6 xl:grid-cols-3">

      <!-- Quick nav cards N/A 2/3 width -->
      <div class="xl:col-span-2 space-y-6">
        <section data-tour="admin-quick-nav" class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Quick Navigation</h2>
              <p class="mt-0.5 text-sm text-slate-500">Jump to the sections you manage most.</p>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="nav in navCards"
              :key="nav.label"
              type="button"
              class="group flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-[#D4AF37]/50 hover:bg-white hover:shadow-sm"
              @click="goTo(nav.to)"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="nav.iconBg">
                <component :is="nav.icon" class="h-5 w-5" :class="nav.iconColor" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 group-hover:text-[#0B1F3A]">{{ nav.label }}</p>
                <p class="mt-0.5 text-xs leading-5 text-slate-500">{{ nav.caption }}</p>
              </div>
              <ArrowRight class="ml-auto h-4 w-4 shrink-0 self-center text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#D4AF37]" />
            </button>
          </div>
        </section>

        <!-- Info notice -->
        <div class="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-5 py-4">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div>
            <p class="text-sm font-semibold text-blue-900">Assessments are a shared workflow</p>
            <p class="mt-1 text-sm text-blue-700">
              You create assessments and open them for teachers, who build submissions you then review and
              publish for students. As school admin, you also define the academic structure — classes, subjects,
              and sessions — that everything builds on.
            </p>
          </div>
        </div>
      </div>

      <!-- Activity sidebar N/A 1/3 width -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">System Summary</h2>
          <span class="text-xs text-slate-400">Now</span>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in summaryItems"
            :key="item.label"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="item.iconBg">
                <component :is="item.icon" class="h-4 w-4" :class="item.iconColor" />
              </div>
              <span class="text-sm font-medium text-slate-700">{{ item.label }}</span>
            </div>
            <span class="text-sm font-semibold text-slate-900">
              <span v-if="item.loading" class="inline-block h-4 w-8 animate-pulse rounded bg-slate-200" />
              <template v-else>{{ item.value }}</template>
            </span>
          </div>
        </div>

        <div class="mt-6 border-t border-slate-100 pt-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Shortcuts</p>
          <div class="space-y-1.5">
            <button
              v-for="link in shortcutLinks"
              :key="link.label"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              @click="goTo(link.to)"
            >
              <component :is="link.icon" class="h-4 w-4 text-slate-400" />
              {{ link.label }}
              <ChevronRight class="ml-auto h-3.5 w-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
   ArrowRight,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  Columns3,
  GraduationCap,
  Info,
  Shapes,
  UploadCloud,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import AppStatCard from '../../../components/shared/AppStatCard.vue'
import { useSchoolAdminStudentsStore } from '../stores/students'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { getDisplayName } from '../../../js/lib/auth'

const router = useRouter()
const studentsStore = useSchoolAdminStudentsStore()
const teachersStore = useSchoolAdminTeachersStore()
const classLevelsStore = useSchoolAdminClassLevelsStore()
const subjectsStore = useSchoolAdminSubjectsStore()

const adminName = computed(() => getDisplayName() || 'Admin')

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const quickActions = [
  { label: 'Add Teacher', to: '/school-admin/teachers', icon: UserPlus },
  { label: 'Add Student', to: '/school-admin/students', icon: GraduationCap },
  { label: 'Import', to: '/school-admin/students/import', icon: UploadCloud },
]

const navCards = [
  {
    label: 'Manage Teachers',
    caption: 'Add, edit, and manage your teaching staff.',
    to: '/school-admin/teachers',
    icon: Users,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Manage Students',
    caption: 'Enroll students, assign classes, and manage records.',
    to: '/school-admin/students',
    icon: GraduationCap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Academic Sessions',
    caption: 'Configure sessions, terms, and academic calendars.',
    to: '/school-admin/sessions',
    icon: CalendarRange,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Subjects',
    caption: 'Define subjects and assign them to teachers.',
    to: '/school-admin/subjects',
    icon: Shapes,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Class Levels',
    caption: 'Create class levels and arms for your school.',
    to: '/school-admin/class-levels',
    icon: Columns3,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
]

const summaryItems = computed(() => [
  {
    label: 'Students',
    value: studentsStore.students?.length ?? 'N/A',
    loading: studentsStore.loading,
    icon: GraduationCap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Teachers',
    value: teachersStore.teachers?.length ?? 'N/A',
    loading: teachersStore.loading,
    icon: Users,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Class Levels',
    value: classLevelsStore.classLevels?.length ?? 'N/A',
    loading: classLevelsStore.loading,
    icon: Columns3,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Subjects',
    value: subjectsStore.subjects?.length ?? 'N/A',
    loading: subjectsStore.loading,
    icon: Shapes,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
])

const shortcutLinks = [
  { label: 'Import Students', to: '/school-admin/students/import', icon: UploadCloud },
  { label: 'Import Teachers', to: '/school-admin/teachers/import', icon: UploadCloud },
  { label: 'School Settings', to: '/school-admin/settings', icon: Shapes },
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
