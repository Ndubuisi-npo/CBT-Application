<template>
  <div class="flex items-center gap-0 overflow-x-auto py-1">
    <template v-for="(step, idx) in STEPS" :key="step.key">
      <!-- Connector line -->
      <div
        v-if="idx > 0"
        class="h-0.5 min-w-[24px] flex-1"
        :class="stepIndex(step.key) < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'"
      ></div>
      <!-- Dot + label -->
      <div class="flex flex-col items-center gap-1 px-1">
        <div
          class="flex h-3 w-3 rounded-full shrink-0 transition"
          :class="dotClass(step.key)"
        ></div>
        <span
          class="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
          :class="labelClass(step.key)"
        >{{ step.label }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const STEPS = [
  { key: 'draft',     label: 'Draft'     },
  { key: 'submitted', label: 'Review'    },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'active',    label: 'Active'    },
  { key: 'grading',   label: 'Grading'   },
  { key: 'completed', label: 'Completed' },
  { key: 'published', label: 'Published' },
]

const props = defineProps({ current: { type: String, default: 'draft' } })

const currentIndex = computed(() => STEPS.findIndex((s) => s.key === (props.current || 'draft').toLowerCase()))
const stepIndex = (key) => STEPS.findIndex((s) => s.key === key)

const dotClass = (key) => {
  const si = stepIndex(key)
  if (si < currentIndex.value)  return 'bg-emerald-400'
  if (si === currentIndex.value) return 'bg-[#0B1F3A] ring-2 ring-[#D4AF37] ring-offset-1 scale-125'
  return 'bg-slate-200 border border-slate-300'
}

const labelClass = (key) => {
  const si = stepIndex(key)
  if (si < currentIndex.value)  return 'text-emerald-600'
  if (si === currentIndex.value) return 'text-[#0B1F3A] font-bold'
  return 'text-slate-400'
}
</script>
