<template>
  <div class="space-y-6">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {{ showArchived ? 'Archived Students' : 'Students' }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ showArchived ? 'View and restore revoked student accounts.' : 'Manage enrollment, class assignments, and student records.' }}
        </p>
      </div>
      <div v-if="!showArchived" class="flex flex-wrap items-center gap-2">
        <AppButton :icon="UploadCloud" text="Import" variant="outline" size="sm" @click="goToImport" />
        <AppButton :icon="Plus" text="Add Student" variant="primary" size="sm" @click="openModal()" />
      </div>
      <div v-else class="flex items-center gap-2">
        <AppButton text="← Back to Active" variant="outline" size="sm" @click="toggleView" />
      </div>
    </div>

    <!-- ── Active Students table ──────────────────────────────────────────── -->
    <section v-if="!showArchived" class="rounded-2xl border border-slate-200 bg-white">

      <!-- Table toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <!-- Search -->
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search students…"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#0B1F3A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <!-- Bulk / select actions -->
        <div class="flex items-center gap-2">
          <span v-if="selectedStudents.size" class="text-xs text-slate-500">{{ selectedStudents.size }} selected</span>
          <AppButton
            v-if="selectedStudents.size"
            text="Revoke Selected"
            variant="warning"
            size="sm"
            :processing="isRevokingSelected"
            @click="revokeSelectedStudents"
          />
          <AppButton
            v-if="isSelectMode"
            text="Cancel"
            variant="ghost"
            size="sm"
            @click="cancelSelectMode"
          />
          <AppButton
            v-if="!isSelectMode"
            :icon="CheckSquare"
            text="Select"
            variant="ghost"
            size="sm"
            @click="startSelectMode"
          />
          <AppButton
            :icon="Archive"
            text="Archived"
            variant="ghost"
            size="sm"
            @click="toggleView"
          />
        </div>
      </div>

      <!-- Skeleton -->
      <SkeletonRows v-if="studentsStore.loading" :columns="5" />

      <!-- Empty state -->
      <div v-else-if="!filteredStudents.length" class="px-5 py-16 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <GraduationCap class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">
          {{ searchQuery ? 'No students found' : 'No students yet' }}
        </h3>
        <p class="mt-1.5 text-sm text-slate-500">
          {{ searchQuery ? 'Try adjusting your search.' : 'Get started by adding your first student.' }}
        </p>
        <div class="mt-5 flex justify-center gap-2">
          <AppButton v-if="searchQuery" text="Clear Search" variant="outline" size="sm" @click="searchQuery = ''" />
          <AppButton v-if="!searchQuery" :icon="Plus" text="Add First Student" variant="primary" size="sm" @click="openModal()" />
        </div>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50">
              <th v-if="isSelectMode" class="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  :checked="areAllVisibleSelected"
                  class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                  @change="toggleVisibleStudents($event.target.checked)"
                />
              </th>
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"
              >{{ col.label }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="group transition hover:bg-slate-50/70"
            >
              <td v-if="isSelectMode" class="px-5 py-3.5">
                <input
                  type="checkbox"
                  :checked="selectedStudents.has(student.id)"
                  class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                  @change="toggleStudentSelection(student.id, $event.target.checked)"
                />
              </td>
              <!-- Name + avatar -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A]/10 text-xs font-semibold text-[#0B1F3A]">
                    {{ initials(student) }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">{{ student.first_name }} {{ student.last_name }}</p>
                    <p class="text-xs text-slate-500">{{ student.email || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-600">{{ student.phone || '—' }}</td>
              <td class="px-5 py-3.5 text-sm text-slate-600">{{ student.studentProfile?.admission_number || '—' }}</td>
              <td class="px-5 py-3.5 text-sm text-slate-600">
                {{ student.studentProfile?.class_arm?.name || student.student_profile?.class_name || '—' }}
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    @click="viewStudent(student)"
                  >View</button>
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    @click="editStudent(student)"
                  >Edit</button>
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-200 transition hover:bg-amber-50"
                    :disabled="revokeLoading.has(student.id)"
                    @click="revokeStudent(student.id)"
                  >{{ revokeLoading.has(student.id) ? 'Revoking…' : 'Revoke' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredStudents.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">
          Showing {{ studentsStartIndex }}–{{ studentsEndIndex }} of {{ filteredStudents.length }}
        </p>
        <div class="flex items-center gap-1.5">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="studentsPage === 1"
            @click="studentsPage--"
          ><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ studentsPage }} / {{ studentsTotalPages }}</span>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="studentsPage === studentsTotalPages"
            @click="studentsPage++"
          ><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <!-- ── Archived Students table ─────────────────────────────────────────── -->
    <section v-if="showArchived" class="rounded-2xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div class="flex items-center gap-2">
          <span v-if="selectedArchivedStudents.size" class="text-xs text-slate-500">{{ selectedArchivedStudents.size }} selected</span>
          <AppButton
            v-if="selectedArchivedStudents.size"
            text="Restore Selected"
            variant="success"
            size="sm"
            :processing="isRestoringArchivedSelected"
            @click="restoreSelectedArchivedStudents"
          />
          <AppButton
            v-if="selectedArchivedStudents.size"
            text="Delete Selected"
            variant="danger"
            size="sm"
            :processing="isDeletingArchivedSelected"
            @click="deleteSelectedArchivedStudents"
          />
          <AppButton
            v-if="isArchivedSelectMode"
            text="Cancel"
            variant="ghost"
            size="sm"
            @click="cancelArchivedSelectMode"
          />
          <AppButton
            v-if="!isArchivedSelectMode"
            :icon="CheckSquare"
            text="Select"
            variant="ghost"
            size="sm"
            @click="startArchivedSelectMode"
          />
        </div>
      </div>

      <SkeletonRows v-if="studentsStore.loading" :columns="5" />

      <div v-else-if="!studentsStore.archivedStudents.length" class="px-5 py-16 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Archive class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">No archived students</h3>
        <p class="mt-1.5 text-sm text-slate-500">Revoked students will appear here.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50">
              <th v-if="isArchivedSelectMode" class="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  :checked="areAllVisibleArchivedSelected"
                  class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                  @change="toggleVisibleArchivedStudents($event.target.checked)"
                />
              </th>
              <th v-for="col in columns" :key="col.key" class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr
              v-for="student in paginatedArchivedStudents"
              :key="student.id"
              class="group opacity-60 transition hover:opacity-90"
            >
              <td v-if="isArchivedSelectMode" class="px-5 py-3.5">
                <input
                  type="checkbox"
                  :checked="selectedArchivedStudents.has(student.id)"
                  class="h-4 w-4 rounded border-slate-300"
                  @change="toggleArchivedStudentSelection(student.id, $event.target.checked)"
                />
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
                    {{ initials(student) }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-700">{{ student.first_name }} {{ student.last_name }}</p>
                    <p class="text-xs text-slate-400">{{ student.email || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-500">{{ student.phone || '—' }}</td>
              <td class="px-5 py-3.5 text-sm text-slate-500">{{ student.student_profile?.admission_number || '—' }}</td>
              <td class="px-5 py-3.5 text-sm text-slate-500">{{ student.student_profile?.class_arm?.name || student.student_profile?.class_name || '—' }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                    :disabled="restoreLoading.has(student.id)"
                    @click="restoreArchivedStudent(student.id)"
                  >{{ restoreLoading.has(student.id) ? 'Restoring…' : 'Restore' }}</button>
                  <button
                    class="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
                    :disabled="deleteLoading.has(student.id)"
                    @click="deleteArchivedStudent(student.id)"
                  >{{ deleteLoading.has(student.id) ? 'Deleting…' : 'Delete' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Archived Pagination -->
      <div v-if="studentsStore.archivedStudents.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">
          Showing {{ archivedStudentsStartIndex }}–{{ archivedStudentsEndIndex }} of {{ studentsStore.archivedStudents.length }}
        </p>
        <div class="flex items-center gap-1.5">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40"
            :disabled="archivedStudentsPage === 1"
            @click="archivedStudentsPage--"
          ><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ archivedStudentsPage }} / {{ archivedStudentsTotalPages }}</span>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40"
            :disabled="archivedStudentsPage === archivedStudentsTotalPages"
            @click="archivedStudentsPage++"
          ><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <!-- ── Drawer ──────────────────────────────────────────────────────────── -->
    <StudentModal
      :show="showModal"
      :student="selectedStudent"
      :mode="modalMode"
      @close="closeModal"
      @submit="submitStudent"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Archive, CheckSquare, ChevronLeft, ChevronRight, GraduationCap, Plus, Search, UploadCloud } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import StudentModal from '../components/StudentModal.vue'
import { useSchoolAdminStudentsStore } from '../stores/students'
import { useSchoolAdminUiStore } from '../stores/ui'

const router = useRouter()
const studentsStore = useSchoolAdminStudentsStore()
const uiStore = useSchoolAdminUiStore()

// ── Column definitions ─────────────────────────────────────────────────────
const columns = [
  { key: 'name',        label: 'Student' },
  { key: 'phone',       label: 'Phone' },
  { key: 'admission',   label: 'Admission No.' },
  { key: 'class',       label: 'Class' },
  { key: 'actions',     label: '' },
]

// ── State ──────────────────────────────────────────────────────────────────
const showModal          = ref(false)
const selectedStudent    = ref(null)
const modalMode          = ref('edit')
const showArchived       = ref(false)
const searchQuery        = ref('')
const isSelectMode       = ref(false)
const selectedStudents   = ref(new Set())
const isArchivedSelectMode       = ref(false)
const selectedArchivedStudents   = ref(new Set())
const revokeLoading  = ref(new Set())
const restoreLoading = ref(new Set())
const deleteLoading  = ref(new Set())
const isRevokingSelected         = ref(false)
const isRestoringArchivedSelected = ref(false)
const isDeletingArchivedSelected  = ref(false)

const itemsPerPage       = 10
const studentsPage       = ref(1)
const archivedStudentsPage = ref(1)

// ── Helpers ────────────────────────────────────────────────────────────────
const initials = (s) =>
  `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase() || '?'

// ── Filtered data ──────────────────────────────────────────────────────────
const filteredStudents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return studentsStore.students
  return studentsStore.students.filter((s) => {
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
    return (
      name.includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.studentProfile?.admission_number || s.student_profile?.admission_number || '').toLowerCase().includes(q) ||
      (s.studentProfile?.class_arm?.name || s.student_profile?.class_name || '').toLowerCase().includes(q)
    )
  })
})

// ── Pagination ─────────────────────────────────────────────────────────────
const studentsTotalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / itemsPerPage)))
const archivedStudentsTotalPages = computed(() => Math.max(1, Math.ceil(studentsStore.archivedStudents.length / itemsPerPage)))
const paginate = (items, page) => items.slice((page - 1) * itemsPerPage, page * itemsPerPage)
const paginatedStudents = computed(() => paginate(filteredStudents.value, studentsPage.value))
const paginatedArchivedStudents = computed(() => paginate(studentsStore.archivedStudents, archivedStudentsPage.value))
const studentsStartIndex = computed(() => filteredStudents.value.length ? (studentsPage.value - 1) * itemsPerPage + 1 : 0)
const studentsEndIndex = computed(() => Math.min(studentsPage.value * itemsPerPage, filteredStudents.value.length))
const archivedStudentsStartIndex = computed(() => studentsStore.archivedStudents.length ? (archivedStudentsPage.value - 1) * itemsPerPage + 1 : 0)
const archivedStudentsEndIndex = computed(() => Math.min(archivedStudentsPage.value * itemsPerPage, studentsStore.archivedStudents.length))

// ── Selection ──────────────────────────────────────────────────────────────
const areAllVisibleSelected = computed(() =>
  paginatedStudents.value.length > 0 && paginatedStudents.value.every((s) => selectedStudents.value.has(s.id)),
)
const areAllVisibleArchivedSelected = computed(() =>
  paginatedArchivedStudents.value.length > 0 && paginatedArchivedStudents.value.every((s) => selectedArchivedStudents.value.has(s.id)),
)

const toggleVisibleStudents = (checked) => {
  const next = new Set(selectedStudents.value)
  paginatedStudents.value.forEach((s) => (checked ? next.add(s.id) : next.delete(s.id)))
  selectedStudents.value = next
}
const toggleStudentSelection = (id, checked) => {
  const next = new Set(selectedStudents.value)
  checked ? next.add(id) : next.delete(id)
  selectedStudents.value = next
}
const toggleVisibleArchivedStudents = (checked) => {
  const next = new Set(selectedArchivedStudents.value)
  paginatedArchivedStudents.value.forEach((s) => (checked ? next.add(s.id) : next.delete(s.id)))
  selectedArchivedStudents.value = next
}
const toggleArchivedStudentSelection = (id, checked) => {
  const next = new Set(selectedArchivedStudents.value)
  checked ? next.add(id) : next.delete(id)
  selectedArchivedStudents.value = next
}

// ── Select mode ────────────────────────────────────────────────────────────
const startSelectMode = () => { isSelectMode.value = true; selectedStudents.value = new Set() }
const cancelSelectMode = () => { isSelectMode.value = false; selectedStudents.value = new Set() }
const startArchivedSelectMode = () => { isArchivedSelectMode.value = true; selectedArchivedStudents.value = new Set() }
const cancelArchivedSelectMode = () => { isArchivedSelectMode.value = false; selectedArchivedStudents.value = new Set() }

// ── Toggle view ────────────────────────────────────────────────────────────
const toggleView = () => {
  showArchived.value = !showArchived.value
  studentsPage.value = 1
  archivedStudentsPage.value = 1
  cancelSelectMode()
  cancelArchivedSelectMode()
  if (showArchived.value) studentsStore.fetchArchivedStudents()
}

// ── Modal ──────────────────────────────────────────────────────────────────
const openModal = (student) => { selectedStudent.value = student || null; modalMode.value = 'edit'; showModal.value = true }
const viewStudent = (student) => { selectedStudent.value = student; modalMode.value = 'view'; showModal.value = true }
const editStudent = (student) => { selectedStudent.value = student; modalMode.value = 'edit'; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedStudent.value = null; modalMode.value = 'edit' }

const submitStudent = async (data) => {
  try {
    if (data.id) {
      await studentsStore.updateStudent(data.id, data)
    } else {
      await studentsStore.createStudent({ ...data, password: 'Cbt@2026' })
    }
    uiStore.addToast({ title: 'Student saved', message: 'Student record has been saved.', variant: 'success' })
    setTimeout(closeModal, 100)
  } catch {
    uiStore.addToast({ title: 'Error', message: 'Failed to save student.', variant: 'error' })
    setTimeout(closeModal, 100)
  }
}

// ── Revoke / restore / delete ──────────────────────────────────────────────
const revokeStudent = async (id) => {
  if (!confirm("Revoke this student's privileges? They will be moved to archive.")) return
  revokeLoading.value = new Set([...revokeLoading.value, id])
  try {
    await studentsStore.revokeStudent(id)
    uiStore.addToast({ title: 'Student revoked', message: 'Moved to archive.', variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed to revoke.', variant: 'error' })
  } finally {
    revokeLoading.value = new Set([...revokeLoading.value].filter((x) => x !== id))
  }
}

const revokeSelectedStudents = async () => {
  const ids = Array.from(selectedStudents.value)
  if (!confirm(`Revoke ${ids.length} student(s)?`)) return
  isRevokingSelected.value = true
  try {
    for (const id of ids) await studentsStore.revokeStudent(id)
    cancelSelectMode()
    uiStore.addToast({ title: 'Students revoked', message: `${ids.length} student(s) moved to archive.`, variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' })
  } finally {
    isRevokingSelected.value = false
  }
}

const restoreArchivedStudent = async (id) => {
  if (!confirm('Restore this student?')) return
  restoreLoading.value = new Set([...restoreLoading.value, id])
  try {
    await studentsStore.restoreStudent(id)
    uiStore.addToast({ title: 'Student restored', message: 'Student has been restored.', variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' })
  } finally {
    restoreLoading.value = new Set([...restoreLoading.value].filter((x) => x !== id))
  }
}

const restoreSelectedArchivedStudents = async () => {
  const ids = Array.from(selectedArchivedStudents.value)
  if (!confirm(`Restore ${ids.length} student(s)?`)) return
  isRestoringArchivedSelected.value = true
  try {
    for (const id of ids) await studentsStore.restoreStudent(id)
    cancelArchivedSelectMode()
    uiStore.addToast({ title: 'Restored', message: `${ids.length} student(s) restored.`, variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' })
  } finally {
    isRestoringArchivedSelected.value = false
  }
}

const deleteArchivedStudent = async (id) => {
  if (!confirm('Permanently delete this student? This cannot be undone.')) return
  deleteLoading.value = new Set([...deleteLoading.value, id])
  try {
    await studentsStore.deleteStudentFromStore(id)
    uiStore.addToast({ title: 'Student deleted', message: 'Student permanently deleted.', variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' })
  } finally {
    deleteLoading.value = new Set([...deleteLoading.value].filter((x) => x !== id))
  }
}

const deleteSelectedArchivedStudents = async () => {
  const ids = Array.from(selectedArchivedStudents.value)
  if (!confirm(`Permanently delete ${ids.length} student(s)? This cannot be undone.`)) return
  isDeletingArchivedSelected.value = true
  try {
    for (const id of ids) await studentsStore.deleteStudentFromStore(id)
    cancelArchivedSelectMode()
    uiStore.addToast({ title: 'Deleted', message: `${ids.length} student(s) permanently deleted.`, variant: 'success' })
  } catch (e) {
    uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' })
  } finally {
    isDeletingArchivedSelected.value = false
  }
}

const goToImport = () => router.push('/school-admin/students/import')

// ── Watchers ───────────────────────────────────────────────────────────────
watch(searchQuery, () => { studentsPage.value = 1; selectedStudents.value = new Set() })
watch(studentsTotalPages, (total) => { if (studentsPage.value > total) studentsPage.value = total })
watch(archivedStudentsTotalPages, (total) => { if (archivedStudentsPage.value > total) archivedStudentsPage.value = total })
watch(showArchived, () => { cancelSelectMode(); cancelArchivedSelectMode() })

onMounted(() => studentsStore.fetchStudents())
</script>
