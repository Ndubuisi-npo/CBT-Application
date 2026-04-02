<template>
  <span
    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
    :class="status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'"
  >
    {{ status }}
  </span>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'Active',
  },
})
</script>
