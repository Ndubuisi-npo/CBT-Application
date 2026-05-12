<template>
  <div class="space-y-6">
    <SectionCard title="Assigned Classes" subtitle="A deeper view of class workload, attendance, and performance support needs.">
      <div class="grid gap-4 pt-6 lg:grid-cols-2 2xl:grid-cols-4">
        <article v-for="classItem in classOverview" :key="classItem.id" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ classItem.name }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ classItem.homeroom }}</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ classItem.studentCount }} students</span>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-slate-50 p-3">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Attendance</p>
              <p class="mt-2 font-semibold text-slate-900">{{ classItem.attendanceToday }}/{{ classItem.studentCount }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-3">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Average</p>
              <p class="mt-2 font-semibold text-slate-900">{{ classItem.averageScore }}%</p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span v-for="subject in classItem.subjects" :key="subject" class="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
              {{ subject }}
            </span>
          </div>
        </article>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <SectionCard title="Student Support Snapshot" subtitle="Identify top performers and learners needing intervention across your classes.">
        <div class="space-y-4 pt-6">
          <article
            v-for="student in teacherStudents"
            :key="student.id"
            class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-lg font-semibold text-slate-900">{{ student.name }}</h3>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(student.status)">{{ student.status }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-500">{{ student.className }} • {{ student.admissionNo }} • Guardian: {{ student.guardian }}</p>
              </div>
              <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[280px]">
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-slate-400">Attendance</p>
                  <p class="mt-2 font-semibold text-slate-900">{{ student.attendance }}%</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p class="text-slate-400">Average score</p>
                  <p class="mt-2 font-semibold text-slate-900">{{ student.average }}%</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Class Action Queue" subtitle="What each class still needs from you this week.">
        <div class="space-y-4 pt-6">
          <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <p class="text-sm font-semibold text-amber-800">SS1 Gold</p>
            <p class="mt-2 text-sm leading-6 text-amber-700">Wednesday attendance still pending. 3 students also need follow-up on low algebra quiz scores.</p>
          </div>
          <div class="rounded-[24px] border border-blue-200 bg-blue-50 p-5">
            <p class="text-sm font-semibold text-blue-800">SS2 Gold</p>
            <p class="mt-2 text-sm leading-6 text-blue-700">Mid-term CBT is scheduled. Confirm invigilation note and lock final question order.</p>
          </div>
          <div class="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
            <p class="text-sm font-semibold text-rose-800">SS3 Science</p>
            <p class="mt-2 text-sm leading-6 text-rose-700">Live revision exam triggered 2 tab-switch warnings and 1 unstable connection alert.</p>
          </div>
          <div class="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <p class="text-sm font-semibold text-emerald-800">SS2 Science</p>
            <p class="mt-2 text-sm leading-6 text-emerald-700">Theory grading queue is ready for moderation after you score remaining probability responses.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import SectionCard from '../components/SectionCard.vue'
import { classOverview, teacherStudents } from '../data/mockTeacherData'

const statusClass = (status) => {
  const classes = {
    Excellent: 'bg-emerald-100 text-emerald-700',
    'On Track': 'bg-blue-100 text-blue-700',
    'Needs Support': 'bg-amber-100 text-amber-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}
</script>
