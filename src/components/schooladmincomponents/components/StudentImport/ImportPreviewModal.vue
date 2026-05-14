<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
    <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
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
      <div v-if="normalizedConflictErrors.length > 0" class="space-y-4">
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p class="font-semibold text-rose-900">
            {{ normalizedConflictErrors.length }} row{{ normalizedConflictErrors.length !== 1 ? 's' : '' }} have
            validation errors
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
              <tr v-for="(err, idx) in normalizedConflictErrors" :key="idx" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm font-semibold text-slate-900">{{ err.row }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ firstErrorField(err) }}
                </td>
                <td class="px-4 py-3 text-sm text-rose-600">
                  {{ firstErrorMessage(err) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Success state: No errors, no duplicates -->
      <div v-else-if="dryRunResult && duplicateRows.length === 0" class="space-y-4">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="font-semibold text-emerald-900">Ready to import</p>
          <p class="mt-1 text-sm text-emerald-700">
            {{ totalRows }} student{{ totalRows !== 1 ? 's' : '' }} will be added
          </p>
        </div>

        <div v-if="previewRows.length > 0" class="overflow-x-auto rounded-[24px] border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th
                  v-for="column in previewColumns"
                  :key="column"
                  class="px-4 py-3 text-left text-xs font-semibold capitalize text-slate-600"
                >
                  {{ formatColumnLabel(column) }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(row, idx) in previewRows" :key="idx" class="hover:bg-slate-50">
                <td v-for="column in previewColumns" :key="column" class="px-4 py-3 text-sm text-slate-600">
                  {{ formatCell(row[column]) }}
                </td>
              </tr>
            </tbody>
          </table>
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
      <div v-else-if="dryRunResult && duplicateRows.length > 0" class="space-y-4">
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p class="font-semibold text-amber-900">Duplicate records found</p>
          <p class="mt-1 text-sm text-amber-700">
            {{ duplicateRows.length }} student{{ duplicateRows.length !== 1 ? 's' : '' }} already exist in the system.
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
              <tr v-for="(dup, idx) in duplicateRows" :key="idx" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm font-semibold text-slate-900">{{ dup.row }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ dup.email || '-' }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ dup.admission_number || '-' }}</td>
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

      <div v-else class="space-y-4">
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p class="font-semibold text-amber-900">Preview unavailable</p>
          <p class="mt-1 text-sm text-amber-700">
            The file was accepted, but the preview data was empty. Please try the upload again.
          </p>
        </div>

        <button
          type="button"
          class="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="$emit('cancel')"
        >
          Upload Another File
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import DuplicateResolution from './DuplicateResolution.vue'

const props = defineProps({
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

const normalizedConflictErrors = computed(() => {
  return Array.isArray(props.conflictErrors) ? props.conflictErrors : []
})

const duplicateRows = computed(() => {
  const duplicates = props.dryRunResult?.duplicates ?? props.dryRunResult?.duplicate_rows ?? []
  return Array.isArray(duplicates) ? duplicates : []
})

const previewRows = computed(() => {
  const rows =
    props.dryRunResult?.rows ??
    props.dryRunResult?.preview_rows ??
    props.dryRunResult?.students ??
    props.dryRunResult?.valid_rows ??
    []

  return Array.isArray(rows) ? rows.slice(0, 10) : []
})

const previewColumns = computed(() => {
  const preferredColumns = ['row', 'first_name', 'last_name', 'email', 'admission_number', 'class', 'class_arm']
  const availableColumns = new Set(previewRows.value.flatMap((row) => Object.keys(row ?? {})))
  const orderedColumns = preferredColumns.filter((column) => availableColumns.has(column))

  if (orderedColumns.length > 0) return orderedColumns

  return Array.from(availableColumns).slice(0, 7)
})

const totalRows = computed(() => {
  return (
    props.dryRunResult?.total_rows ??
    props.dryRunResult?.total ??
    props.dryRunResult?.valid_count ??
    props.dryRunResult?.students_count ??
    previewRows.value.length
  )
})

function firstErrorField(error) {
  return Object.keys(error?.errors ?? {})[0] || error?.field || 'unknown'
}

function firstErrorMessage(error) {
  const firstMessage = Object.values(error?.errors ?? {})[0]
  if (Array.isArray(firstMessage)) return firstMessage[0] || 'Validation failed'
  return firstMessage || error?.message || 'Validation failed'
}

function formatColumnLabel(column) {
  return String(column).replaceAll('_', ' ')
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  return Array.isArray(value) ? value.join(', ') : value
}

watch(selectedPolicy, (newPolicy) => {
  emit('policy-changed', newPolicy)
})
</script>
