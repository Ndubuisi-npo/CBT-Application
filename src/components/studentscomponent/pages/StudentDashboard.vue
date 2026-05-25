<template>
  <div class="space-y-6">
    <SectionCard title="Available Exams" subtitle="Select a live exam to begin.">
      <template #header>
        <div class="flex items-center gap-3">
          <p class="text-sm text-slate-500">Published exams for your class</p>
        </div>
      </template>

      <div v-if="loading" class="p-6">
        <SkeletonRows :columns="4" />
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <article v-for="exam in liveExams" :key="exam.id" class="rounded-[20px] border border-slate-200 bg-white p-5">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ exam.title }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ exam.subject }} • {{ exam.className }}</p>
              <p class="mt-3 text-sm text-slate-600">Duration: {{ exam.duration }} minutes</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(exam.status)">{{ exam.status }}</span>
              <AppButton text="Start" size="sm" variant="primary" @click="openInstructions(exam)" />
            </div>
          </div>
        </article>

        <div v-if="!liveExams.length" class="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No live exams are available. Please check back later.
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SectionCard from '../../schooladmincomponents/components/SectionCard.vue'
import SkeletonRows from '../../schooladmincomponents/components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import { getAvailableExams } from '../services/api/studentExams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { useRouter } from 'vue-router'
import { mockStudentExams } from '../data/mockStudentExams'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()
const exams = ref([])
const loading = ref(true)
const usingFallback = ref(false)

const loadExams = async () => {
  loading.value = true
  try {
    exams.value = await getAvailableExams()
    usingFallback.value = false
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to load available exams.', variant: 'error' })
    exams.value = mockStudentExams.filter((e) => e.status === 'Live')
    usingFallback.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadExams)

const liveExams = computed(() => exams.value.filter((e) => e.status === 'Live'))

const openInstructions = (exam) => {
  router.push({ name: 'StudentExamInstructions', params: { id: exam.id } })
}

const statusClass = (status) => {
  const classes = {
    Draft: 'bg-slate-100 text-slate-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Live: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-indigo-100 text-indigo-700',
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}
</script>

<style scoped>
</style>
