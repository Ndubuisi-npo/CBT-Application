<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        @click="closeOnBackdrop && $emit('update:modelValue', false)"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl"
        :class="widthClass"
        role="dialog"
        :aria-label="title"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">{{ eyebrow }}</p>
            <h2 class="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            @click="$emit('update:modelValue', false)"
            aria-label="Close panel"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-6">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="shrink-0 border-t border-slate-100 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg', 'xl', 'full'].includes(v) },
  closeOnBackdrop: { type: Boolean, default: true },
})

defineEmits(['update:modelValue'])

const widthClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  full: 'max-w-full',
}[props.size] || 'max-w-lg'
</script>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active { transition: opacity 0.2s ease; }
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to { opacity: 0; }

.drawer-panel-enter-active,
.drawer-panel-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-panel-enter-from,
.drawer-panel-leave-to { transform: translateX(100%); }
</style>
