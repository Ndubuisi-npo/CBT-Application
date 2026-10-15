<template>
  <div>
    <div class="flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="$emit('update:active', tab.key)"
        :class="['rounded-full px-4 py-2 text-sm font-semibold transition', active === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="mt-4">
      <slot :active="active" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  tabs: { type: Array, default: () => [] },
  active: { type: String, default: '' },
})

const activeTab = computed(() => props.active || (props.tabs[0]?.key || ''))
</script>
