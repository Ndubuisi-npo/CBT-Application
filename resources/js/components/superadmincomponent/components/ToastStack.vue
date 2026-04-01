<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-2xl border bg-white p-4 shadow-xl"
        :class="toast.variant === 'error' ? 'border-rose-200' : 'border-emerald-200'"
      >
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl"
            :class="toast.variant === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
          >
            <component :is="toast.variant === 'error' ? CircleAlert : CircleCheckBig" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-900">{{ toast.title }}</p>
            <p class="mt-1 text-sm leading-5 text-slate-500">{{ toast.message }}</p>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { CircleAlert, CircleCheckBig } from 'lucide-vue-next'
import { useSuperAdminUiStore } from '../stores/ui'

const uiStore = useSuperAdminUiStore()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 240ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
