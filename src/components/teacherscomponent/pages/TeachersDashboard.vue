<template>
  <div class="space-y-6">

    <!-- Welcome banner -->
    <div class="overflow-hidden rounded-2xl bg-[#0B1F3A] text-white">
      <div class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Teacher Workspace</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good {{ timeOfDay }}, {{ userName }}
          </h1>
          <p class="mt-2 max-w-md text-sm leading-6 text-slate-300">
            You own the full exam lifecycle N/A create, launch, and publish results directly from here.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 sm:shrink-0">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:border-[#D4AF37]/60 hover:bg-white/20"
            @click="goTo(action.to)"
          >
            <component :is="action.icon" class="h-4 w-4 text-[#D4AF37]" />
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stat cards N/A fixed responsive grid -->
    <div data-tour="teacher-stats-cards" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <ClipboardList class="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Exams</p>
          <p class="mt-1 text-2xl font-bold text-slate-900">
            <span v-if="examsStore.loading" class="inline-block h-7 w-12 animate-pulse rounded-lg bg-slate-100" />
            <template v-else>{{ examsStore.exams.length }}</template>
          </p>
          <p class="text-xs text-slate-400">All time</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Zap class="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Now</p>
          <p class="mt-1 text-2xl font-bold text-emerald-600">
            <span v-if="examsStore.loading" class="inline-block h-7 w-12 animate-pulse rounded-lg bg-slate-100" />
            <template v-else>{{ liveCount }}</template>
          </p>
          <p class="text-xs text-slate-400">Currently active</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <FilePen class="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Drafts</p>
          <p class="mt-1 text-2xl font-bold text-amber-700">
            <span v-if="examsStore.loading" class="inline-block h-7 w-12 animate-pulse rounded-lg bg-slate-100" />
            <template v-else>{{ countByStatus('draft') }}</template>
          </p>
          <p class="text-xs text-slate-400">Pending submission</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50">
          <CheckCircle2 class="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Concluded</p>
          <p class="mt-1 text-2xl font-bold text-violet-700">
            <span v-if="examsStore.loading" class="inline-block h-7 w-12 animate-pulse rounded-lg bg-slate-100" />
            <template v-else>{{ concludedCount }}</template>
          </p>
          <p class="text-xs text-slate-400">Awaiting review</p>
        </div>
      </div>
    </div>

    <!-- Main content grid -->
    <div class="grid gap-6 xl:grid-cols-3">

      <!-- Left: exam sections N/A 2/3 -->
      <div class="space-y-6 xl:col-span-2">

        <!-- Live exams -->
        <section v-if="liveExams.length" class="rounded-2xl border border-emerald-200 bg-white p-6">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <h2 class="text-lg font-semibold text-slate-900">Live Exams</h2>
            <span class="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {{ liveExams.length }}
            </span>
          </div>
          <div class="space-y-3">
            <div
              v-for="exam in liveExams"
              :key="exam.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
            >
              <div>
                <p class="font-semibold text-slate-900">{{ exam.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ getExamSubjectName(exam) }} · {{ getExamClassLevelName(exam) }}
                </p>
              </div>
              <AppButton text="Monitor" variant="primary" size="sm" @click="goTo('/teachers/exams')" />
            </div>
          </div>
        </section>

        <!-- Needs review -->
        <section v-if="gradingExams.length" class="rounded-2xl border border-amber-200 bg-white p-6">
          <div class="mb-4 flex items-center gap-3">
            <h2 class="text-lg font-semibold text-slate-900">Needs Review</h2>
            <span class="ml-auto inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              {{ gradingExams.length }}
            </span>
          </div>
          <div class="space-y-3">
            <div
              v-for="exam in gradingExams"
              :key="exam.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3"
            >
              <div>
                <p class="font-semibold text-slate-900">{{ exam.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ getExamSubjectName(exam) }} · {{ getExamClassLevelName(exam) }}
                </p>
              </div>
              <AppButton text="View Results" variant="outline" size="sm" @click="goTo('/teachers/students')" />
            </div>
          </div>
        </section>

        <!-- Recent Exams -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Recent Exams</h2>
            <AppButton text="View All" variant="ghost" size="sm" @click="goTo('/teachers/exams')" />
          </div>

          <div v-if="examsStore.loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div v-else-if="!recentExams.length" class="py-10 text-center">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <ClipboardList class="h-6 w-6 text-slate-400" />
            </div>
            <p class="mt-4 text-sm font-semibold text-slate-900">No exams yet</p>
            <p class="mt-1 text-sm text-slate-500">Create your first exam to get started.</p>
            <div class="mt-4">
              <AppButton :icon="Plus" text="Create Exam" variant="primary" size="sm" @click="goTo('/teachers/exams')" />
            </div>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="exam in recentExams"
              :key="exam.id"
              class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate font-medium text-slate-900">{{ exam.title }}</p>
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="statusBadgeClass(exam.status)"
                  >
                    {{ examsStore.getStatusLabel(exam.status) }}
                  </span>
                </div>
                <p class="mt-0.5 truncate text-xs text-slate-500">
                  {{ getExamSubjectName(exam) }} · {{ getExamClassLevelName(exam) }} · {{ exam.duration_minutes || exam.duration || 'N/A' }} min
                </p>
              </div>
              <AppButton text="Open" variant="outline" size="sm" @click="goTo('/teachers/exams')" />
            </div>
          </div>
        </section>
      </div>

      <!-- Right panel N/A 1/3 -->
      <div class="space-y-6">
        <!-- Scope summary -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Your Scope</h2>
          <div class="space-y-2">
            <div v-if="teacherClassLevelName" class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span class="text-sm text-slate-500">Class Level</span>
              <span class="text-sm font-semibold text-slate-900">{{ teacherClassLevelName }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span class="text-sm text-slate-500">Total Exams</span>
              <span class="text-sm font-semibold text-slate-900">{{ examsStore.exams.length }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <span class="text-sm text-emerald-700">Live</span>
              <span class="text-sm font-semibold text-emerald-700">{{ liveCount }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span class="text-sm text-slate-500">Draft</span>
              <span class="text-sm font-semibold text-slate-900">{{ countByStatus('draft') }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span class="text-sm text-slate-500">Concluded</span>
              <span class="text-sm font-semibold text-slate-900">{{ concludedCount }}</span>
            </div>
          </div>
        </section>

        <!-- Quick Links -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Quick Links</h2>
          <div class="space-y-1">
            <button
              v-for="link in shortcutLinks"
              :key="link.label"
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              @click="goTo(link.to)"
            >
              <component :is="link.icon" class="h-4 w-4 text-slate-400" />
              {{ link.label }}
              <ChevronRight class="ml-auto h-4 w-4 text-slate-300" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FilePen,
  FileQuestion,
  Plus,
  Users,
  Zap,
} from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser, getDisplayName } from '../../../js/lib/auth'

const router = useRouter()
const examsStore = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const userName = computed(() => getDisplayName() || 'Teacher')

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const countByStatus = (status) =>
  examsStore.exams.filter((e) => (e.status || '').toLowerCase() === status).length

const liveCount = computed(() =>
  examsStore.exams.filter((e) => ['live', 'active'].includes((e.status || '').toLowerCase())).length,
)

const liveExams = computed(() =>
  examsStore.exams.filter((e) => ['live', 'active'].includes((e.status || '').toLowerCase())),
)

const gradingExams = computed(() =>
  examsStore.exams.filter((e) => ['concluded', 'grading', 'completed'].includes((e.status || '').toLowerCase())),
)

const concludedCount = computed(() => gradingExams.value.length)

const teacherClassLevelName = computed(() => getAuthUser()?.teacher_profile?.class_level?.name || '')

const getExamSubjectName = (exam) => exam?.subject?.name || exam?.subject_name || 'N/A'
const getExamClassLevelName = (exam) => exam?.class_level?.name || exam?.classLevel?.name || exam?.class_level_name || 'N/A'

const recentExams = computed(() =>
  [...examsStore.exams]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 5),
)

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (['live', 'active'].includes(s)) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  if (['draft', 'pending'].includes(s)) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  if (['concluded', 'completed', 'grading'].includes(s)) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
  if (s === 'rejected') return 'bg-red-50 text-red-700 ring-1 ring-red-200'
  return 'bg-slate-100 text-slate-700'
}

const quickActions = [
  { label: 'Create Exam', to: '/teachers/exams', icon: ClipboardList },
  { label: 'Question Bank', to: '/teachers/questions', icon: FileQuestion },
  { label: 'Students', to: '/teachers/students', icon: Users },
]

const shortcutLinks = [
  { label: 'All Exams', to: '/teachers/exams', icon: ClipboardList },
  { label: 'Question Bank', to: '/teachers/questions', icon: FileQuestion },
  { label: 'My Students', to: '/teachers/students', icon: Users },
  { label: 'Settings', to: '/teachers/settings', icon: FilePen },
]

const goTo = (path) => router.push(path)

onMounted(async () => {
  try {
    await examsStore.fetchExams()
  } catch {
    uiStore.addToast({ title: 'Error', message: 'Failed to load exam data.', variant: 'error' })
  }
})
</script>
