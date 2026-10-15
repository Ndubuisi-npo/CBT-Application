<template>
  <div class="space-y-2">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="describedBy"
      class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 transition focus:border-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
      :class="disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500' : error ? 'bg-white !border-red-300 focus:!border-red-400 focus:!ring-red-200' : 'bg-white'"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="hint && !error" :id="`${selectId}-hint`" class="text-xs text-slate-500">{{ hint }}</p>
    <p v-if="error" :id="`${selectId}-error`" class="text-xs text-red-600" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select an option' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  id: { type: String, default: '' },
})

defineEmits(['update:modelValue', 'blur'])

const autoId = useId()
const selectId = computed(() => props.id || autoId)
const describedBy = computed(() => {
  if (props.error) return `${selectId.value}-error`
  if (props.hint) return `${selectId.value}-hint`
  return undefined
})
</script>
