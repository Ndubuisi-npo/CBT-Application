<template>
  <div class="sa-surface overflow-hidden rounded-[28px] p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-500">{{ title }}</p>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{{ value }}</p>
        <p class="mt-2 text-sm" :class="changeClass">{{ change }}</p>
      </div>
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#163154] text-[#D4AF37] shadow-lg shadow-[#0B1F3A]/20">
        <component :is="icon" class="h-6 w-6" />
      </div>
    </div>
    <div class="mt-6 h-2 rounded-full bg-slate-100">
      <div class="h-full rounded-full bg-gradient-to-r from-[#0B1F3A] to-[#D4AF37]" :style="{ width: progress }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: String,
  change: String,
  progress: String,
  icon: {
    type: [Object, Function],
    required: true,
  },
  positive: {
    type: Boolean,
    default: true,
  },
})

const changeClass = computed(() => (props.positive ? 'text-emerald-600' : 'text-rose-600'))
</script>
