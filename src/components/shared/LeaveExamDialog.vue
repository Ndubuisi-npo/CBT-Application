<template>
  <Transition name="leave-exam-backdrop">
    <div
      v-if="visible"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-7">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <TriangleAlert class="h-6 w-6" />
        </div>
        <h2 class="mt-4 text-lg font-bold text-slate-800">{{ title }}</h2>
        <p class="mt-2 text-sm text-slate-500">{{ message }}</p>
        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <AppButton
            text="Stay"
            variant="outline"
            class="flex-1"
            :disabled="leaving"
            @click="$emit('stay')"
          />
          <AppButton
            text="Leave"
            loading-text="Leaving..."
            variant="danger"
            class="flex-1"
            :processing="leaving"
            @click="$emit('leave')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { TriangleAlert } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Leave Exam?' },
  message: {
    type: String,
    default: 'If you leave now, your exam session will end and any unsaved progress will be lost.',
  },
  // True while the "Leave" action (logout + redirect) is in flight.
  leaving: { type: Boolean, default: false },
})

defineEmits(['stay', 'leave'])
</script>

<style scoped>
.leave-exam-backdrop-enter-active,
.leave-exam-backdrop-leave-active { transition: opacity 0.2s ease; }
.leave-exam-backdrop-enter-from,
.leave-exam-backdrop-leave-to { opacity: 0; }
</style>
