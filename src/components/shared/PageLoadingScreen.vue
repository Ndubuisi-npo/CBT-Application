<template>
  <div
    class="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm"
    role="status"
    aria-live="polite"
  >
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1F3A]/5">
      <LoaderCircle class="h-8 w-8 animate-spin text-[#0B1F3A]" aria-hidden="true" />
    </div>
    <h1 class="mt-5 text-lg font-semibold text-slate-900">{{ title }}</h1>
    <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">{{ description }}</p>
  </div>
</template>

<script setup>
import { LoaderCircle } from 'lucide-vue-next'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>
