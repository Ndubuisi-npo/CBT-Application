<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0B1F3A]">
        <component :is="phase === 'error' ? ShieldAlert : ShieldCheck" class="h-8 w-8 text-[#D4AF37]" />
      </div>

      <div
        v-if="phase !== 'error'"
        class="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent"
      />

      <h1 class="mt-6 text-lg font-semibold text-slate-900">{{ statusMessage }}</h1>
      <p v-if="phase !== 'error'" class="mt-2 text-sm text-slate-500">Please do not close this window.</p>

      <p v-else class="mt-2 text-sm text-slate-500">
        Close Safe Exam Browser and relaunch the exam from the main application.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, ShieldAlert } from 'lucide-vue-next'
import { verifySebSession } from '../services/api/studentSeb'
import { setSebSession } from '../../../js/lib/auth'

// This route renders ONLY loading or error states — it must never render
// exam UI. That boundary is what keeps a partially-authenticated session
// from ever touching exam content. It is also not part of normal in-app
// navigation, so it's intentionally absent from any nav menu/link.

const router = useRouter()

const phase = ref('loading') // 'loading' | 'error'
const statusMessage = ref('Verifying your secure session...')

const showError = (message) => {
  phase.value = 'error'
  statusMessage.value = message
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const attemptId = params.get('attempt_id')
  const temporaryToken = params.get('token')

  // Missing params -> invalid-link error state, no API call made.
  if (!attemptId || !temporaryToken) {
    showError('This secure launch link is invalid.')
    return
  }

  try {
    // The temporary token is used only for this one call and is never
    // written to storage — it lives only in this local variable and in
    // the one-off Authorization header below.
    const response = await verifySebSession(attemptId, temporaryToken)

    // Durable token replaces the temporary one globally: persisted to the
    // auth store, and set as the HTTP client's default Authorization header
    // for every request from this point on.
    setSebSession(response)

    // temporaryToken is now discarded — nothing below this line references it.

    // router.replace (not push) keeps /seb-entry out of history, so
    // back-navigation can't return a student to the auth page.
    router.replace(`/exams/take/${attemptId}`)
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      showError('Your secure session has expired or is invalid.')
    } else {
      showError('We could not verify your secure session.')
    }
    // No automatic retry — the student must relaunch from the main app.
  }
})
</script>
