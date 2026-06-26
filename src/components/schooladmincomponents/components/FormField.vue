<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      class="block text-sm font-medium text-slate-700"
    >
      {{ label }}<span v-if="required" class="ml-0.5 text-red-500">*</span>
    </label>
    <slot />
    <p v-if="error" class="flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle class="h-3.5 w-3.5 shrink-0" />
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>

<script setup>
import { AlertCircle } from 'lucide-vue-next'
defineProps({
  label: String,
  error: String,
  hint: String,
  required: Boolean,
})
</script>
