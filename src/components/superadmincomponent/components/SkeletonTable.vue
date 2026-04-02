<template>
  <div class="space-y-4">
    <div v-for="row in rows" :key="row" class="grid grid-cols-5 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div v-for="column in 5" :key="column" class="h-5 animate-pulse rounded-xl bg-slate-200"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Number,
    default: 5,
  },
})
</script>
