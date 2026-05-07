<template>
  <div class="rounded-[24px] border border-slate-200 bg-white shadow-sm">
    <div v-if="$slots.header" class="px-6 py-5 border-b border-slate-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1 text-sm text-slate-600">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.header" class="flex items-center gap-3">
          <slot name="header" />
        </div>
      </div>
    </div>
    
    <div class="px-6 pb-6">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>
