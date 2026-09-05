<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment schedule"
      subtitle="Plan assessments on the calendar, then move straight into submission windows and exam slots."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="New assessment" variant="primary" size="sm" :icon="Plus" @click="openNewAssessment" />
      </template>
    </AppPageHeader>

    <div class="-mt-2 mb-2 flex flex-wrap items-center gap-2">
      <AppBadge v-if="assessmentStore.activeTermLabel" :label="`Active Term (${assessmentStore.activeTermLabel})`" variant="success" />
      <AppBadge :label="`${scheduledAssessments.length} assessments this session`" variant="primary" />
    </div>

    <section v-if="unscheduledAssessments.length" class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Needs scheduling</p>
          <h2 class="mt-1 text-lg font-semibold text-slate-900">{{ unscheduledAssessments.length }} assessment{{ unscheduledAssessments.length === 1 ? '' : 's' }} without a date</h2>
          <p class="mt-1 text-sm text-slate-600">These assessments were created successfully but do not have a submission window yet.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton
            v-for="assessment in unscheduledAssessments"
            :key="assessment.id"
            :text="assessment.title"
            variant="outline"
            size="xs"
            @click="openAssessmentForScheduling(assessment)"
          />
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="min-w-0 p-4 sm:p-6">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Academic Session</p>
            <h2 class="mt-1 text-4xl font-light tracking-tight text-[#0B1F3A] sm:text-5xl">{{ monthLabel }}</h2>
            <p class="mt-2 text-sm text-slate-500">{{ assessmentsThisMonth.length }} assessments this month · select a date to plan it</p>
          </div>
          <div class="flex items-center gap-2">
            <AppButton text="Today" variant="outline" size="sm" @click="goToday" />
            <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
            <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Next month" @click="shiftMonth(1)">›</button>
          </div>
        </div>

        <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200">
          <div v-for="day in weekdays" :key="day" class="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 last:border-r-0">
            {{ day }}
          </div>
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            type="button"
            class="group relative min-h-[116px] border-r border-b border-slate-200 p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
            :class="[cell.isCurrentMonth ? 'bg-white' : 'bg-[#FBFAF7] text-slate-400', isSelected(cell.dateKey) ? 'bg-[#0B1F3A]/5 ring-1 ring-inset ring-[#0B1F3A]/20' : '']"
            :style="cell.tintColor ? { backgroundColor: `rgba(${cell.tintColor}, 0.07)` } : {}"
            :aria-label="`Select ${cell.label}`"
            @click="selectCell(cell)"
            @mouseenter="hoveredCell = cell.dateKey"
            @mouseleave="hoveredCell === cell.dateKey && (hoveredCell = '')"
          >
            <div class="flex items-start justify-between gap-2">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                :class="[
                  cell.isToday ? 'bg-[#D4AF37] text-[#0B1F3A]' : '',
                  isSelected(cell.dateKey) ? 'bg-[#0B1F3A] text-white' : '',
                  !cell.isToday && !isSelected(cell.dateKey) ? 'text-slate-700' : '',
                ]"
              >
                {{ cell.day }}
              </span>
              <span v-if="cell.assessments.length" class="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#0B1F3A]/60">{{ cell.assessments.length }}</span>
            </div>
            <div class="mt-2 space-y-1.5">
              <button
                v-for="assessment in cell.previewAssessments"
                :key="assessment.id"
                type="button"
                class="flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-[11px] text-slate-700 transition hover:border-[#D4AF37]/40"
                :style="{
                  borderColor: `rgba(${hexToRgb(scheduleColor(assessment))}, 0.35)`,
                  backgroundColor: `rgba(${hexToRgb(scheduleColor(assessment))}, 0.08)`,
                }"
                @click.stop="openAssessment(assessment)"
              >
                <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
                <span class="min-w-0 flex-1 truncate">
                  <span class="font-semibold text-[#0B1F3A]">{{ assessment.startTime }}</span>
                  {{ assessment.title || 'Assessment' }}
                </span>
              </button>
              <p v-if="cell.moreCount" class="text-[11px] font-medium text-slate-500">+{{ cell.moreCount }} more</p>
            </div>

            <!-- Hover overlay: quick add/edit affordance, mirrors the reference screenshots -->
            <div
              v-if="hoveredCell === cell.dateKey && !isSelected(cell.dateKey)"
              class="pointer-events-none absolute inset-x-2 bottom-2 flex justify-start opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            >
              <span
                class="pointer-events-none inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm"
                :class="cell.assessments.length ? 'bg-[#0B1F3A]/85' : 'bg-slate-700/85'"
              >
                <Pencil v-if="cell.assessments.length" class="h-3 w-3" />
                <Plus v-else class="h-3 w-3" />
                {{ cell.assessments.length ? 'Edit schedule' : 'Set schedule' }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Sticky day panel -->
    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start">
      <div class="border-b border-slate-100 px-5 py-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">{{ selectedWeekday }}</p>
        <h2 class="mt-1 text-3xl font-light tracking-tight text-[#0B1F3A]">{{ selectedDateLabel }}</h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ selectedDateAssessments.length }} scheduled {{ selectedDateAssessments.length === 1 ? 'assessment' : 'assessments' }}
        </p>
      </div>

      <AppEmptyState
        v-if="!selectedDateAssessments.length"
        :icon="CalendarDaysIcon"
        title="This day is clear"
        description="Create an assessment for this date and configure its submission window."
      >
        <template #actions>
          <AppButton text="New assessment" variant="primary" size="sm" :icon="Plus" @click="openNewAssessment" />
        </template>
      </AppEmptyState>

      <ul v-else class="divide-y divide-slate-100">
        <li v-for="assessment in selectedDateAssessments" :key="assessment.id" class="px-5 py-4">
          <div class="flex items-start gap-3">
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold leading-snug text-slate-900">{{ assessment.title }}</h3>
              <p class="mt-1 text-xs text-slate-500">
                {{ classText(assessment) }} · {{ assessment.total_marks ?? assessment.totalMarks ?? '—' }} marks · {{ papersCountLabel(assessment) }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <AppBadge :label="getAssessmentStatusLabel(assessment.assessment_status)" :variant="getStatusVariant(assessment.assessment_status)" dot />
                <AppBadge :label="assessment.question_submission_status === 'open' ? 'Questions open' : 'Questions closed'" :variant="assessment.question_submission_status === 'open' ? 'success' : 'default'" />
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <AppButton text="Configure" variant="outline" size="xs" @click="openAssessment(assessment)" />
                <button type="button" class="text-xs font-medium text-slate-500 hover:text-[#0B1F3A]" @click="goToSubmissions(assessment)">Submissions</button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div class="border-t border-slate-100 px-5 py-4">
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Next up</p>
        <p v-if="!nextUpAssessments.length" class="text-sm text-slate-400">Nothing else scheduled.</p>
        <ul v-else class="space-y-1">
          <li v-for="assessment in nextUpAssessments" :key="assessment.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"
              @click="jumpToDate(assessment)"
            >
              <span class="flex w-11 shrink-0 flex-col items-center rounded-lg bg-slate-50 py-1.5">
                <span class="text-[10px] font-semibold uppercase text-slate-400">{{ monthAbbr(assessment.scheduled_date) }}</span>
                <span class="text-sm font-bold text-slate-900">{{ dayNum(assessment.scheduled_date) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-slate-900">{{ assessment.title }}</span>
                <span class="block truncate text-xs text-slate-400">{{ classText(assessment) }}</span>
              </span>
              <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          </li>
        </ul>
      </div>
    </section>
    </div>

    <AssessmentScheduleDrawer
      :show="drawerOpen"
      :date="drawerDate"
      :assessment="drawerAssessment"
      @close="drawerOpen = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDays as CalendarDaysIcon, ChevronRight, Pencil, Plus } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AssessmentScheduleDrawer from '../components/AssessmentScheduleDrawer.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../stores/assessments'
import { getSubmissions } from '../services/api/assessments'
import { getScheduleColor, hexToRgb, getDateRangeKeys } from '../../../js/lib/scheduleColors'

const router = useRouter()
const assessmentStore = useAssessmentsStore()
const sessionsStore = useSchoolAdminSessionsStore()

const today = new Date()
const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const hoveredCell = ref('')
const scheduleColor = (assessment) => getScheduleColor(assessment?.id)

const drawerOpen = ref(false)
const drawerDate = ref(new Date())
const drawerAssessment = ref(null)

const currentMonthDate = computed(() => new Date(assessmentStore.currentMonth))
const monthLabel = computed(() => currentMonthDate.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
const selectedDate = computed(() => assessmentStore.selectedDate)
const scheduledAssessments = computed(() => assessmentStore.scheduledAssessments)
const unscheduledAssessments = computed(() => assessmentStore.assessments.filter((assessment) => !assessment.schedule_id))

const formatLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Map every date a scheduled assessment's window touches (scheduled_date
// through assessment_ends, inclusive) to that assessment's color, so a
// multi-day window gets a consistent tint across its full range — not just
// on the day it was created.
const dateRangeTints = computed(() => {
  const map = {}
  for (const assessment of assessmentStore.scheduledAssessments) {
    const color = scheduleColor(assessment)
    const keys = getDateRangeKeys(assessment.scheduled_date, assessment.assessment_ends)
    for (const key of keys) {
      if (!map[key]) map[key] = hexToRgb(color)
    }
  }
  return map
})

const calendarCells = computed(() => {
  const monthStart = new Date(currentMonthDate.value.getFullYear(), currentMonthDate.value.getMonth(), 1)
  const startDay = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - startDay)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const dateKey = formatLocalDateKey(date)
    const assessments = assessmentStore.scheduledAssessments.filter((item) => formatLocalDateKey(item.scheduled_date) === dateKey)
    cells.push({
      key: dateKey,
      dateKey,
      date,
      day: date.getDate(),
      label: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === formatLocalDateKey(today),
      assessments,
      previewAssessments: assessments.slice(0, 2),
      moreCount: Math.max(0, assessments.length - 2),
      tintColor: dateRangeTints.value[dateKey] || '',
    })
  }
  return cells
})

const isSelected = (dateKey) => selectedDate.value === dateKey

const assessmentsThisMonth = computed(() => {
  const monthKey = `${currentMonthDate.value.getFullYear()}-${String(currentMonthDate.value.getMonth() + 1).padStart(2, '0')}`
  return scheduledAssessments.value.filter((a) => (a.scheduled_date || '').startsWith(monthKey))
})

const selectedDateObj = computed(() => {
  if (!selectedDate.value) return today
  const date = new Date(`${selectedDate.value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? today : date
})
const selectedWeekday = computed(() => selectedDateObj.value.toLocaleDateString(undefined, { weekday: 'long' }))
const selectedDateLabel = computed(() => selectedDateObj.value.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }))
const selectedDateAssessments = computed(() => assessmentStore.selectedDateAssessments)

// Next four scheduled assessments strictly after the selected date.
const nextUpAssessments = computed(() => {
  const afterKey = selectedDate.value || formatLocalDateKey(today)
  return scheduledAssessments.value
    .filter((a) => a.scheduled_date && a.scheduled_date > afterKey)
    .sort((a, b) => (a.scheduled_date > b.scheduled_date ? 1 : -1))
    .slice(0, 4)
})

const classLevelName = (id, assessment) => assessmentStore.classLevelOptions.find((o) => String(o.value) === String(id))?.label || assessment?.classLevel?.name || assessment?.class_level?.name || ''
const classArmName = (id, assessment) => assessmentStore.classArmOptions.find((o) => String(o.value) === String(id))?.label || assessment?.classArm?.name || assessment?.class_arm?.name || ''
const classText = (a) => {
  const levelId = a.class_level_id ?? a.classLevelId ?? a.classLevel?.id ?? a.class_level?.id
  const armId = a.class_arm_id ?? a.classArmId
  const level = classLevelName(levelId, a)
  const arm = armId ? ` ${classArmName(armId, a)}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
}

// Papers-submitted count for the currently-selected assessment(s) only —
// fetched on demand per selection rather than for every assessment on the
// calendar, since there's no batch "submissions count per assessment"
// endpoint and the selected-day list is always small (usually one item).
const papersCounts = ref({})
const papersCountLabel = (assessment) => {
  const count = papersCounts.value[assessment.id]
  return count === undefined ? 'loading papers…' : `${count} teacher ${count === 1 ? 'paper' : 'papers'}`
}
const loadPapersCounts = async (assessments) => {
  await Promise.all(assessments.map(async (assessment) => {
    if (papersCounts.value[assessment.id] !== undefined) return
    if (!assessment.schedule_id) {
      papersCounts.value = { ...papersCounts.value, [assessment.id]: 0 }
      return
    }
    try {
      const data = await getSubmissions(assessment.schedule_id)
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      papersCounts.value = { ...papersCounts.value, [assessment.id]: list.length }
    } catch {
      papersCounts.value = { ...papersCounts.value, [assessment.id]: 0 }
    }
  }))
}
watch(selectedDateAssessments, (list) => { if (list.length) loadPapersCounts(list) }, { immediate: true })

const monthAbbr = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : ''
const dayNum = (value) => value ? new Date(`${value}T00:00:00`).getDate() : ''

const goToSubmissions = (assessment) => router.push(`/school-admin/assessments/${assessment.id}/submissions`)
const jumpToDate = (assessment) => assessmentStore.selectDate(assessment.scheduled_date)

const goToday = () => {
  const now = new Date()
  assessmentStore.setCurrentMonth(now)
  assessmentStore.selectDate(now)
}

const shiftMonth = (delta) => {
  const next = new Date(currentMonthDate.value)
  next.setMonth(next.getMonth() + delta)
  assessmentStore.setCurrentMonth(next)
}

const selectCell = (cell) => {
  assessmentStore.selectDate(cell.dateKey)
}

const openAssessment = (assessment) => {
  assessmentStore.selectDate(assessment.scheduled_date || assessment.scheduledDate || today)
  drawerDate.value = new Date(assessment.scheduled_date || assessment.scheduledDate || today)
  drawerAssessment.value = assessment
  drawerOpen.value = true
}

const openAssessmentForScheduling = (assessment) => {
  const date = selectedDate.value ? new Date(`${selectedDate.value}T00:00:00`) : today
  drawerDate.value = date
  drawerAssessment.value = assessment
  drawerOpen.value = true
}

const openNewAssessment = () => {
  const date = selectedDate.value ? new Date(`${selectedDate.value}T00:00:00`) : new Date()
  drawerDate.value = date
  drawerAssessment.value = null
  drawerOpen.value = true
}

const handleSaved = (record) => {
  // The store already mutates its own `assessments` array on every
  // create/update/lifecycle call, so the calendar grid (which reads
  // straight from `assessmentStore.scheduledAssessments`) updates itself
  // reactively — nothing to refetch here. Do not replace the drawer prop
  // while it is open: that would retrigger its initialization watcher,
  // reset the active tab, and reload the form after every save.
  if (!drawerOpen.value && record) drawerAssessment.value = record
}

onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchSessions().catch(() => {}),
    assessmentStore.fetchRefData(),
    assessmentStore.fetchAssessments(),
  ])
  assessmentStore.setCurrentMonth(new Date())
  if (!assessmentStore.selectedDate) assessmentStore.selectDate(today)
})
</script>
