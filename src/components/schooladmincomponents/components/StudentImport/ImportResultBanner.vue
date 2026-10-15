<template>
  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-emerald-900">Import successful!</h3>
        <p class="mt-2 text-sm text-emerald-700">
          <template v-if="typeof importResult.imported === 'number'">
            {{ importResult.imported }} {{ entityLabel }}{{ importResult.imported !== 1 ? 's' : '' }} imported
            <span v-if="importResult.skipped > 0">, {{ importResult.skipped }} skipped</span>
            <span v-if="importResult.updated > 0">, {{ importResult.updated }} updated</span>
          </template>
          <template v-else>
            Your {{ entityLabel }} bulk upload was accepted. You will be notified when it finishes processing.
          </template>
        </p>
      </div>
      <Check class="h-6 w-6 text-emerald-600" />
    </div>

    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        @click="$emit('import-another')"
      >
        Import Another File
      </button>
      <router-link
        :to="listPath"
        class="rounded-2xl border border-emerald-300 px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {{ listLabel }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  importResult: {
    type: Object,
    required: true,
  },
  entityLabel: {
    type: String,
    default: 'student',
  },
  listPath: {
    type: String,
    default: '/school-admin/students',
  },
  listLabel: {
    type: String,
    default: 'View Students',
  },
})

defineEmits(['import-another'])
</script>
