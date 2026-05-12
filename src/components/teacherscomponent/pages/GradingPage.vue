<template>
  <div class="space-y-6">
    <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title="Auto-Graded Queue" subtitle="Submitted objective scripts reviewed by comparing teacher answers with student selections.">
        <div class="space-y-4 pt-6">
          <article
            v-for="item in gradingQueue"
            :key="item.id"
            class="cursor-pointer rounded-[24px] border p-5 transition"
            :class="selectedScript.id === item.id ? 'border-[#0B1F3A] bg-slate-50' : 'border-slate-200 bg-white hover:border-[#D4AF37]/70'"
            @click="selectScript(item)"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">{{ item.studentName }}</h2>
                <p class="mt-2 text-sm text-slate-500">{{ item.className }} • {{ item.examTitle }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="item.status === 'Flagged Review' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
                {{ item.status }}
              </span>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3">
              <div class="rounded-2xl bg-slate-50 p-3 text-sm">
                <p class="text-slate-400">Correct</p>
                <p class="mt-2 font-semibold text-slate-900">{{ item.correctCount }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3 text-sm">
                <p class="text-slate-400">Questions</p>
                <p class="mt-2 font-semibold text-slate-900">{{ item.totalQuestions }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3 text-sm">
                <p class="text-slate-400">Score</p>
                <p class="mt-2 font-semibold text-slate-900">{{ percentage(item) }}%</p>
              </div>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Comparison Viewer" subtitle="See how the system matched each student answer against the teacher-selected correct option.">
        <template #header>
          <div class="text-sm font-medium text-emerald-700">{{ activeDetail.autosave }}</div>
        </template>
        <div class="space-y-6 pt-6">
          <div class="rounded-[24px] bg-[#0B1F3A] p-5 text-white">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ activeDetail.examTitle }}</p>
            <h2 class="mt-3 text-2xl font-semibold">{{ activeDetail.studentName }}</h2>
            <p class="mt-2 text-sm text-slate-300">{{ activeDetail.className }} • {{ activeDetail.progress }}</p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Correct Answers</p>
              <p class="mt-3 text-3xl font-semibold text-slate-900">{{ activeDetail.score }}</p>
            </div>
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Total Questions</p>
              <p class="mt-3 text-3xl font-semibold text-slate-900">{{ activeDetail.totalQuestions }}</p>
            </div>
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Auto Score</p>
              <p class="mt-3 text-3xl font-semibold text-slate-900">{{ Math.round((activeDetail.score / activeDetail.totalQuestions) * 100) }}%</p>
            </div>
          </div>

          <div class="space-y-4">
            <article v-for="comparison in activeDetail.comparisons" :key="comparison.id" class="rounded-[24px] border border-slate-200 bg-white p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-semibold text-slate-900">{{ comparison.question }}</h3>
                  <p class="mt-3 text-sm text-slate-500">Teacher answer: <span class="font-semibold text-slate-900">{{ comparison.correctAnswer }}</span></p>
                  <p class="mt-1 text-sm text-slate-500">Student answer: <span class="font-semibold text-slate-900">{{ comparison.studentAnswer }}</span></p>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="comparison.status === 'Correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                  {{ comparison.status }}
                </span>
              </div>
            </article>
          </div>

          <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            {{ activeDetail.flaggedReason }}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex gap-2">
              <AppButton text="Previous Student" variant="outline" @click="moveSelection(-1)" />
              <AppButton text="Next Student" variant="outline" @click="moveSelection(1)" />
            </div>
            <AppButton text="Confirm Auto Score" variant="primary" @click="confirmScores" />
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { cloneMock, gradingDetail, gradingQueue } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()
const selectedScript = ref(gradingQueue[0])
const activeDetail = ref(cloneMock(gradingDetail))

const percentage = (item) => Math.round((item.score / item.totalQuestions) * 100)

const selectScript = (item) => {
  selectedScript.value = item
  activeDetail.value = {
    ...cloneMock(gradingDetail),
    scriptId: item.id,
    studentName: item.studentName,
    className: item.className,
    examTitle: item.examTitle,
    score: item.correctCount,
    totalQuestions: item.totalQuestions,
  }
}

const moveSelection = (direction) => {
  const currentIndex = gradingQueue.findIndex((item) => item.id === selectedScript.value.id)
  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= gradingQueue.length) return
  selectScript(gradingQueue[nextIndex])
}

const confirmScores = () => {
  uiStore.addToast({
    title: 'Auto score confirmed',
    message: `${selectedScript.value.studentName}'s objective result remains based on answer comparison.`,
    variant: 'success',
  })
}
</script>
