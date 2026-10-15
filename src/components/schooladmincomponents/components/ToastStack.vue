<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl shadow-slate-900/10 ring-1"
        :class="toastClasses(toast.variant)"
      >
        <!-- Icon -->
        <div
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          :class="iconBg(toast.variant)"
        >
          <component :is="toastIcon(toast.variant)" class="h-4 w-4" :class="iconColor(toast.variant)" />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-sm font-semibold text-slate-900">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-0.5 text-sm leading-5 text-slate-500">{{ toast.message }}</p>
        </div>

        <!-- Dismiss -->
        <button
          type="button"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          @click="uiStore.removeToast(toast.id)"
          aria-label="Dismiss"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useSchoolAdminUiStore } from '../stores/ui'

const uiStore = useSchoolAdminUiStore()

const toastClasses = (variant) => ({
  success: 'border-emerald-200 ring-emerald-100',
  error:   'border-red-200 ring-red-100',
  warning: 'border-amber-200 ring-amber-100',
  info:    'border-blue-200 ring-blue-100',
}[variant] || 'border-slate-200 ring-slate-100')

const iconBg = (variant) => ({
  success: 'bg-emerald-50',
  error:   'bg-red-50',
  warning: 'bg-amber-50',
  info:    'bg-blue-50',
}[variant] || 'bg-slate-50')

const iconColor = (variant) => ({
  success: 'text-emerald-600',
  error:   'text-red-600',
  warning: 'text-amber-600',
  info:    'text-blue-600',
}[variant] || 'text-slate-600')

const toastIcon = (variant) => ({
  success: CheckCircle2,
  error:   AlertCircle,
  warning: TriangleAlert,
  info:    Info,
}[variant] || Info)

const handleForbidden = (event) => {
  uiStore.addToast({
    title: 'Not authorized',
    message: event.detail?.message || 'You are not authorized to perform this action.',
    variant: 'error',
  })
}

onMounted(() => window.addEventListener('cbt:authorization-forbidden', handleForbidden))
onBeforeUnmount(() => window.removeEventListener('cbt:authorization-forbidden', handleForbidden))
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: all 260ms cubic-bezier(0.4, 0, 0.2, 1); }
.toast-enter-from { opacity: 0; transform: translateX(16px) scale(0.96); }
.toast-leave-to   { opacity: 0; transform: translateX(16px) scale(0.96); }
</style>
