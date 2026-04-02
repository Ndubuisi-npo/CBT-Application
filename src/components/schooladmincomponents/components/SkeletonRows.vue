<template>
  <div class="space-y-4">
    <div v-for="row in rows" :key="row" class="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
      <div v-for="column in columns" :key="column" class="h-5 animate-pulse rounded-xl bg-slate-200"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 4 },
})
</script>
