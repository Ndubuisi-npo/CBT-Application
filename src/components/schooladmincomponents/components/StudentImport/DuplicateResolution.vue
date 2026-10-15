<template>
  <div class="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p class="text-sm font-semibold text-slate-900">How would you like to handle duplicates?</p>

    <div class="space-y-3">
      <label class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:border-slate-300">
        <input
          type="radio"
          :value="'skip'"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          class="mt-1 h-4 w-4"
        />
        <div>
          <p class="font-medium text-slate-900">Skip existing records</p>
          <p class="text-sm text-slate-500">New students will be added, but duplicates will be ignored.</p>
        </div>
      </label>

      <label class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:border-slate-300">
        <input
          type="radio"
          :value="'update'"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          class="mt-1 h-4 w-4"
        />
        <div>
          <p class="font-medium text-slate-900">Update existing records</p>
          <p class="text-sm text-slate-500">Duplicates will be overwritten with the data from your CSV.</p>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: null,
  },
})

defineEmits(['update:modelValue'])
</script>
