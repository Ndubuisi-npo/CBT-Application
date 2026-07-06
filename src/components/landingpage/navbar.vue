<template>
  <header class="fixed left-0 right-0 top-0 z-50 w-full border-b border-slate-200 bg-white/70 backdrop-blur-md backdrop-saturate-150">
    <div class="mx-auto flex h-20 items-center justify-between px-20 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold">
          E
        </div>
        <span class="text-base font-semibold text-slate-900">EduCBT</span>
      </div>

      <nav class="hidden items-center gap-8 text-base text-slate-600 md:flex font-medium underline underline-offset-4">
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="scrollToSection('features')">Features</button>
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="scrollToSection('how-it-works')">How It Works</button>
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="scrollToSection('pricing')">Pricing</button>
      </nav>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50"
          @click="goToLogin"
        >
          Login
        </button>

        <Link
          to="/onboarding"
          class="cursor-pointer rounded-lg bg-slate-900 px-5 py-2 text-base font-medium text-white shadow-base transition hover:bg-slate-700"
        >
          Onboard Your School
        </Link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink as Link, useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const goToLogin = () => {
  // detect handle from route params, query, or first path segment
  let handle = route.params?.handle || route.query?.handle
  if (!handle) {
    const segments = window.location.pathname.split('/').filter(Boolean)
    if (segments.length && !['pricing', 'features', 'how-it-works', 'onboarding'].includes(segments[0])) {
      handle = segments[0]
    }
  }

  if (handle) {
    const host = window.location.host
    const loginUrl = `${window.location.protocol}//${handle}.${host}/login`
    window.location.href = loginUrl
    return
  }

  // fallback to normal login route
  window.location.href = '/login'
}
</script>
