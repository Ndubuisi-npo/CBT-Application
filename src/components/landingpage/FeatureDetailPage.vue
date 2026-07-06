<template>
  <div class="min-h-screen bg-[#f6f7fb] px-6 pb-16 pt-28 text-slate-900 md:px-20">
    <div class="mx-auto max-w-5xl">
      <RouterLink to="/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Back to Home
      </RouterLink>

      <div v-if="feature" class="mt-10 rounded-[32px] bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div class="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div>
            <p class="text-sm uppercase tracking-[0.28em] text-amber-500">{{ feature.title }}</p>
            <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-900">{{ feature.title }}</h1>
            <p class="mt-4 text-lg leading-relaxed text-slate-600">{{ feature.summary }}</p>

            <div class="mt-8">
              <h3 class="text-xl font-semibold text-slate-900">Overview</h3>
              <p class="mt-3 text-slate-600">{{ feature.summary }}</p>
            </div>

            <div class="mt-8 grid gap-4 sm:grid-cols-2">
              <div v-for="section in feature.sections" :key="section.title" class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-sm font-semibold text-slate-900">{{ section.title }}</h4>
                <p class="mt-2 text-sm text-slate-600">{{ section.description }}</p>
              </div>
            </div>

            <div class="mt-8">
              <h3 class="text-lg font-semibold text-slate-900">What you can do</h3>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div v-for="section in feature.sections" :key="section.title + '-brief'" class="rounded-2xl border border-slate-200 bg-white p-5">
                  <p class="text-sm font-semibold text-slate-900">{{ section.title }}</p>
                  <p class="mt-2 text-sm text-slate-600">{{ section.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <aside class="rounded-2xl border border-slate-200 bg-pink-50 p-6">
            <div class="text-center">
              <p class="text-3xl font-extrabold text-slate-900">100%</p>
              <p class="mt-2 text-sm text-slate-700">of exams reviewed before going live</p>
              <div class="mt-6">
                <a href="/onboarding" class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow">Onboard Your School</a>
              </div>
            </div>

            <div class="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <p class="font-medium text-slate-900">Key benefit</p>
              <p class="mt-2">{{ feature.benefit }}</p>
            </div>
          </aside>
        </div>
      </div>

      <div v-else class="mt-20 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p class="text-xl font-semibold text-slate-900">Feature not found</p>
        <p class="mt-3 text-slate-600">Please return to the landing page and choose a valid feature card.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())

const featureMap = {
  'exam-management': {
    title: 'Exam Management',
    summary: 'Create exams, collect submissions, and move them through review, activation, and publication.',
    benefit: 'End-to-end exam workflow',
    sections: [
      {
        title: 'Create and organize exams',
        description: 'Build exams with subjects, class levels, duration, pass marks, and question sets in one place.',
      },
      {
        title: 'Submit for admin review',
        description: 'Teachers submit exams for school admin approval before they become live for students.',
      },
      {
        title: 'Activate and publish',
        description: 'Admins activate exams for live student access, then publish results when grading is complete.',
      },
    ],
    steps: [
      { title: 'Draft the exam', description: 'Teachers build and save exam drafts with question banks and settings.' },
      { title: 'Submit for review', description: 'Submit exams to school admin for approval and activation.' },
      { title: 'Monitor and publish', description: 'Track exam progress, complete the session, and publish student results.' },
    ],
  },
  'results-tracking': {
    title: 'Results Tracking',
    summary: 'See student scores, exam completion, and performance results clearly across the platform.',
    benefit: 'Transparent student outcomes',
    sections: [
      {
        title: 'Review exam scores',
        description: 'View completed exam results with clear pass/fail and performance details for each student.',
      },
      {
        title: 'Publish results',
        description: 'Publish finalized results so students can access their performance on their dashboards.',
      },
      {
        title: 'Monitor progress',
        description: 'Track which students completed exams and compare results across subjects and classes.',
      },
    ],
    steps: [
      { title: 'Complete grading', description: 'Teachers finalize exam scoring and review any open attempts.' },
      { title: 'Publish exam results', description: 'Admins release results so students and parents can access them.' },
      { title: 'Track performance', description: 'Use reports and dashboards to monitor outcomes and make informed decisions.' },
    ],
  },
  'academic-management': {
    title: 'Academic Management',
    summary: 'Plan sessions, set up class levels, configure subjects, and manage school academic structure.',
    benefit: 'Organized academic planning',
    sections: [
      {
        title: 'Session planning',
        description: 'Create and manage academic sessions and terms to keep your calendar on track.',
      },
      {
        title: 'Class and subject setup',
        description: 'Define classes, arms, and subject assignments for a complete academic structure.',
      },
      {
        title: 'School-wide organization',
        description: 'Keep class levels, subjects, and terms aligned for smooth operations across teachers and students.',
      },
    ],
    steps: [
      { title: 'Create sessions', description: 'Set up academic years and terms for your school operations.' },
      { title: 'Add classes', description: 'Define class levels and arms to mirror your institution structure.' },
      { title: 'Assign subjects', description: 'Configure subject offerings and teacher assignments with ease.' },
    ],
  },
  'staff-student-management': {
    title: 'Staff & Student Management',
    summary: 'Manage teacher and student records, assign classes, and keep your school data organized.',
    benefit: 'Centralized people management',
    sections: [
      {
        title: 'Teacher management',
        description: 'Keep teacher profiles, assignments, and access centralized for easy administration.',
      },
      {
        title: 'Student enrollment',
        description: 'Store student records, class placements, and performance history securely.',
      },
      {
        title: 'Class assignments',
        description: 'Assign students and teachers to classes and keep rosters updated in real time.',
      },
    ],
    steps: [
      { title: 'Add staff and students', description: 'Create structured profiles for teachers and learners across your school.' },
      { title: 'Manage assignments', description: 'Link staff to subjects and students to classes for effective operations.' },
      { title: 'Monitor records', description: 'Use the dashboard to keep track of your people and class rosters.' },
    ],
  },
}

const feature = computed(() => featureMap[slug.value] || null)
</script>
