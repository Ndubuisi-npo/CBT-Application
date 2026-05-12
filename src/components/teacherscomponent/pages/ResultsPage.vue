<template>
  <div class="space-y-6">
    <SectionCard title="Objective Results" subtitle="Auto-generated exam outcomes based on student answers compared with teacher-selected correct options.">
      <template #header>
        <AppButton :icon="Download" text="Export Results" variant="outline" />
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Average Score</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ resultsAnalytics.averageScore }}%</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Pass Rate</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ resultsAnalytics.passRate }}%</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Distinction Rate</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ resultsAnalytics.distinctionRate }}%</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm text-slate-500">Released Results</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ resultRecords.length }}</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Released Assessments" subtitle="Published objective exam outcomes ready for review and export.">
      <div class="overflow-hidden rounded-[24px] border border-slate-200 mt-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Exam</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Class</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Average</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pass Rate</th>
                <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Released</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="record in resultRecords" :key="record.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 text-sm font-semibold text-slate-900">{{ record.examTitle }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ record.className }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ record.submitted }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ record.average }}%</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ record.passRate }}%</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(record.publishedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <SectionCard title="Grade Distribution" subtitle="A quick visual of the spread of auto-generated objective scores.">
        <div class="space-y-4 pt-6">
          <div v-for="grade in resultsAnalytics.gradeDistribution" :key="grade.grade" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-slate-900">Grade {{ grade.grade }}</span>
              <span class="text-slate-500">{{ grade.count }} students</span>
            </div>
            <div class="h-3 rounded-full bg-slate-200">
              <div class="h-3 rounded-full bg-[#0B1F3A]" :style="{ width: `${(grade.count / maxGradeCount) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Weak Topics" subtitle="Topics where student objective responses show lower mastery.">
        <div class="space-y-4 pt-6">
          <article v-for="topic in resultsAnalytics.weakTopics" :key="topic.topic" class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">{{ topic.topic }}</h3>
                <p class="mt-1 text-sm text-slate-500">Objective response accuracy remains below target benchmark.</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-500">Average</p>
                <p class="text-lg font-semibold text-rose-700">{{ topic.score }}%</p>
              </div>
            </div>
          </article>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Download } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { formatHumanDate, resultRecords, resultsAnalytics } from '../data/mockTeacherData'

const maxGradeCount = computed(() =>
  Math.max(...resultsAnalytics.gradeDistribution.map((item) => item.count)),
)

const formatDate = (value) => formatHumanDate(value, { hour: 'numeric', minute: '2-digit' })
</script>
