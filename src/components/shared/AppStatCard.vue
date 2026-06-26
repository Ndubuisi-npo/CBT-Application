<template>
  <div class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <!-- Subtle background accent -->
    <div class="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" :class="hoverBg" />

    <div class="relative flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ label }}</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          <span v-if="loading" class="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
          <template v-else>{{ value }}</template>
        </p>
        <p v-if="sub" class="mt-1.5 text-xs text-slate-500">{{ sub }}</p>
      </div>
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :class="iconBg"
      >
        <component :is="icon" class="h-5 w-5" :class="iconColor" />
      </div>
    </div>

    <div v-if="trend !== undefined" class="relative mt-4 flex items-center gap-1.5">
      <component
        :is="trend >= 0 ? TrendingUp : TrendingDown"
        class="h-3.5 w-3.5"
        :class="trend >= 0 ? 'text-emerald-500' : 'text-red-500'"
      />
      <span class="text-xs font-medium" :class="trend >= 0 ? 'text-emerald-600' : 'text-red-600'">
        {{ Math.abs(trend) }}%
      </span>
      <span class="text-xs text-slate-400">vs last period</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  sub: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
  iconBg: { type: String, default: 'bg-blue-50' },
  iconColor: { type: String, default: 'text-blue-600' },
  hoverBg: { type: String, default: 'bg-slate-50/60' },
  loading: { type: Boolean, default: false },
  trend: { type: Number, default: undefined },
})
</script>
