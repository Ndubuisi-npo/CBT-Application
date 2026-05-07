<template>
  <div class="space-y-4">
    <div v-for="i in rows" :key="i" class="space-y-4">
      <div v-for="j in columns" :key="j" class="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 3 },
  columns: { type: Number, default: 5 }
})
</script>
