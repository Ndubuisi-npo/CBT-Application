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
  default:  { badge: 'bg-slate-700 text-white', dot: 'bg-slate-400' },
  primary:  { badge: 'bg-[#0B1F3A] text-white', dot: 'bg-[#D4AF37]' },
  success:  { badge: 'bg-emerald-600 text-white', dot: 'bg-emerald-300' },
  warning:  { badge: 'bg-amber-500 text-white', dot: 'bg-amber-200' },
  danger:   { badge: 'bg-red-600 text-white', dot: 'bg-red-300' },
  info:     { badge: 'bg-sky-600 text-white', dot: 'bg-sky-300' },
  purple:   { badge: 'bg-violet-600 text-white', dot: 'bg-violet-300' },
}

const badgeClasses = computed(() => config[props.variant]?.badge || config.default.badge)
const dotColor = computed(() => config[props.variant]?.dot || config.default.dot)
</script>
