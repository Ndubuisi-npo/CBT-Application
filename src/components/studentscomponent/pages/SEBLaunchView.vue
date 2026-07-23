<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0B1F3A]">
        <ShieldCheck class="h-8 w-8 text-[#D4AF37]" />
      </div>

      <div class="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />

      <h1 class="mt-6 text-lg font-semibold text-slate-900">{{ statusMessage }}</h1>
      <p class="mt-2 text-sm text-slate-500">Please do not close this window.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import { getCurrentSebExam } from '../services/api/studentSeb'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const router = useRouter()
const uiStore = useSchoolAdminUiStore()

const statusMessage = ref('Launching Secure Exam...')

const redirectToInstructions = (examId) => {
  router.replace({ name: 'StudentExamInstructions', params: { id: String(examId) } })
}

const redirectToDashboard = () => {
  router.replace({ name: 'StudentDashboard' })
}

// This view has one job: ask the backend which exam this SEB session is
// authorized for, then hand off to the (unmodified) instructions page.
onMounted(async () => {
  try {
    const response = await getCurrentSebExam()
    const examId = response?.examId ?? response?.exam_id ?? response?.data?.examId

    if (!examId) {
      throw new Error('No authorized exam was found for this session.')
    }

    statusMessage.value = 'Preparing your exam...'
    redirectToInstructions(examId)
  } catch (err) {
    uiStore.addToast({
      title: 'Unable to launch exam',
      message: err.message || 'We could not verify your exam session. Please try again from your dashboard.',
      variant: 'error',
    })
    redirectToDashboard()
  }
})
</script>
