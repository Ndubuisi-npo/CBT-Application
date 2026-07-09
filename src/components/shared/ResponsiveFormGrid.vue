<!--
  ResponsiveFormGrid.vue
  ────────────────────────────────────────────────────────────────────────
  Lays out form fields: a single column on mobile, `cols` columns from the
  `sm` breakpoint up (inside a drawer body this comfortably fits 2 columns
  even at the 600–720px desktop drawer width).

  Give an individual field `class="sm:col-span-2"` (or pass `full` on a
  wrapping <div>) to make it span the full row — e.g. an address or notes
  textarea inside an otherwise 2-column grid.

  Usage:
    <ResponsiveFormGrid :cols="2">
      <AppInput label="First Name" ... />
      <AppInput label="Last Name" ... />
      <AppInput label="Address" class="sm:col-span-2" ... />
    </ResponsiveFormGrid>
-->
<template>
  <div class="grid grid-cols-1 gap-x-4 gap-y-5" :class="gridColsClass">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cols: { type: Number, default: 2, validator: v => [1, 2, 3].includes(v) },
})

const gridColsClass = computed(() => ({
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
}[props.cols] || 'sm:grid-cols-2'))
</script>
