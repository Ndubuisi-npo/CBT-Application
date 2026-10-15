<template>
  <div class="flex flex-col gap-4 border-t border-slate-100 py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-slate-500">Showing {{ start }}-{{ end }} of {{ total }} records</p>
    <div class="flex items-center gap-2">
      <AppButton type="button" text="Previous" variant="outline" size="sm" :disabled="page <= 1" @click="$emit('change', page - 1)" />
      <span class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
        Page {{ page }}
      </span>
      <AppButton type="button" text="Next" variant="outline" size="sm" :disabled="end >= total" @click="$emit('change', page + 1)" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  page: Number,
  start: Number,
  end: Number,
  total: Number,
})

defineEmits(['change'])
</script>
