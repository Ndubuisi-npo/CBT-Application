<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="statusClasses">
    {{ status }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'Active' },
})

const statusClasses = computed(() => {
  switch (props.status) {
    case 'Current':
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'Not current':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  }
})
</script>
