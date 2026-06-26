<template>
  <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl" :class="iconBg">
      <component :is="icon" class="h-8 w-8" :class="iconColor" />
    </div>
    <h3 class="mt-5 text-lg font-semibold text-slate-900">{{ title }}</h3>
    <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-6">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  iconBg: { type: String, default: 'bg-slate-100' },
  iconColor: { type: String, default: 'text-slate-400' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
