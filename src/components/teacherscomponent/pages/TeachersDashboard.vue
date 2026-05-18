<template>
  <div class="space-y-6">
    <section>
      <div class="overflow-hidden rounded-[28px] bg-[#0B1F3A] text-white shadow-xl shadow-slate-900/10">
        <div class="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div class="space-y-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">Teacher Workspace</p>
              <h1 class="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {{ teacherProfile.name }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Your classes are on track for the week. Focus today: close attendance gaps, moderate theory scripts, and keep the
                live revision exam stable for SS3 Science.
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

          <div class="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-200">Profile Summary</p>
                <h2 class="mt-2 text-xl font-semibold">{{ teacherProfile.role }}</h2>
                <p class="mt-1 text-sm text-slate-300">{{ teacherProfile.staffId }}</p>
              </div>
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-lg font-semibold text-[#0B1F3A]">
                {{ teacherProfile.avatar }}
              </div>
            </div>

            <div class="mt-5 space-y-3 text-sm text-slate-200">
              <div class="flex items-center justify-between">
                <span>School</span>
                <span class="font-medium text-white">{{ teacherProfile.school }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Campus</span>
                <span class="font-medium text-white">{{ teacherProfile.campus }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Class Teacher</span>
                <span class="font-medium text-white">{{ teacherProfile.classTeacher }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Attendance capture</span>
                <span class="font-medium text-white">{{ teacherStats[4].value }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Last login</span>
                <span class="font-medium text-white">{{ lastLoginLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="card in teacherStats"
        :key="card.label"
        class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{{ card.value }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="toneClass(card.tone)">
            <component :is="iconForCard(card.label)" :class="['h-6 w-6', iconColorClass(card.tone)]" />
          </div>
        </div>
        <p class="mt-4 text-sm text-slate-500">{{ card.change }}</p>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="Assigned Subjects & Classes" subtitle="A quick view of your current teaching load.">
        <div class="grid gap-4 pt-6 lg:grid-cols-2">
          <div v-for="subject in assignedSubjects" :key="subject.name" class="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">{{ subject.name }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ subject.weeklyPeriods }} periods this week</p>
              </div>
              <span class="rounded-full bg-[#0B1F3A] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {{ subject.questionCount }} questions
              </span>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                {{ teacherProfile.classTeacher }}
              </span>
            </div>
            <div class="mt-5 rounded-2xl bg-white p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next assessment</p>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ subject.upcomingExam }}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Activities" subtitle="Everything you have touched most recently.">
        <div class="space-y-5 pt-6">
          <div v-for="activity in recentActivities" :key="activity.id" class="flex gap-4">
            <div class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F3A]/8 text-[#0B1F3A]">
              <Clock3 class="h-5 w-5" />
            </div>
            <div class="flex-1 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-900">{{ activity.title }}</p>
                <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ activity.time }}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ activity.description }}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>

    <section class=gap-6>
      <SectionCard title="Upcoming Assessments" subtitle="Scheduled, published, and draft assessments in your queue.">
        <div class="space-y-4 pt-6">
          <div
            v-for="exam in upcomingExams"
            :key="exam.id"
            class="rounded-[24px] border border-slate-200 p-5 transition hover:border-[#D4AF37]/70 hover:shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(exam.status)">{{ exam.status }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-500">{{ exam.subject }} • {{ exam.className }} • {{ exam.questions }} questions</p>
              </div>
              <button type="button" class="text-sm font-semibold text-[#0B1F3A] hover:text-[#D4AF37]" @click="goTo('/teachers/exams')">
                Open assessment
              </button>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                <p class="mt-2 text-sm font-medium text-slate-900">{{ formatDateTime(exam.date) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                <p class="mt-2 text-sm font-medium text-slate-900">{{ exam.duration }} minutes</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Candidates</p>
                <p class="mt-2 text-sm font-medium text-slate-900">{{ exam.candidates }} students</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, ClipboardCheck, Clock3, FilePenLine, GraduationCap, Users, Zap, Library, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import {
  assignedSubjects,
  classOverview,
  notifications,
  recentActivities,
  teacherProfile,
  teacherStats,
  upcomingExams,
  formatHumanDate,
} from '../data/mockTeacherData'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const quickActions = [
  { label: 'Assessments', caption: 'Browse admin-created assessments', to: '/teachers/exams', icon: ClipboardCheck },
  { label: 'Add Questions', caption: 'Expand your question bank', to: '/teachers/questions', icon: FilePenLine },
  { label: 'Grade Scripts', caption: 'Continue pending theory marking', to: '/teachers/grading', icon: BookOpen },
  { label: 'Take Attendance', caption: 'Capture today’s class register', to: '/teachers/attendance', icon: GraduationCap },
]

const lastLoginLabel = computed(() =>
  formatHumanDate(teacherProfile.lastLogin, { hour: 'numeric', minute: '2-digit' }),
)

const goTo = (to) => router.push(to)

const toneClass = (tone) => {
  const tones = {
    blue: 'bg-blue-100',
    emerald: 'bg-emerald-100',
    amber: 'bg-amber-100',
    rose: 'bg-rose-100',
    indigo: 'bg-indigo-100',
  }
  return tones[tone] || 'bg-slate-100'
}

const iconColorClass = (tone) => {
  const colors = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    indigo: 'text-indigo-600',
  }
  return colors[tone] || 'text-slate-600'
}

const iconForCard = (label) => {
  const icons = {
    'Total Students': Users,
    'Active Exams': Zap,
    'Question Bank Count': Library,
    'Pending Auto-Graded Scripts': AlertCircle,
    'Attendance Completion': CheckCircle2,
  }
  return icons[label]
}

const statusClass = (status) => {
  const classes = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Draft: 'bg-slate-200 text-slate-700',
    Published: 'bg-emerald-100 text-emerald-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

const formatDateTime = (value) =>
  formatHumanDate(value, { hour: 'numeric', minute: '2-digit' })

const handleNotification = (notification) => {
  const routeMap = {
    'Open Grading': '/teachers/grading',
    'Monitor Exam': '/teachers/exams',
    'Take Attendance': '/teachers/attendance',
  }
  uiStore.addToast({
    title: notification.title,
    message: 'Opening the related workspace for follow-up.',
    variant: notification.priority === 'high' ? 'error' : 'success',
  })
  goTo(routeMap[notification.action] || '/teachers/dashboard')
}
</script>
