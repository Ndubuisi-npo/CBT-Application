<template>
  <div class="space-y-6">
    <SectionCard :title="title" :subtitle="subtitle">
      <template #header>
        <AppButton text="Download Template" variant="outline" size="base" :processing="isDownloadingTemplate" :disabled="isDownloadingTemplate" loadingText="Downloading..." @click="downloadTemplate" />
      </template>

      <div
        class="rounded-2xl border-2 border-dashed transition"
        :class="isDragging ? 'border-[#0B1F3A] bg-slate-50' : 'border-slate-300 bg-white'"
        @dragenter="handleDragEnter"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-12" @click="triggerFileInput">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Upload class="h-8 w-8 text-slate-400" />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-semibold text-slate-900">Drop your CSV here</h3>
            <p class="mt-1 text-sm text-slate-500">or click to browse from your device</p>
            <p class="mt-3 text-xs text-slate-400">Supported formats: CSV, TXT • Max file size: 5 MB</p>
          </div>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".csv,.txt"
        class="hidden"
        @change="handleFileInput"
      />

      <div v-if="error" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p class="text-sm font-medium text-rose-700">{{ error }}</p>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import AppButton from '../../../shared/AppButton.vue'
import SectionCard from '../../components/SectionCard.vue'
const props = defineProps({
  title: {
    type: String,
    default: 'Import Students',
  },
  subtitle: {
    type: String,
    default: 'Upload a CSV file to import student records in bulk.',
  },
  templateFilename: {
    type: String,
    default: 'student_import_template.csv',
  },
  getTemplate: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['file-selected'])

const fileInput = ref(null)
const isDragging = ref(false)
const error = ref('')
const isDownloadingTemplate = ref(false)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function triggerFileInput() {
  fileInput.value?.click()
}

function validateFile(file) {
  error.value = ''

  // Check file type
  const validTypes = ['text/csv', 'text/plain']
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!validTypes.includes(file.type) && !['csv', 'txt'].includes(extension)) {
    error.value = 'Only CSV and TXT files are supported.'
    return false
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    error.value = 'File size exceeds 5 MB. Please choose a smaller file.'
    return false
  }

  return true
}

function handleFileInput(event) {
  const files = event.target.files
  if (files?.length && validateFile(files[0])) {
    emit('file-selected', files[0])
  }
  // Reset input
  event.target.value = ''
}

function handleDragEnter(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event) {
  if (event.target === event.currentTarget) {
    isDragging.value = false
  }
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files?.length && validateFile(files[0])) {
    emit('file-selected', files[0])
  }
}

async function downloadTemplate() {
  isDownloadingTemplate.value = true
  error.value = ''
  try {
    const blob = await props.getTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.templateFilename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = err.message || 'Failed to download template. Please try again.'
  } finally {
    isDownloadingTemplate.value = false
  }
}
</script>
