<template>
  <div class="space-y-6">
    <SectionCard :title="`Exam Monitor N/A ${exam?.title || '…'}`" subtitle="This monitoring view has been simplified for the new lifecycle.">
      <template #header>
        <div class="flex items-center gap-3">
          <AppButton text="← Back" variant="ghost" @click="$router.push('/teachers/exams')" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-4">
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-xs uppercase tracking-wider text-slate-400">Status</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.status || 'draft' }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-xs uppercase tracking-wider text-slate-400">Duration</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.duration || '–' }} min</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-xs uppercase tracking-wider text-slate-400">Type</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.type || 'exam' }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-xs uppercase tracking-wider text-slate-400">Scheduled Start</p>
          <p class="mt-2 font-semibold text-slate-900">{{ formatDate(exam?.scheduled_start) }}</p>
        </div>
      </div>

      <div class="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
        Real-time attendance and session monitoring have been removed from this workflow.
        Use the Exams dashboard to manage lifecycle state and review results after completion.
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import { fmtDateTime } from '../../../js/lib/helpers'

const route = useRoute()
const router = useRouter()
const store = useTeacherExamsStore()
const ui = useSchoolAdminUiStore()

const examId = route.params.id
const exam = ref(null)

const formatDate = (value) => {
  if (!value) return 'Not scheduled'
  return fmtDateTime(value, { timeZone: 'Africa/Lagos' })
}

const loadExam = async () => {
  try {
    exam.value = await store.fetchExam(examId)
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message || 'Failed to load exam.', variant: 'error' })
  }
}

onMounted(loadExam)
</script>
