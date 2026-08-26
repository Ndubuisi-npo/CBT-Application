<template>
  <ol class="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Assessment lifecycle">
    <template v-for="(step, index) in LIFECYCLE_STEPS" :key="step">
      <li class="flex items-center gap-2">
        <span
          class="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-medium"
          :class="[
            index < current ? 'bg-emerald-50 text-emerald-700' : '',
            index === current ? 'bg-[#0B1F3A] text-white' : '',
            index >= current && index !== current ? 'bg-slate-50 text-slate-400' : '',
          ]"
        >
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold"
            :class="[
              index < current ? 'bg-emerald-600 text-white' : '',
              index === current ? 'bg-[#D4AF37] text-[#0B1F3A]' : '',
              index > current ? 'bg-white text-slate-400 border border-slate-200' : '',
            ]"
          >
            <svg v-if="index < current" viewBox="0 0 12 12" class="h-3 w-3" fill="none">
              <path d="M2.5 6.5L4.75 8.75L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <template v-else>{{ index + 1 }}</template>
          </span>
          {{ step }}
        </span>
        <span v-if="index < LIFECYCLE_STEPS.length - 1" class="h-px w-4 bg-slate-200" aria-hidden="true" />
      </li>
    </template>
  </ol>
</template>

<script setup>
import { computed } from 'vue'
import { LIFECYCLE_STEPS, lifecycleStep } from '../../js/lib/assessmentLifecycle'

const props = defineProps({
  assessmentStatus: { type: String, default: 'draft' },
  questionSubmissionStatus: { type: String, default: 'open' },
})

const current = computed(() => lifecycleStep(props.assessmentStatus, props.questionSubmissionStatus))
</script>
