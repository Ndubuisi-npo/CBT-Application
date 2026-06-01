<template>
  <div class="space-y-6">
    <SectionCard title="Timetable" subtitle="Weekly teaching schedule with upcoming assessment events and conflict visibility.">
      <div class="grid gap-4 pt-6 lg:grid-cols-5">
        <article v-for="day in timetable.weekly" :key="day.day" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">{{ day.day }}</h2>
          <div class="mt-4 space-y-3">
            <div v-for="entry in day.entries" :key="`${day.day}-${entry.time}`" class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ entry.time }}</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ entry.subject }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ entry.className }} • {{ entry.room }}</p>
            </div>
          </div>
        </article>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <SectionCard title="Calendar Highlights" subtitle="Upcoming exams, moderation tasks, and school events.">
        <div class="grid gap-4 pt-6 md:grid-cols-2">
          <article v-for="entry in timetable.calendar" :key="entry.date" class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ entry.date }}</p>
            <h3 class="mt-3 text-lg font-semibold text-slate-900">{{ entry.label }}</h3>
            <span class="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="toneClass(entry.tone)">
              {{ entry.tone }}
            </span>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Conflict Indicators" subtitle="Potential clashes that need timetable or invigilation adjustments.">
        <div class="space-y-4 pt-6">
          <div v-for="conflict in timetable.conflicts" :key="conflict.id" class="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <p class="text-sm font-semibold text-amber-800">Attention needed</p>
            <p class="mt-2 text-sm leading-6 text-amber-700">{{ conflict.message }}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SectionCard from '../components/SectionCard.vue'

const timetable = ref({
  weekly: [],
  calendar: [],
  conflicts: []
})

const toneClass = (tone) => {
  const classes = {
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  }
  return classes[tone] || 'bg-slate-100 text-slate-700'
}
</script>
