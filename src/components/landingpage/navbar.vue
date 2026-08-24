<template>
  <header class="fixed left-0 right-0 top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md backdrop-saturate-150">
    <div class="mx-auto flex h-16 items-center justify-between px-4 shadow-sm sm:h-20 sm:px-6 lg:px-20">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-900">
          <img src="/educbt.png" alt="EduCBT Logo" class="h-full w-full object-contain rounded-xl">
        </div>
        <span class="text-base font-semibold text-slate-900">EduCBT</span>
      </div>

      <nav class="hidden items-center gap-8 text-base font-medium text-slate-600 underline underline-offset-4 md:flex">
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="handleNavClick('features')">Features</button>
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="handleNavClick('how-it-works')">How It Works</button>
        <button type="button" class="cursor-pointer hover:text-slate-900" @click="handleNavClick('pricing')">Pricing</button>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <button
          type="button"
          class="min-h-[44px] cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50"
          @click="goToLogin"
        >
          Login
        </button>

        <Link
          to="/onboarding"
          class="min-h-[44px] cursor-pointer rounded-lg bg-slate-900 px-5 py-2 text-base font-medium text-white shadow-base transition hover:bg-slate-700"
        >
          Onboard Your School
        </Link>
      </div>

      <button
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
        aria-label="Toggle navigation"
        :aria-expanded="isMenuOpen"
        @click="toggleMenu"
      >
        <Menu v-if="!isMenuOpen" class="h-5 w-5" />
        <X v-else class="h-5 w-5" />
      </button>
    </div>

    <div v-if="isMenuOpen" class="border-t border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:hidden">
      <nav class="flex flex-col gap-2">
        <button type="button" class="rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="handleNavClick('features')">Features</button>
        <button type="button" class="rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="handleNavClick('how-it-works')">How It Works</button>
        <button type="button" class="rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="handleNavClick('pricing')">Pricing</button>
      </nav>

      <div class="mt-4 flex flex-col gap-2">
        <button
          type="button"
          class="min-h-[44px] rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="goToLogin"
        >
          Login
        </button>
        <Link
          to="/onboarding"
          class="min-h-[44px] rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
          @click="closeMenu"
        >
          Onboard Your School
        </Link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink as Link, useRoute } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'

const route = useRoute()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const handleNavClick = (sectionId: string) => {
  closeMenu()
  scrollToSection(sectionId)
}

const goToLogin = () => {
  closeMenu()
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

  window.location.href = '/login'
}
</script>
