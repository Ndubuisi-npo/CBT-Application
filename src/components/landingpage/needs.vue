<template>
  <section class="lp-reveal-section lp-section">
    <div class="mx-auto px-5 py-14 sm:px-8 sm:py-20 lg:px-20">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
          Everything you need to run your school
        </h2>
        <p class="mt-5 text-xl leading-relaxed text-slate-500">
          Powerful features wrapped in a beautiful, intuitive interface that your staff will
          actually love using.
        </p>
      </div>

      <div class="mt-14 grid grid-cols-1 gap-8 xl:grid-cols-4">
        <article
        v-for="feature in features"
        :key="feature.title"
        :class="feature.cardClass"
        class="lp-card flex flex-col rounded-2xl border border-slate-200 px-6 py-7 shadow-sm sm:px-10 sm:py-9"
        >
          <div class="lp-icon-chip flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <component :is="feature.icon" class="h-6 w-8" />
          </div>

          <h3 class="mt-8 text-lg font-bold tracking-tight text-slate-800">
            {{ feature.title }}
          </h3>
          <p class="mt-5 text-base leading-relaxed text-slate-600">
            {{ feature.description }}
          </p>

          <RouterLink
            :to="`/features/${feature.slug}`"
            class="lp-link mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-amber-300 hover:text-amber-500"
            >
            Learn more
            <ArrowRight class="h-4 w-4" />
          </RouterLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, BarChart3, BookOpen, Building2, Users } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const features = [
  {
    title: 'Exam Management',
    description: 'Create exams, submit them for admin approval, and activate them for students.',
    icon: BookOpen,
    slug: 'exam-management',
    cardClass: 'bg-rose-50/60',
  },
  {
    title: 'Results Tracking',
    description: 'Monitor completed exams and publish results for students with confidence.',
    icon: BarChart3,
    slug: 'results-tracking',
    cardClass: 'bg-indigo-50/70',
  },
  {
    title: 'Academic Management',
    description: 'Organize sessions, classes, and subjects across your school in one place.',
    icon: Building2,
    slug: 'academic-management',
    cardClass: 'bg-emerald-50/60',
  },
  {
    title: 'Staff & Student Management',
    description: 'Manage teachers, students, and class assignments easily from the dashboard.',
    icon: Users,
    slug: 'staff-student-management',
    cardClass: 'bg-amber-50/50',
  },
]
</script>
