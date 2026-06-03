<template>
  <div class="space-y-6">
    <!-- Hero banner -->
    <section>
      <div class="overflow-hidden rounded-[28px] bg-[#0B1F3A] text-white shadow-xl shadow-slate-900/10">
        <div class="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div class="space-y-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">Teacher Workspace</p>
              <h1 class="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {{ userName }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                You own the exam lifecycle: create exams, make them live, monitor progress, and end sessions when students are done.
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="action in quickActions"
                :key="action.label"
                type="button"
                class="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:border-[#D4AF37]/70 hover:bg-white/12"
                @click="goTo(action.to)"
              >
                <component :is="action.icon" class="h-5 w-5 text-[#D4AF37]" />
                <p class="mt-3 text-sm font-semibold">{{ action.label }}</p>
                <p class="mt-1 text-xs text-slate-300">{{ action.caption }}</p>
              </button>
            </div>
          </div>

          <!-- Stats summary -->
          <div class="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p class="text-sm font-medium text-slate-200">Exam Overview</p>
            <div class="mt-4 space-y-3 text-sm">
              <div v-if="teacherClassLevelName" class="flex items-center justify-between">
                <span class="text-slate-300">Class Scope</span>
                <span class="font-semibold text-white">{{ teacherClassLevelName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">Total Exams</span>
                <span class="font-semibold text-white">{{ examsStore.exams.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">Live Now</span>
                <span class="font-semibold text-emerald-400">{{ liveCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">Draft</span>
                <span class="font-semibold text-white">{{ countByStatus('draft') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-300">Concluded</span>
                <span class="font-semibold text-blue-300">{{ concludedCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Personal workload -->
    <SectionCard title="My Workload" subtitle="Subjects and classes from your current teacher assignments.">
      <div class="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="assignment in assignedWorkload"
          :key="assignment.key"
          class="rounded-[24px] border border-slate-200 p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{{ assignment.className || 'Class level' }}</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ assignment.subjectName || 'Subject' }}</h3>
        </div>
        <div v-if="!assignedWorkload.length" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
          No teaching assignments are attached to your profile yet.
        </div>
      </div>
    </SectionCard>

    <!-- Live exams -->
    <section v-if="liveExams.length">
      <SectionCard title="Live Exams" subtitle="These exams are currently active. Monitor student progress.">
        <div class="space-y-4 pt-6">
          <div
            v-for="exam in liveExams"
            :key="exam.id"
            class="rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
                </div>
                <p class="mt-1 text-sm text-slate-500">{{ exam.subject?.name || exam.subject || '—' }} • {{ exam.class_level?.name || '—' }} • {{ exam.class_arm?.name || '—' }}</p>
              </div>
              <div class="flex gap-2">
                <AppButton text="Monitor" variant="primary" size="sm" @click="goTo('/teachers/exams')" />
                <AppButton text="End Session" variant="danger" size="sm" @click="confirmEndSession(exam)" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>

    <!-- Concluded exams -->
    <section v-if="gradingExams.length">
      <SectionCard title="Concluded Exams" subtitle="These exams have ended and are ready for results review.">
        <div class="space-y-4 pt-6">
          <div
            v-for="exam in gradingExams"
            :key="exam.id"
            class="rounded-[24px] border border-amber-200 bg-amber-50/50 p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ exam.subject?.name || exam.subject || '—' }} • {{ exam.class_level?.name || '—' }} • {{ exam.class_arm?.name || '—' }}</p>
              </div>
              <div class="flex gap-2">
                <AppButton text="View Results" variant="outline" size="sm" @click="goTo('/teachers/exams')" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>

    <!-- Recent exams -->
    <SectionCard title="Recent Exams" subtitle="Your latest exams in any state.">
      <div class="space-y-4 pt-6">
        <div
          v-for="exam in recentExams"
          :key="exam.id"
          class="rounded-[24px] border border-slate-200 p-5 transition hover:border-[#D4AF37]/60"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="examsStore.getStatusClass(exam.status)">
                  {{ examsStore.getStatusLabel(exam.status) }}
                </span>
              </div>
              <p class="mt-2 text-sm text-slate-500">
                {{ exam.subject?.name || exam.subject || '—' }} • {{ exam.class_level?.name || '—' }} • {{ exam.class_arm?.name || '—' }} • {{ exam.duration_minutes || exam.duration || '—' }} min
              </p>
            </div>
            <AppButton text="Open" variant="outline" size="sm" @click="goTo('/teachers/exams')" />
          </div>
        </div>

        <div v-if="!recentExams.length && !examsStore.loading" class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No exams yet. Create your first exam to get started.
          <div class="mt-4">
            <AppButton :icon="Plus" text="Create Exam" variant="primary" @click="goTo('/teachers/exams')" />
          </div>
        </div>
      </div>
    </SectionCard>

    <!-- Confirm action modal -->
    <ConfirmModal
      v-if="pendingDashAction"
      :title="pendingDashAction.title"
      :message="pendingDashAction.message"
      :confirm-label="pendingDashAction.confirmLabel"
      :variant="pendingDashAction.variant"
      @confirm="runDashAction"
      @cancel="pendingDashAction = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, ClipboardCheck, FilePenLine, GraduationCap, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { getAuthUser } from '../../../js/lib/auth'

const router = useRouter()
const examsStore = useTeacherExamsStore()
const uiStore = useSchoolAdminUiStore()

const pendingDashAction = ref(null)

// ── User info ──────────────────────────────────────────────────────────────

const userName = computed(() => {
  const u = getAuthUser()
  return u?.name || u?.full_name || 'Teacher'
})

// ── Computed exam groups ────────────────────────────────────────────────────

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

const assignedWorkload = computed(() => {
  const assignments = getAuthUser()?.assigned_subjects || []
  return assignments.map((assignment, index) => {
    const subject = assignment.subject || assignment
    const classLevel = assignment.class_level || assignment.class || assignment.classLevel || {}
    return {
      key: assignment.id || `${subject.id || subject.name || index}-${classLevel.id || classLevel.name || index}`,
      subjectName: subject.name || assignment.subject_name || '',
      className: classLevel.name || assignment.class_level_name || '',
    }
  })
})

const recentExams = computed(() =>
  [...examsStore.exams]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 5),
)

// ── Quick actions ──────────────────────────────────────────────────────────

const quickActions = [
  { label: 'Manage Exams', caption: 'Create, start and end exams', to: '/teachers/exams', icon: ClipboardCheck },
  { label: 'Question Bank', caption: 'Build and manage your questions', to: '/teachers/questions', icon: FilePenLine },
  { label: 'Results', caption: 'View student scores', to: '/teachers/exams', icon: BookOpen },
  { label: 'Attendance', caption: 'Mark class attendance', to: '/teachers/attendance', icon: GraduationCap },
]

const goTo = (path) => router.push(path)

// ── Dashboard quick actions ─────────────────────────────────────────────────

const confirmEndSession = (exam) => {
  pendingDashAction.value = {
    examId: exam.id,
      action: 'end-session',
    title: `End Session — "${exam.title}"?`,
    message: 'All active student attempts will be force-submitted. This cannot be undone.',
    confirmLabel: 'End Session',
    variant: 'danger',
  }
}

const runDashAction = async () => {
  if (!pendingDashAction.value) return
  const { examId, action } = pendingDashAction.value
  pendingDashAction.value = null

  try {
    if (action === 'end-session') {
      await examsStore.endSession(examId)
      uiStore.addToast({ title: 'Session ended', variant: 'success' })
    }
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: err.message, variant: 'error' })
  }
}

// ── Load ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    await examsStore.fetchExams()
  } catch (err) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load exam data.', variant: 'error' })
  }
})
</script>
