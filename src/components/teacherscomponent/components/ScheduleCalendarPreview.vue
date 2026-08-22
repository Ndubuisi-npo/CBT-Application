<template>
  <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div class="p-4 sm:p-6">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Academic Session</p>
          <h2 class="mt-1 text-3xl font-light tracking-tight text-[#0B1F3A] sm:text-4xl">{{ monthLabel }}</h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ scheduledAssessments.length }} assessment{{ scheduledAssessments.length === 1 ? '' : 's' }} scheduled by your school admin
          </p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton text="Today" variant="outline" size="sm" @click="goToday" />
          <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
          <button class="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#0B1F3A] hover:text-[#0B1F3A]" aria-label="Next month" @click="shiftMonth(1)">›</button>
        </div>
      </div>

      <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200">
        <div v-for="day in weekdays" :key="day" class="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 last:border-r-0 sm:px-3">
          {{ day }}
        </div>
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          type="button"
          class="relative min-h-[92px] border-r border-b border-slate-200 p-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 sm:min-h-[104px] sm:p-2"
          :class="cell.isCurrentMonth ? 'bg-white' : 'bg-[#FBFAF7] text-slate-400'"
          :style="cell.tintColor ? { backgroundColor: `rgba(${cell.tintColor}, 0.07)` } : {}"
          :aria-label="`View ${cell.label}`"
          @click="toggleDay(cell)"
        >
          <span
            class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
            :class="[
              cell.isToday ? 'bg-[#D4AF37] text-[#0B1F3A]' : '',
              openDate === cell.dateKey ? 'bg-[#0B1F3A] text-white' : '',
              !cell.isToday && openDate !== cell.dateKey ? 'text-slate-700' : '',
            ]"
          >
            {{ cell.day }}
          </span>
          <div class="mt-1.5 space-y-1">
            <div
              v-for="assessment in cell.previewAssessments"
              :key="assessment.id"
              class="flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[10px] text-slate-700"
              :style="{ backgroundColor: `rgba(${hexToRgb(scheduleColor(assessment))}, 0.1)` }"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
              <span class="min-w-0 flex-1 truncate">{{ assessment.title || 'Assessment' }}</span>
            </div>
            <p v-if="cell.moreCount" class="text-[10px] font-medium text-slate-500">+{{ cell.moreCount }} more</p>
          </div>
        </button>
      </div>

      <!-- Read-only day detail, expands under the grid instead of a side panel -->
      <div v-if="openDate" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ openWeekday }}</p>
            <p class="text-sm font-semibold text-[#0B1F3A]">{{ openDateLabel }}</p>
          </div>
          <button type="button" class="text-xs font-medium text-slate-400 hover:text-slate-600" @click="openDate = ''">Close</button>
        </div>
        <div v-if="openDayAssessments.length" class="space-y-2">
          <div
            v-for="assessment in openDayAssessments"
            :key="assessment.id"
            class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900">{{ assessment.title }}</p>
              <p v-if="assessment.description" class="mt-0.5 truncate text-xs text-slate-500">{{ assessment.description }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="text-xs text-slate-500">Marks: {{ assessment.total_marks ?? assessment.totalMarks ?? '—' }}</span>
                <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.assessment_status || assessment.status)" />
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500">Nothing scheduled for this day.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../../schooladmincomponents/stores/assessments'
import { getScheduleColor, hexToRgb, getDateRangeKeys } from '../../../js/lib/scheduleColors'

const store = useAssessmentsStore()
const today = new Date()
const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const openDate = ref('')

const scheduleColor = (assessment) => getScheduleColor(assessment?.id)

const formatLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const currentMonthDate = computed(() => new Date(store.currentMonth))
const monthLabel = computed(() => currentMonthDate.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
const scheduledAssessments = computed(() => store.scheduledAssessments)

const dateRangeTints = computed(() => {
  const map = {}
  for (const assessment of scheduledAssessments.value) {
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
    const assessments = scheduledAssessments.value.filter((item) => formatLocalDateKey(item.scheduled_date) === dateKey)
    cells.push({
      key: dateKey,
      dateKey,
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

const openDayAssessments = computed(() => scheduledAssessments.value.filter((item) => formatLocalDateKey(item.scheduled_date) === openDate.value))
const openDateLabel = computed(() => (openDate.value ? new Date(`${openDate.value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''))
const openWeekday = computed(() => (openDate.value ? new Date(`${openDate.value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' }) : ''))

const toggleDay = (cell) => {
  openDate.value = openDate.value === cell.dateKey ? '' : cell.dateKey
}
const goToday = () => {
  store.setCurrentMonth(new Date())
  openDate.value = formatLocalDateKey(new Date())
}
const shiftMonth = (delta) => {
  const next = new Date(currentMonthDate.value)
  next.setMonth(next.getMonth() + delta)
  store.setCurrentMonth(next)
}

onMounted(async () => {
  if (!store.refData.classLevels.length) await store.fetchRefData().catch(() => {})
  if (!store.assessments.length) await store.fetchTeacherAssessments().catch(() => {})
})
</script>
