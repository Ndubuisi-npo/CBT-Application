<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Subjects</h1>
        <p class="mt-1 text-sm text-slate-500">Manage subjects, codes, class level assignments, and teacher assignments.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton v-if="selectedSubjects.size" text="Delete Selected" variant="danger" size="sm" @click="deleteSelected" />
        <AppButton v-if="isSelectMode" text="Cancel" variant="ghost" size="sm" @click="cancelSelectMode" />
        <AppButton v-if="!isSelectMode" :icon="CheckSquare" text="Select" variant="ghost" size="sm" @click="startSelectMode" />
        <AppButton :icon="Plus" text="Create Subject" variant="primary" size="sm" @click="openModal()" />
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white">
      <SkeletonRows v-if="subjectsStore.loading" :columns="5" class="hidden lg:block" />
      <div v-if="subjectsStore.loading" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="!subjectsStore.subjects.length"
        :icon="Shapes"
        title="No subjects yet"
        description="Create subjects to build out your curriculum."
        class="m-4 border-0"
      >
        <template #actions>
          <AppButton :icon="Plus" text="Create First Subject" variant="primary" size="sm" @click="openModal()" />
        </template>
      </AppEmptyState>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50">
                <th v-if="isSelectMode" class="w-10 px-5 py-3">
                  <input type="checkbox" :checked="areAllSelected" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleSelectAll($event.target.checked)" />
                </th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Subject Name</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Code</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Class Levels</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Assigned Teachers</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="subject in paginatedSubjects" :key="subject.id" class="group transition hover:bg-slate-50/70">
                <td v-if="isSelectMode" class="px-5 py-3.5">
                  <input type="checkbox" :checked="selectedSubjects.has(subject.id)" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleItemSelection(subject.id, $event.target.checked)" />
                </td>
                <td class="px-5 py-3.5 font-semibold text-slate-900">{{ subject.name }}</td>
                <td class="px-5 py-3.5">
                  <span v-if="subject.code" class="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{{ subject.code }}</span>
                  <span v-else class="text-slate-400">N/A</span>
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ formatClassLevels(subject) }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ formatAssignedTeachers(subject) }}</td>
                <td class="px-5 py-3.5">
                  <ResponsiveTableActions :actions="subjectActions(subject)" :entity-label="subject.name" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="subject in paginatedSubjects"
            :key="subject.id"
            avatar-color="bg-[#0B1F3A]/10 text-[#0B1F3A]"
            :avatar-text="(subject.code || subject.name || '?').slice(0, 2).toUpperCase()"
            :title="subject.name"
            :subtitle="subject.code || 'No code'"
            :fields="[
              { label: 'Class Levels', value: formatClassLevels(subject), span: 2 },
              { label: 'Assigned Teachers', value: formatAssignedTeachers(subject), span: 2 },
            ]"
          >
            <template #actions>
              <ResponsiveTableActions :actions="subjectActions(subject)" :entity-label="subject.name" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>

      <div v-if="subjectsStore.subjects.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ startIndex }}–{{ endIndex }} of {{ subjectsStore.subjects.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ currentPage }} / {{ totalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <SubjectFormDrawer :show="showModal" :subject="selectedSubject" :saving="savingSubject" @close="closeModal" @submit="submitSubject" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { CheckSquare, ChevronLeft, ChevronRight, Pencil, Plus, Shapes, Trash2, UserCog } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import SubjectFormDrawer from '../components/SubjectFormDrawer.vue'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminUiStore } from '../stores/ui'
import { useRouter } from 'vue-router'

const router = useRouter()
const subjectsStore = useSchoolAdminSubjectsStore()
const uiStore = useSchoolAdminUiStore()

const isSelectMode = ref(false)
const selectedSubjects = ref(new Set())
const showModal = ref(false)
const selectedSubject = ref(null)
const savingSubject = ref(false)
const deleteLoading = ref(new Set())
const itemsPerPage = 10
const currentPage = ref(1)

const areAllSelected = computed(() =>
  subjectsStore.subjects.length > 0 && subjectsStore.subjects.every((s) => selectedSubjects.value.has(s.id)),
)
const totalPages = computed(() => Math.max(1, Math.ceil(subjectsStore.subjects.length / itemsPerPage)))
const startIndex = computed(() => subjectsStore.subjects.length ? (currentPage.value - 1) * itemsPerPage + 1 : 0)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, subjectsStore.subjects.length))
const paginatedSubjects = computed(() => subjectsStore.subjects.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

const formatClassLevels = (s) => {
  const levels = Array.isArray(s.class_levels) ? s.class_levels : Array.isArray(s.classLevels) ? s.classLevels : []
  return levels.length ? levels.map((l) => l.name).join(', ') : 'N/A'
}
const formatAssignedTeachers = (s) => {
  const assignments = Array.isArray(s.teacher_assignments) ? s.teacher_assignments : Array.isArray(s.teacherAssignments) ? s.teacherAssignments : []
  const names = assignments.map((a) => a.user ? `${a.user.first_name} ${a.user.last_name}`.trim() : null).filter(Boolean)
  return names.length ? names.join(', ') : 'N/A'
}

const subjectActions = (subject) => [
  { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openModal(subject) },
  { key: 'assign', label: 'Assign Teacher', icon: UserCog, onClick: () => router.push(`/school-admin/subjects/${subject.id}/assign-teacher`) },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    loading: deleteLoading.value.has(subject.id),
    loadingLabel: 'Deleting…',
    onClick: () => deleteSubject(subject.id),
  },
]

const startSelectMode = () => { isSelectMode.value = true; selectedSubjects.value = new Set() }
const cancelSelectMode = () => { isSelectMode.value = false; selectedSubjects.value = new Set() }
const toggleSelectAll = (checked) => { const next = new Set(); if (checked) subjectsStore.subjects.forEach((s) => next.add(s.id)); selectedSubjects.value = next }
const toggleItemSelection = (id, checked) => { const next = new Set(selectedSubjects.value); checked ? next.add(id) : next.delete(id); selectedSubjects.value = next }

const openModal = (s) => { selectedSubject.value = s || null; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedSubject.value = null }

const deleteSelected = async () => {
  const ids = Array.from(selectedSubjects.value)
  if (!confirm(`Delete ${ids.length} subject(s)? This cannot be undone.`)) return
  try {
    ids.forEach((id) => deleteLoading.value.add(id))
    for (const id of ids) await subjectsStore.deleteSubject(id)
    cancelSelectMode()
    uiStore.addToast({ title: 'Deleted', message: `${ids.length} subject(s) deleted.`, variant: 'success' })
  } catch { uiStore.addToast({ title: 'Error', message: 'Failed to delete subjects.', variant: 'error' }) }
  finally { deleteLoading.value = new Set() }
}

const deleteSubject = async (id) => {
  if (!confirm('Delete this subject? This cannot be undone.')) return
  deleteLoading.value = new Set([...deleteLoading.value, id])
  try { await subjectsStore.deleteSubject(id); uiStore.addToast({ title: 'Deleted', message: 'Subject deleted.', variant: 'success' }) }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to delete subject.', variant: 'error' }) }
  finally { deleteLoading.value = new Set([...deleteLoading.value].filter((x) => x !== id)) }
}

const submitSubject = async (data) => {
  savingSubject.value = true
  try {
    const { id, ...payload } = data
    id ? await subjectsStore.updateSubject(id, payload) : await subjectsStore.createSubject(payload)
    uiStore.addToast({ title: 'Subject saved', message: 'Subject saved successfully.', variant: 'success' })
    closeModal()
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error?.response?.data?.message || error?.message || 'Failed to save subject.', variant: 'error' })
  } finally {
    savingSubject.value = false
  }
}

onMounted(async () => {
  try { await subjectsStore.fetchSubjects() }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to load subjects.', variant: 'error' }) }
})
</script>
