<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">Import Preview</h2>
          <p class="mt-1 text-sm text-slate-600">Review the data before importing</p>
        </div>
        <button
          v-if="!isConfirming"
          type="button"
          class="text-slate-400 hover:text-slate-600"
          @click="$emit('cancel')"
        >
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- Error state: Validation errors -->
      <div v-if="conflictErrors.length > 0" class="space-y-4">
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p class="font-semibold text-rose-900">
            {{ conflictErrors.length }} row{{ conflictErrors.length !== 1 ? 's' : '' }} have validation errors
          </p>
          <p class="mt-1 text-sm text-rose-700">Please fix these issues and re-upload your file.</p>
        </div>

        <div class="overflow-x-auto rounded-[24px] border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Row</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Field</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(err, idx) in conflictErrors" :key="idx" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm font-semibold text-slate-900">{{ err.row }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ Object.keys(err.errors)[0] || 'unknown' }}
                </td>
                <td class="px-4 py-3 text-sm text-rose-600">
                  {{ Object.values(err.errors)[0]?.[0] || 'Validation failed' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Success state: No errors, no duplicates -->
      <div v-else-if="dryRunResult && dryRunResult.duplicates?.length === 0" class="space-y-4">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="font-semibold text-emerald-900">Ready to import</p>
          <p class="mt-1 text-sm text-emerald-700">
            {{ dryRunResult.total_rows }} student{{ dryRunResult.total_rows !== 1 ? 's' : '' }} will be added
          </p>
        </div>

        <div class="flex gap-3">
          <button
            v-if="!isConfirming"
            type="button"
            class="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            v-if="isConfirming"
            type="button"
            class="flex items-center gap-2 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600"
            disabled
          >
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
            Importing...
          </button>
          <button
            v-else
            type="button"
            class="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            @click="$emit('confirm', null)"
          >
            Confirm Import
          </button>
        </div>
      </div>

      <!-- Success state: No errors, but duplicates exist -->
      <div v-else-if="dryRunResult && dryRunResult.duplicates?.length > 0" class="space-y-4">
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p class="font-semibold text-amber-900">Duplicate records found</p>
          <p class="mt-1 text-sm text-amber-700">
            {{ dryRunResult.duplicates.length }} student{{ dryRunResult.duplicates.length !== 1 ? 's' : '' }} already
            exist in the system.
          </p>
        </div>

        <div class="overflow-x-auto rounded-[24px] border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Row</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600">Admission #</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(dup, idx) in dryRunResult.duplicates" :key="idx" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm font-semibold text-slate-900">{{ dup.row }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ dup.email || '—' }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ dup.admission_number || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <DuplicateResolution v-model="selectedPolicy" />

        <div class="flex gap-3">
          <button
            v-if="!isConfirming"
            type="button"
            class="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            v-if="isConfirming"
            type="button"
            class="flex items-center gap-2 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600"
            disabled
          >
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
            Importing...
          </button>
          <button
            v-else
            type="button"
            class="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
            :disabled="!selectedPolicy"
            @click="$emit('confirm', selectedPolicy)"
          >
            Confirm Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import DuplicateResolution from './DuplicateResolution.vue'

defineProps({
  dryRunResult: {
    type: Object,
    default: null,
  },
  conflictErrors: {
    type: Array,
    default: () => [],
  },
  overwritePolicy: {
    type: String,
    default: null,
  },
  isConfirming: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel', 'policy-changed'])

const selectedPolicy = ref(null)

watch(selectedPolicy, (newPolicy) => {
  emit('policy-changed', newPolicy)
})
</script>
