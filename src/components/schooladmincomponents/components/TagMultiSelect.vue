<template>
  <div class="space-y-3">
    <div class="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span v-for="item in selectedItems" :key="item" class="rounded-full bg-[#0B1F3A]/8 px-3 py-1 text-sm font-medium text-[#0B1F3A]">
        {{ item }}
      </span>
      <span v-if="!selectedItems.length" class="text-sm text-slate-400">{{ placeholder }}</span>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <label v-for="option in options" :key="option" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input :checked="modelValue.includes(option)" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]" @change="toggle(option)" />
        <span>{{ option }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select options' },
})

const emit = defineEmits(['update:modelValue'])

const selectedItems = computed(() => props.modelValue)

const toggle = (option) => {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((item) => item !== option)
    : [...props.modelValue, option]

  emit('update:modelValue', next)
}
</script>
