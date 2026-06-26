<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="badgeClasses"
  >
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full" :class="dotColor" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'success', 'warning', 'danger', 'info', 'primary', 'purple'].includes(v),
  },
  dot: { type: Boolean, default: false },
})

const config = {
  default:  { badge: 'bg-slate-100 text-slate-700',        dot: 'bg-slate-500' },
  primary:  { badge: 'bg-[#0B1F3A]/10 text-[#0B1F3A]',    dot: 'bg-[#0B1F3A]' },
  success:  { badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  warning:  { badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-500' },
  danger:   { badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',             dot: 'bg-red-500' },
  info:     { badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',          dot: 'bg-blue-500' },
  purple:   { badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',    dot: 'bg-purple-500' },
}

const badgeClasses = computed(() => config[props.variant]?.badge || config.default.badge)
const dotColor = computed(() => config[props.variant]?.dot || config.default.dot)
</script>
