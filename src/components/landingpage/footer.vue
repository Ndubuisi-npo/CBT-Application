<template>
  <footer class="lp-reveal-section w-full bg-white">
    <div class="w-full px-5 pb-8 pt-4 sm:px-8 lg:px-20">

        <div class="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div v-for="group in footerGroups" :key="group.title">
            <h3 class="text-base font-bold tracking-tight text-slate-800">
              {{ group.title }}
            </h3>

            <ul class="mt-8 space-y-6">
              <li v-for="item in group.links" :key="item.label">
                <a :href="item.href" class="lp-link text-base text-slate-500 hover:text-amber-800" @click.prevent="item.action && item.action()">
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-14 flex flex-col gap-8 border-t border-slate-200 pt-8 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-800">
              E
            </div>
            <p class="text-base text-slate-500">
              (c) 2026 EduCBT. All rights reserved.
            </p>
          </div>
        </div>

    </div>
  </footer>
</template>

<script setup lang="ts">
const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing', action: () => scrollTo('pricing') },
    ],
  },
  {
    title: 'Get Started',
    links: [
      { label: 'Onboard Your School', href: '/onboarding' },
      { label: 'Login', href: '/login' },
    ],
  },
]
</script>
