<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="describedBy"
      :class="inputClasses"
      class="w-full rounded-2xl border px-4 py-3 text-sm transition focus:border-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
    />
    <p v-if="hint && !error" :id="`${inputId}-hint`" class="text-xs text-slate-500">{{ hint }}</p>
    <p v-if="error" :id="`${inputId}-error`" class="flex items-center gap-1 text-xs text-red-600" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  id: { type: String, default: '' },
})

defineEmits(['update:modelValue', 'blur'])

const autoId = useId()
const inputId = computed(() => props.id || autoId)
const describedBy = computed(() => {
  if (props.error) return `${inputId.value}-error`
  if (props.hint) return `${inputId.value}-hint`
  return undefined
})

const inputClasses = computed(() => {
  if (props.disabled) return 'cursor-not-allowed bg-slate-100 text-slate-500'
  if (props.error) return 'bg-white text-slate-900 !border-red-300 focus:!border-red-400 focus:!ring-red-200'
  return 'bg-white text-slate-900'
})
</script>
