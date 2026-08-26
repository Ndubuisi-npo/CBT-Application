<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment Schedule"
      subtitle="Plan assessments on a calendar, then continue straight into submission setup."
      eyebrow="Assessment Management"
    >
      <template #actions>
        <AppButton text="New Assessment" variant="primary" size="sm" :icon="Plus" @click="openNewAssessment" />
      </template>
    </AppPageHeader>

    <section class="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_280px]">
      <div class="min-w-0 p-4 sm:p-6">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Academic Session</p>
            <h2 class="mt-1 text-4xl font-light tracking-tight text-[#0B1F3A] sm:text-5xl">{{ monthLabel }}</h2>
            <p class="mt-2 text-sm text-slate-500">{{ scheduledAssessments.length }} assessments scheduled · click a date to work on it</p>
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

      <aside class="border-t border-slate-200 bg-[#FBFAF7] lg:border-l lg:border-t-0">
        <div class="border-b border-slate-200 p-5">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">{{ selectedDateLabel.weekday }}</p>
          <h2 class="mt-1 text-2xl font-light tracking-tight text-[#0B1F3A]">{{ selectedDateLabel.date }}</h2>
          <p class="mt-1 text-xs text-slate-500">
            {{ selectedDayAssessments.length ? `${selectedDayAssessments.length} scheduled assessment${selectedDayAssessments.length === 1 ? '' : 's'}` : 'No scheduled assessments' }}
          </p>
        </div>

        <div class="border-b border-slate-200 p-4">
          <div v-if="selectedDayAssessments.length" class="space-y-3">
            <article v-for="assessment in selectedDayAssessments" :key="assessment.id" class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div class="flex items-start gap-2">
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
                <div class="min-w-0">
                  <h3 class="text-sm font-semibold leading-5 text-[#0B1F3A]">{{ assessment.title || 'Assessment' }}</h3>
                  <p class="mt-1 text-xs text-slate-500">{{ assessment.class_level?.name || assessment.class_level_name || assessment.classLevelName || 'Class level' }}</p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <AppBadge label="Pending setup" variant="warning" />
                <AppBadge label="Questions open" variant="success" />
              </div>
              <button type="button" class="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A] transition hover:border-[#0B1F3A]" @click="openAssessment(assessment)">
                Configure
              </button>
            </article>
          </div>
          <button v-else type="button" class="w-full rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-xs font-semibold text-slate-500 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" @click="openNewAssessment">
            + Schedule an assessment
          </button>
        </div>

        <div class="p-4">
          <h3 class="mb-3 text-xs font-semibold text-[#0B1F3A]">Next up</h3>
          <div v-if="nextAssessments.length" class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            <button v-for="assessment in nextAssessments" :key="assessment.id" type="button" class="flex w-full items-center gap-3 p-3 text-left transition first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50" @click="openAssessment(assessment)">
              <span class="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 text-[9px] font-semibold uppercase leading-3 text-slate-500">
                <span>{{ formatShortMonth(assessment.scheduled_date) }}</span>
                <span class="text-xs text-[#0B1F3A]">{{ formatDay(assessment.scheduled_date) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold text-[#0B1F3A]">{{ assessment.title || 'Assessment' }}</span>
                <span class="mt-0.5 block truncate text-[11px] text-slate-500">{{ assessment.class_level?.name || assessment.class_level_name || assessment.classLevelName || 'Class level' }}</span>
              </span>
              <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          </div>
          <p v-else class="text-xs text-slate-400">No upcoming assessments.</p>
        </div>
      </aside>
    </section>

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
import { computed, onMounted, ref } from 'vue'
import { ChevronRight, Pencil, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AssessmentScheduleDrawer from '../components/AssessmentScheduleDrawer.vue'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useAssessmentsStore } from '../stores/assessments'
import { getScheduleColor, hexToRgb, getDateRangeKeys } from '../../../js/lib/scheduleColors'

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
const selectedDayAssessments = computed(() => scheduledAssessments.value.filter((assessment) => formatLocalDateKey(assessment.scheduled_date || assessment.scheduledDate) === selectedDate.value))
const selectedDateLabel = computed(() => {
  const date = selectedDate.value ? new Date(`${selectedDate.value}T00:00:00`) : today
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase(),
    date: date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
  }
})
const nextAssessments = computed(() => scheduledAssessments.value
  .filter((assessment) => formatLocalDateKey(assessment.scheduled_date || assessment.scheduledDate) > selectedDate.value)
  .sort((left, right) => String(left.scheduled_date || left.scheduledDate).localeCompare(String(right.scheduled_date || right.scheduledDate)))
  .slice(0, 3))

const formatLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatShortMonth = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
const formatDay = (value) => new Date(value).getDate()

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
  drawerDate.value = cell.date
  drawerAssessment.value = cell.assessments[0] || null
  drawerOpen.value = true
}

const openAssessment = (assessment) => {
  assessmentStore.selectDate(assessment.scheduled_date || assessment.scheduledDate || today)
  drawerDate.value = new Date(assessment.scheduled_date || assessment.scheduledDate || today)
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
  // reactively — nothing to refetch here. Just keep the drawer's own
  // assessment reference current so re-opening the same cell shows the
  // latest record instead of a stale one.
  drawerAssessment.value = record
}

onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchSessions().catch(() => {}),
    assessmentStore.fetchRefData(),
    assessmentStore.fetchAssessments(),
  ])
  assessmentStore.setCurrentMonth(new Date())
})
</script>
