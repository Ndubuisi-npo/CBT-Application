<template>
  <div class="space-y-6">
    <FileDropzone
      v-if="state.page === 'idle'"
      title="Import Teachers"
      subtitle="Upload a CSV file to import teacher records in bulk."
      template-filename="teacher_import_template.csv"
      :get-template="getTeacherImportTemplate"
      @file-selected="handleFileSelected"
    />

    <div v-if="state.page === 'file_selected'" class="rounded-2xl border border-slate-200 bg-white p-12 text-center">
      <div class="flex justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B1F3A]"></div>
      </div>
      <p class="mt-4 text-sm text-slate-600">Validating your file...</p>
    </div>

    <ImportPreviewModal
      v-if="state.page === 'previewing' || state.page === 'confirming'"
      :dry-run-result="state.dryRunResult"
      :conflict-errors="state.conflictErrors"
      :overwrite-policy="state.overwritePolicy"
      :is-confirming="state.page === 'confirming'"
      entity-label="teacher"
      :duplicate-columns="teacherDuplicateColumns"
      :preferred-columns="teacherPreviewColumns"
      @confirm="handleConfirmImport"
      @cancel="reset"
      @policy-changed="(policy) => (state.overwritePolicy = policy)"
    />

    <ImportResultBanner
      v-if="state.page === 'done'"
      :import-result="state.importResult"
      entity-label="teacher"
      list-path="/school-admin/teachers"
      list-label="View Teachers"
      @import-another="reset"
    />

    <div v-if="state.page === 'error'" class="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
          <AlertCircle class="h-6 w-6 text-rose-600" />
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-rose-900">Import failed</h3>
          <p class="mt-2 text-sm text-rose-700">{{ state.errorMessage }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              @click="reset"
            >
              Try Again
            </button>
            <router-link
              to="/school-admin/teachers"
              class="rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Go to Teachers
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import FileDropzone from '../components/StudentImport/FileDropzone.vue'
import ImportPreviewModal from '../components/StudentImport/ImportPreviewModal.vue'
import ImportResultBanner from '../components/StudentImport/ImportResultBanner.vue'
import { getTeacherImportTemplate, importTeachers } from '../services/api/teachers'

const teacherDuplicateColumns = [
  { key: 'email', label: 'Email' },
  { key: 'staff_id', label: 'Staff ID' },
]
const teacherPreviewColumns = ['row', 'first_name', 'last_name', 'email', 'phone', 'staff_id', 'qualification']

const state = reactive({
  page: 'idle',
  file: null,
  dryRunResult: null,
  importResult: null,
  overwritePolicy: null,
  errorMessage: null,
  conflictErrors: [],
})

function reset() {
  Object.assign(state, {
    page: 'idle',
    file: null,
    dryRunResult: null,
    importResult: null,
    overwritePolicy: null,
    errorMessage: null,
    conflictErrors: [],
  })
}

async function handleFileSelected(file) {
  state.file = file
  state.page = 'file_selected'
  state.conflictErrors = []
  state.errorMessage = null

  try {
    const response = await importTeachers(file, { dryRun: true })

    if (response.ok) {
      state.dryRunResult = response.body?.data ?? response.body
      state.conflictErrors = []
      state.errorMessage = null
      state.page = 'previewing'
    } else {
      state.conflictErrors = response.body.errors ?? []
      state.errorMessage = response.body.message ?? 'Upload validation failed'

      if (response.body.missing_headers?.length) {
        state.errorMessage = `Your CSV is missing: ${response.body.missing_headers.join(', ')}`
      }

      state.page = 'error'
    }
  } catch (err) {
    state.errorMessage = err.message || 'Network error. Please try again.'
    state.page = 'error'
  }
}

async function handleConfirmImport(policy) {
  state.page = 'confirming'
  state.errorMessage = null

  try {
    const response = await importTeachers(state.file, { dryRun: false, overwriteExisting: policy })

    if (response.status === 201) {
      state.importResult = response.body.data
      state.page = 'done'
    } else {
      state.errorMessage = response.body?.message ?? 'Import failed'
      state.page = 'error'
    }
  } catch (err) {
    state.errorMessage = err.message || 'Network error during import. Please check the teacher list before retrying.'
    state.page = 'error'
  }
}
</script>
