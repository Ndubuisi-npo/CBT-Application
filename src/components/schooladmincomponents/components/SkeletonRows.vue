<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-100">
      <tbody class="divide-y divide-slate-100 bg-white">
        <tr v-for="row in rows" :key="row">
          <td v-for="col in columns" :key="col" class="px-5 py-4">
            <div
              class="h-4 animate-pulse rounded-lg bg-slate-100"
              :style="{ width: widths[col % widths.length] }"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 4 },
})

const widths = ['60%', '40%', '80%', '30%', '50%', '70%']
</script>
