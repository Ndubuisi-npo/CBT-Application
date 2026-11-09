<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <AppButton :icon="ArrowLeft" text="Back to Students" variant="outline" size="sm" @click="router.push('/school-admin/students')" />
    </div>

    <!-- Idle state: Dropzone + template download -->
    <FileDropzone
      v-if="state.page === 'idle'"
      title="Bulk Upload Students"
      subtitle="Upload a CSV file to upload student records in bulk."
      template-filename="student_import_template.csv"
      :get-template="getImportTemplate"
      @file-selected="handleFileSelected"
    />

    <!-- Loading state: Spinner -->
    <div v-if="state.page === 'file_selected'" class="rounded-2xl border border-slate-200 bg-white p-12 text-center">
      <div class="flex justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B1F3A]"></div>
      </div>
      <p class="mt-4 text-sm text-slate-600">Validating your file...</p>
    </div>

    <!-- Preview modal -->
    <ImportPreviewModal
      v-if="state.page === 'previewing' || state.page === 'confirming'"
      :dry-run-result="state.dryRunResult"
      :conflict-errors="state.conflictErrors"
      :overwrite-policy="state.overwritePolicy"
      :is-confirming="state.page === 'confirming'"
      entity-label="student"
      :duplicate-columns="studentDuplicateColumns"
      :preferred-columns="studentPreviewColumns"
      :parsed-preview-rows="parsedPreviewRows"
      @confirm="handleConfirmImport"
      @cancel="reset"
      @policy-changed="(policy) => (state.overwritePolicy = policy)"
    />

    <!-- Success banner -->
    <ImportResultBanner
      v-if="state.page === 'done'"
      :import-result="state.importResult"
      entity-label="student"
      list-path="/school-admin/students"
      list-label="View Students"
      @import-another="reset"
    />

    <!-- Error panel -->
    <div v-if="state.page === 'error'" class="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
          <AlertCircle class="h-6 w-6 text-rose-600" />
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-rose-900">Import failed</h3>
          <p class="mt-2 text-sm text-rose-700">{{ state.errorMessage }}</p>
          <ul v-if="state.errorDetails.length" class="mt-2 list-inside list-disc space-y-1 text-sm text-rose-700">
            <li v-for="(detail, index) in state.errorDetails" :key="index">{{ detail }}</li>
          </ul>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              @click="reset"
            >
              Try Again
            </button>
            <router-link
              to="/school-admin/students"
              class="rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Go to Students
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { subscribeToImportProgress } from '../services/api/importStream'
import { createRafBatcher, getImportProgressCount } from '../services/api/importProgress'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FileDropzone from '../components/StudentImport/FileDropzone.vue'
import ImportPreviewModal from '../components/StudentImport/ImportPreviewModal.vue'
import ImportResultBanner from '../components/StudentImport/ImportResultBanner.vue'
import { getImportError } from '../components/StudentImport/importError.js'
import { parseCsvPreview } from '../components/StudentImport/parseCsvPreview.js'
import { getImportTemplate, importStudents } from '../services/api/students'
import { useSchoolAdminStudentsStore } from '../stores/students'

const router = useRouter()
const studentsStore = useSchoolAdminStudentsStore()

const studentDuplicateColumns = [
  { key: 'email', label: 'Email' },
  { key: 'admission_number', label: 'Admission #' },
]
const studentPreviewColumns = ['row', 'first_name', 'last_name', 'email', 'admission_number', 'class', 'class_arm']

let unsubscribeFromProgress = null
let activePreviewParser = null
const parsedPreviewRows = shallowRef([])
const importProgressBatcher = createRafBatcher((payload) => {
  if (!studentsStore.importProgress) return
  const processed = getImportProgressCount(payload)
  const total = Number(payload?.total_rows)
  studentsStore.importProgress = {
    ...studentsStore.importProgress,
    ...(Number.isSafeInteger(total) && total > 0 ? { total } : {}),
    ...(processed !== null
      ? { processed: Math.max(studentsStore.importProgress.processed || 0, processed) }
      : {}),
  }
})

const state = reactive({
  page: 'idle', // idle | file_selected | previewing | confirming | done | error
  file: null,
  dryRunResult: null,
  importResult: null,
  overwritePolicy: null,
  errorMessage: null,
  errorDetails: [],
  conflictErrors: [],
})

onUnmounted(() => {
  unsubscribeFromProgress?.()
  activePreviewParser?.cancel()
  importProgressBatcher.cancel()
})

function reset() {
  unsubscribeFromProgress?.()
  unsubscribeFromProgress = null
  activePreviewParser?.cancel()
  activePreviewParser = null
  parsedPreviewRows.value = []

  Object.assign(state, {
    page: 'idle',
    file: null,
    dryRunResult: null,
    importResult: null,
    overwritePolicy: null,
    errorMessage: null,
    errorDetails: [],
    conflictErrors: [],
  })
}

async function handleFileSelected(file) {
  activePreviewParser?.cancel()
  activePreviewParser = null
  parsedPreviewRows.value = []
  state.file = file
  state.page = 'file_selected'
  state.conflictErrors = []
  state.errorMessage = null
  state.errorDetails = []

  try {
    const response = await importStudents(file, { dryRun: true })

    if (response.ok) {
      const result = response.body?.data ?? response.body
      const previewFields = ['rows', 'preview_rows', 'students', 'teachers', 'valid_rows']
      const resultRows = previewFields
        .map((field) => result?.[field])
        .find((rows) => Array.isArray(rows) && rows.length > 0)
      const expectedRowCount = Number(
        result?.total_rows ?? result?.total ?? result?.valid_count ?? result?.students_count,
      )
      state.dryRunResult = Array.isArray(result)
        ? {}
        : Object.fromEntries(Object.entries(result ?? {}).filter(([key]) => !previewFields.includes(key)))

      if (resultRows && (!Number.isSafeInteger(expectedRowCount) || expectedRowCount <= resultRows.length)) {
        parsedPreviewRows.value = resultRows
      } else {
        activePreviewParser = parseCsvPreview(file, {
          columns: studentPreviewColumns,
          onBatch: (batch) => {
            parsedPreviewRows.value.push(...batch)
          },
        })
        await activePreviewParser.promise
        activePreviewParser = null
      }
      state.conflictErrors = []
      state.errorMessage = null
      state.page = 'previewing'
    } else {
      const uploadError = getImportError(response.body, 'Upload validation failed.')
      state.conflictErrors = response.body?.errors ?? []
      state.errorMessage = uploadError.message
      state.errorDetails = uploadError.details

      if (response.body?.missing_headers?.length) {
        state.errorMessage = `Your CSV is missing: ${response.body.missing_headers.join(', ')}`
      }

      state.page = 'error'
    }
  } catch (err) {
    if (err?.name === 'AbortError') return
    const uploadError = getImportError(err, 'Unable to validate the uploaded student file. Please try again.')
    state.errorMessage = uploadError.message
    state.errorDetails = uploadError.details
    state.page = 'error'
  }
}

async function handleConfirmImport(policy) {
  state.page = 'confirming'
  state.errorMessage = null
  studentsStore.importProgress = null

  try {
    const startingStudentCount = studentsStore.totalStudents
    const response = await importStudents(state.file, { dryRun: false, overwriteExisting: policy })

    if (response.ok) {
      state.importResult = response.body.data ?? response.body
      const importedCount = Number(state.importResult?.imported)
      const expectedCount = Number(
        importedCount > 0
          ? importedCount
          : state.dryRunResult?.total_rows
            ?? state.dryRunResult?.total
            ?? state.dryRunResult?.valid_count
            ?? state.dryRunResult?.students_count
            ?? parsedPreviewRows.value.length
            ?? 0
      )
      if (Number.isSafeInteger(expectedCount) && expectedCount > 0) {
        studentsStore.importProgress = {
          startingCount: startingStudentCount,
          total: expectedCount,
          processed: 0,
          jobId: state.importResult?.import_job_id,
        }
      }
      state.page = 'done'

      unsubscribeFromProgress?.()
      unsubscribeFromProgress = subscribeToImportProgress(state.importResult?.import_job_id, {
        onUpdate: importProgressBatcher.schedule,
        onDone: (payload) => {
          importProgressBatcher.cancel()
          unsubscribeFromProgress = null
          studentsStore.importProgress = null
          state.importResult = payload
        },
        onError: () => {
          importProgressBatcher.cancel()
          unsubscribeFromProgress = null
        },
      })
    } else {
      const importError = getImportError(response.body, 'Unable to import students.')
      state.errorMessage = importError.message
      state.errorDetails = importError.details
      state.page = 'error'
    }
  } catch (err) {
    const importError = getImportError(err, 'Unable to import students. Please check the student list before retrying.')
    state.errorMessage = importError.message
    state.errorDetails = importError.details
    state.page = 'error'
  }
}
</script>
