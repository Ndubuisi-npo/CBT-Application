<template>
  <div class="sa-surface overflow-hidden rounded-[28px] p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-500">{{ title }}</p>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{{ value }}</p>
        <p class="mt-2 text-sm text-slate-500">{{ helper }}</p>
      </div>
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#163154] text-[#D4AF37] shadow-lg shadow-[#0B1F3A]/20">
        <component :is="icon" class="h-6 w-6" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: String,
  helper: String,
  icon: { type: [Object, Function], required: true },
})
</script>
