<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
    <div class="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Confirm Action</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-900">{{ title }}</h2>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" @click="$emit('cancel')">✕</button>
      </div>

      <p class="mt-4 text-sm leading-6 text-slate-500">{{ message }}</p>

      <!-- Optional extra field (e.g., session duration) -->
      <div v-if="extraField" class="mt-4">
        <label class="block text-sm font-medium text-slate-700">{{ extraFieldLabel }}</label>
        <input
          v-model="extraValue"
          type="number"
          min="1"
          class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#0B1F3A] focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]"
          :placeholder="extraFieldPlaceholder || ''"
        />
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <AppButton text="Cancel" variant="ghost" @click="$emit('cancel')" />
        <AppButton
          :text="confirmLabel"
          :variant="variant === 'danger' ? 'danger' : 'primary'"
          @click="handleConfirm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  variant: { type: String, default: 'primary' },
  extraField: { type: String, default: null },
  extraFieldLabel: { type: String, default: '' },
  extraFieldPlaceholder: { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'cancel'])

const extraValue = ref('')

const handleConfirm = () => {
  const payload = {}
  if (props.extraField) {
    payload[props.extraField] = extraValue.value
  }
  emit('confirm', payload)
}
</script>
