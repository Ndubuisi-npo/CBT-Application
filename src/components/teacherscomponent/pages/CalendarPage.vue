<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessment calendar"
      subtitle="Assessment dates are set by your school admin. Select a day to see its papers and exam slots."
      eyebrow="Teacher Workspace"
    >
      <template #actions>
        <AppBadge v-if="store.activeTermLabel" :label="store.activeTermLabel" variant="primary" />
      </template>
    </AppPageHeader>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
      <ScheduleCalendarPreview :show-day-detail="false" />

      <section class="rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start">
        <div class="border-b border-slate-100 px-5 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ selectedWeekday }}</p>
          <h2 class="mt-1 text-3xl font-light tracking-tight text-[#0B1F3A]">{{ selectedDateLabel }}</h2>
        </div>

        <AppEmptyState
          v-if="!dayAssessments.length"
          :icon="CalendarDaysIcon"
          title="Nothing scheduled for this day"
          description="Pick another date to see what your school admin has planned."
        />

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="assessment in dayAssessments" :key="assessment.id" class="px-5 py-4">
            <div class="flex items-start gap-3">
              <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: scheduleColor(assessment) }" />
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-semibold leading-snug text-slate-900">{{ assessment.title }}</h3>
                <p class="mt-1 text-xs text-slate-500">{{ classText(assessment) }} · {{ assessment.total_marks ?? assessment.totalMarks ?? '—' }} marks</p>

                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.assessment_status || assessment.status)" dot />
                  <AppButton
                    v-if="(assessment.question_submission_status || 'open').toLowerCase() === 'open'"
                    text="Open paper"
                    variant="outline"
                    size="xs"
                    @click="openAssessment(assessment.id)"
                  />
                </div>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDaysIcon } from 'lucide-vue-next'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ScheduleCalendarPreview from '../components/ScheduleCalendarPreview.vue'
import { useAssessmentsStore, getAssessmentStatusLabel, getStatusVariant } from '../../schooladmincomponents/stores/assessments'
import { getScheduleColor } from '../../../js/lib/scheduleColors'

const router = useRouter()
const store = useAssessmentsStore()

const scheduleColor = (assessment) => getScheduleColor(assessment?.id)

const selectedDateObj = computed(() => {
  if (!store.selectedDate) return new Date()
  const date = new Date(`${store.selectedDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
})
const selectedWeekday = computed(() => selectedDateObj.value.toLocaleDateString(undefined, { weekday: 'long' }))
const selectedDateLabel = computed(() => selectedDateObj.value.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }))

const dayAssessments = computed(() => store.selectedDateAssessments)

const classLevelName = (id) => store.classLevelOptions.find((o) => String(o.value) === String(id))?.label || ''
const classArmName = (id) => store.classArmOptions.find((o) => String(o.value) === String(id))?.label || ''
const classText = (a) => {
  const nestedLevel = a.classLevel?.name || a.class_level?.name || ''
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = nestedLevel || classLevelName(levelId)
  const arm = armId ? ` ${classArmName(armId)}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
}

const openAssessment = (id) => router.push({ name: 'TeachersAssessmentDetail', params: { id } })
</script>
