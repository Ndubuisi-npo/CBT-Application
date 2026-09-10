<template>
  <section class="lp-reveal-section lp-section">
    <div class="mx-auto grid grid-cols-1 gap-10 px-5 py-12 sm:px-8 sm:gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-20">
      <div class="lp-card rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-bold tracking-tight text-slate-800">
            Grading System
          </h3>
          <span class="rounded-lg bg-white px-4 py-2 text-base font-bold text-slate-700 shadow-sm">
            Settings
          </span>
        </div>

        <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="grid grid-cols-3 border-b border-slate-200 px-6 py-5 text-sm font-bold text-slate-500">
            <p>Grade</p>
            <p>Range</p>
            <p>Result</p>
          </div>

          <div
            v-for="grade in grades"
            :key="grade.name"
            class="grid grid-cols-3 items-center border-b border-slate-100 px-6 py-5 text-sm text-slate-800 last:border-b-0"
          >
            <p class="font-semibold">{{ grade.name }}</p>
            <p class="text-slate-500">{{ grade.range }}</p>
            <p :class="grade.resultClass" class="font-semibold">{{ grade.result }}</p>
          </div>
        </div>
      </div>

      <div>
        <div class="lp-icon-chip flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
          <FileText class="h-6 w-6" />
        </div>

        <h2 class="mt-8 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
          Grading, your way
        </h2>

        <p class="mt-7 max-w-2xl text-lg leading-relaxed text-slate-600">
          Define your own grade names and score ranges once, and every exam result is graded
          against them automatically.
        </p>

        <ul class="mt-12 space-y-6">
          <li
            v-for="item in checklist"
            :key="item"
            class="flex items-center gap-4 text-base font-bold tracking-tight text-slate-800"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500">
              <Check class="h-4 w-4" />
            </span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check, FileText } from 'lucide-vue-next'

const grades = [
  { name: 'A', range: '90 - 100%', result: 'Pass', resultClass: 'text-emerald-600' },
  { name: 'B', range: '80 - 89%', result: 'Pass', resultClass: 'text-emerald-600' },
  { name: 'F', range: '0 - 39%', result: 'Fail', resultClass: 'text-rose-600' },
]

const checklist = [
  'Custom grade names and score ranges',
  'Automatic grading on every submitted exam',
  'Downloadable result breakdowns for students',
]
</script>
