<template>
  <div class="space-y-6">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {{ showArchived ? 'Archived Teachers' : 'Teachers' }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ showArchived ? 'View and restore revoked staff accounts.' : 'Manage staff records, contacts, and class assignments.' }}
        </p>
      </div>
      <div v-if="!showArchived" class="flex flex-wrap items-center gap-2">
        <AppButton :icon="UploadCloud" text="Bulk Upload Teachers" variant="outline" size="sm" @click="goToImport" />
        <AppButton data-tour="create-teacher-btn" :icon="Plus" text="Add Teacher" variant="primary" size="sm" @click="openModal()" />
      </div>
      <div v-else>
        <AppButton text="← Back to Active" variant="outline" size="sm" @click="toggleView" />
      </div>
    </div>

    <!-- ── Active Teachers table ──────────────────────────────────────────── -->
    <section v-if="!showArchived" class="rounded-2xl border border-slate-200 bg-white">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search teachers…"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#0B1F3A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <div class="flex items-center gap-2">
          <span v-if="selectedTeachers.size" class="text-xs text-slate-500">{{ selectedTeachers.size }} selected</span>
          <AppButton v-if="selectedTeachers.size" text="Revoke Selected" variant="warning" size="sm" :processing="isRevokingSelected" @click="revokeSelectedTeachers" />
          <AppButton v-if="isSelectMode" text="Cancel" variant="ghost" size="sm" @click="cancelSelectMode" />
          <AppButton v-if="!isSelectMode" :icon="CheckSquare" text="Select" variant="ghost" size="sm" @click="startSelectMode" />
          <button
            type="button"
            class="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-700"
            @click="toggleView"
          >
            <Archive class="h-4 w-4" />
            <span>Archived</span>
            <span v-if="teachersStore.totalArchivedTeachers > 0" class="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#D4AF37]/90 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
              {{ teachersStore.totalArchivedTeachers }}
            </span>
          </button>
        </div>
      </div>

      <SkeletonRows v-if="teachersStore.loading" :columns="6" class="hidden lg:block" />
      <div v-if="teachersStore.loading" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-36 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="!filteredTeachers.length"
        :icon="Users"
        :title="searchQuery ? 'No teachers found' : 'No teachers yet'"
        :description="searchQuery ? 'Try adjusting your search.' : 'Add your first staff member.'"
        class="m-4 border-0"
      >
        <template #actions>
          <AppButton v-if="searchQuery" text="Clear Search" variant="outline" size="sm" @click="searchQuery = ''" />
          <AppButton v-if="!searchQuery" :icon="Plus" text="Add First Teacher" variant="primary" size="sm" @click="openModal()" />
        </template>
      </AppEmptyState>

      <template v-else>
        <!-- Desktop table (lg and up) -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50">
                <th v-if="isSelectMode" class="w-10 px-5 py-3">
                  <input type="checkbox" :checked="areAllVisibleSelected" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" @change="toggleVisibleTeachers($event.target.checked)" />
                </th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Teacher</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Staff ID</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Phone</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Gender</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Qualification</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="teacher in paginatedTeachers" :key="teacher.id" class="group transition hover:bg-slate-50/70">
                <td v-if="isSelectMode" class="px-5 py-3.5">
                  <input type="checkbox" :checked="selectedTeachers.has(teacher.id)" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]" @change="toggleTeacherSelection(teacher.id, $event.target.checked)" />
                </td>
                <!-- Name + avatar -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                      {{ initials(teacher) }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">{{ teacher.first_name }} {{ teacher.last_name }}</p>
                      <p class="text-xs text-slate-500">{{ teacher.email || 'N/A' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || 'N/A' }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ teacher.phone || 'N/A' }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ teacher.teacherProfile?.gender || teacher.teacher_profile?.gender || teacher.gender || 'N/A' }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ teacher.teacherProfile?.qualification || teacher.teacher_profile?.qualification || 'N/A' }}</td>
                <td class="px-5 py-3.5">
                  <ResponsiveTableActions :actions="teacherActions(teacher)" :entity-label="teacherFullName(teacher)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tablet & mobile cards (below lg) -->
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="teacher in paginatedTeachers"
            :key="teacher.id"
            :avatar-text="initials(teacher)"
            avatar-color="bg-emerald-50 text-emerald-700"
            :title="teacherFullName(teacher)"
            :subtitle="teacher.email || 'N/A'"
            :fields="[
              { label: 'Staff ID', value: teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || 'N/A' },
              { label: 'Phone', value: teacher.phone || 'N/A' },
              { label: 'Gender', value: teacher.teacherProfile?.gender || teacher.teacher_profile?.gender || teacher.gender || 'N/A' },
              { label: 'Qualification', value: teacher.teacherProfile?.qualification || teacher.teacher_profile?.qualification || 'N/A', span: 2 },
            ]"
            clickable
            @click="viewTeacher(teacher)"
          >
            <template #badge>
              <AppBadge :label="teacher.is_active !== false ? 'Active' : 'Inactive'" :variant="teacher.is_active !== false ? 'success' : 'danger'" dot />
            </template>
            <template #actions>
              <ResponsiveTableActions :actions="teacherActions(teacher)" :entity-label="teacherFullName(teacher)" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>

      <!-- Pagination -->
      <div v-if="filteredTeachers.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ teachersStartIndex }}–{{ teachersEndIndex }} of {{ filteredTeachers.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="teachersPage === 1" @click="teachersPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ teachersPage }} / {{ teachersTotalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="teachersPage === teachersTotalPages" @click="teachersPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <!-- ── Archived Teachers table ────────────────────────────────────────── -->
    <section v-if="showArchived" class="rounded-2xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span v-if="selectedArchivedTeachers.size" class="text-xs text-slate-500">{{ selectedArchivedTeachers.size }} selected</span>
        <AppButton v-if="selectedArchivedTeachers.size" text="Restore Selected" variant="success" size="sm" :processing="isRestoringArchivedSelected" @click="restoreSelectedArchivedTeachers" />
        <AppButton v-if="selectedArchivedTeachers.size" text="Delete Selected" variant="danger" size="sm" :processing="isDeletingArchivedSelected" @click="deleteSelectedArchivedTeachers" />
        <AppButton v-if="isArchivedSelectMode" text="Cancel" variant="ghost" size="sm" @click="cancelArchivedSelectMode" />
        <AppButton v-if="!isArchivedSelectMode" :icon="CheckSquare" text="Select" variant="ghost" size="sm" @click="startArchivedSelectMode" />
      </div>

      <SkeletonRows v-if="teachersStore.loading" :columns="5" class="hidden lg:block" />
      <div v-if="teachersStore.loading" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <AppEmptyState
        v-else-if="!teachersStore.archivedTeachers.length"
        :icon="Archive"
        title="No archived teachers"
        description="Revoked teachers will appear here."
        class="m-4 border-0"
      />

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50">
                <th v-if="isArchivedSelectMode" class="w-10 px-5 py-3">
                  <input type="checkbox" :checked="areAllVisibleArchivedSelected" class="h-4 w-4 rounded border-slate-300" @change="toggleVisibleArchivedTeachers($event.target.checked)" />
                </th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Teacher</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Staff ID</th>
                <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Phone</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="teacher in paginatedArchivedTeachers" :key="teacher.id" class="group opacity-60 transition hover:opacity-90">
                <td v-if="isArchivedSelectMode" class="px-5 py-3.5">
                  <input type="checkbox" :checked="selectedArchivedTeachers.has(teacher.id)" class="h-4 w-4 rounded border-slate-300" @change="toggleArchivedTeacherSelection(teacher.id, $event.target.checked)" />
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">{{ initials(teacher) }}</div>
                    <div>
                      <p class="font-medium text-slate-700">{{ teacher.first_name }} {{ teacher.last_name }}</p>
                      <p class="text-xs text-slate-400">{{ teacher.email || 'N/A' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-500">{{ teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || 'N/A' }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-500">{{ teacher.phone || 'N/A' }}</td>
                <td class="px-5 py-3.5">
                  <ResponsiveTableActions :actions="archivedTeacherActions(teacher)" :entity-label="teacherFullName(teacher)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tablet & mobile cards -->
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <ResponsiveDataCard
            v-for="teacher in paginatedArchivedTeachers"
            :key="teacher.id"
            :avatar-text="initials(teacher)"
            avatar-color="bg-slate-200 text-slate-500"
            :title="teacherFullName(teacher)"
            :subtitle="teacher.email || 'N/A'"
            class="opacity-75"
            :fields="[
              { label: 'Staff ID', value: teacher.teacherProfile?.staff_id || teacher.teacher_profile?.staff_id || 'N/A' },
              { label: 'Phone', value: teacher.phone || 'N/A' },
            ]"
          >
            <template #badge>
              <AppBadge label="Archived" variant="default" />
            </template>
            <template #actions>
              <ResponsiveTableActions :actions="archivedTeacherActions(teacher)" :entity-label="teacherFullName(teacher)" always-visible />
            </template>
          </ResponsiveDataCard>
        </div>
      </template>

      <div v-if="teachersStore.archivedTeachers.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ archivedTeachersStartIndex }}–{{ archivedTeachersEndIndex }} of {{ teachersStore.archivedTeachers.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="archivedTeachersPage === 1" @click="archivedTeachersPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ archivedTeachersPage }} / {{ archivedTeachersTotalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="archivedTeachersPage === archivedTeachersTotalPages" @click="archivedTeachersPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <!-- ── Drawer ──────────────────────────────────────────────────────────── -->
    <TeacherFormDrawer
      :show="showModal"
      :teacher="selectedTeacher"
      :saving="savingTeacher"
      @close="closeModal"
      @submit="submitTeacher"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Archive, Ban, CheckSquare, ChevronLeft, ChevronRight, Eye, Pencil, Plus, RotateCcw, Search, Trash2, UploadCloud, Users } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppBadge from '../../shared/AppBadge.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import ResponsiveTableActions from '../../shared/ResponsiveTableActions.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import TeacherFormDrawer from '../components/TeacherFormDrawer.vue'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'
import { isNameTakenError } from '../../../js/lib/api'

const router = useRouter()
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()

// ── State ──────────────────────────────────────────────────────────────────
const showModal           = ref(false)
const selectedTeacher     = ref(null)
const savingTeacher        = ref(false)
const showArchived        = ref(false)
const searchQuery         = ref('')
const isSelectMode        = ref(false)
const selectedTeachers    = ref(new Set())
const isArchivedSelectMode        = ref(false)
const selectedArchivedTeachers    = ref(new Set())
const revokeLoading   = ref(new Set())
const restoreLoading  = ref(new Set())
const deleteLoading   = ref(new Set())
const isRevokingSelected            = ref(false)
const isRestoringArchivedSelected   = ref(false)
const isDeletingArchivedSelected    = ref(false)
const itemsPerPage        = 10
const teachersPage        = ref(1)
const archivedTeachersPage = ref(1)

// ── Helpers ────────────────────────────────────────────────────────────────
const initials = (t) => `${t.first_name?.[0] || ''}${t.last_name?.[0] || ''}`.toUpperCase() || '?'
const teacherFullName = (t) => `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Teacher'

const teacherActions = (teacher) => [
  { key: 'view', label: 'Preview', icon: Eye, onClick: () => viewTeacher(teacher) },
  { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => editTeacher(teacher) },
  {
    key: 'revoke',
    label: 'Revoke',
    icon: Ban,
    variant: 'warning',
    loading: revokeLoading.value.has(teacher.id),
    loadingLabel: 'Revoking…',
    onClick: () => revokeTeacher(teacher.id),
  },
]

const archivedTeacherActions = (teacher) => [
  {
    key: 'restore',
    label: 'Restore',
    icon: RotateCcw,
    variant: 'success',
    loading: restoreLoading.value.has(teacher.id),
    loadingLabel: 'Restoring…',
    onClick: () => restoreArchivedTeacher(teacher.id),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    loading: deleteLoading.value.has(teacher.id),
    loadingLabel: 'Deleting…',
    onClick: () => deleteArchivedTeacher(teacher.id),
  },
]

// ── Filtered ───────────────────────────────────────────────────────────────
const filteredTeachers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return teachersStore.teachers
  return teachersStore.teachers.filter((t) => {
    const name = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase()
    return name.includes(q) || (t.email || '').toLowerCase().includes(q) || (t.phone || '').toLowerCase().includes(q) ||
      (t.teacher_profile?.staff_id || t.teacherProfile?.staff_id || '').toLowerCase().includes(q) ||
      (t.teacher_profile?.qualification || t.teacherProfile?.qualification || '').toLowerCase().includes(q)
  })
})

// ── Pagination ─────────────────────────────────────────────────────────────
const teachersTotalPages = computed(() => Math.max(1, Math.ceil(filteredTeachers.value.length / itemsPerPage)))
const archivedTeachersTotalPages = computed(() => Math.max(1, Math.ceil(teachersStore.archivedTeachers.length / itemsPerPage)))
const paginate = (items, page) => items.slice((page - 1) * itemsPerPage, page * itemsPerPage)
const paginatedTeachers = computed(() => paginate(filteredTeachers.value, teachersPage.value))
const paginatedArchivedTeachers = computed(() => paginate(teachersStore.archivedTeachers, archivedTeachersPage.value))
const teachersStartIndex = computed(() => filteredTeachers.value.length ? (teachersPage.value - 1) * itemsPerPage + 1 : 0)
const teachersEndIndex = computed(() => Math.min(teachersPage.value * itemsPerPage, filteredTeachers.value.length))
const archivedTeachersStartIndex = computed(() => teachersStore.archivedTeachers.length ? (archivedTeachersPage.value - 1) * itemsPerPage + 1 : 0)
const archivedTeachersEndIndex = computed(() => Math.min(archivedTeachersPage.value * itemsPerPage, teachersStore.archivedTeachers.length))

// ── Selection ──────────────────────────────────────────────────────────────
const areAllVisibleSelected = computed(() => paginatedTeachers.value.length > 0 && paginatedTeachers.value.every((t) => selectedTeachers.value.has(t.id)))
const areAllVisibleArchivedSelected = computed(() => paginatedArchivedTeachers.value.length > 0 && paginatedArchivedTeachers.value.every((t) => selectedArchivedTeachers.value.has(t.id)))

const toggleVisibleTeachers = (checked) => {
  const next = new Set(selectedTeachers.value); paginatedTeachers.value.forEach((t) => (checked ? next.add(t.id) : next.delete(t.id))); selectedTeachers.value = next
}
const toggleTeacherSelection = (id, checked) => {
  const next = new Set(selectedTeachers.value); checked ? next.add(id) : next.delete(id); selectedTeachers.value = next
}
const toggleVisibleArchivedTeachers = (checked) => {
  const next = new Set(selectedArchivedTeachers.value); paginatedArchivedTeachers.value.forEach((t) => (checked ? next.add(t.id) : next.delete(t.id))); selectedArchivedTeachers.value = next
}
const toggleArchivedTeacherSelection = (id, checked) => {
  const next = new Set(selectedArchivedTeachers.value); checked ? next.add(id) : next.delete(id); selectedArchivedTeachers.value = next
}
const startSelectMode = () => { isSelectMode.value = true; selectedTeachers.value = new Set() }
const cancelSelectMode = () => { isSelectMode.value = false; selectedTeachers.value = new Set() }
const startArchivedSelectMode = () => { isArchivedSelectMode.value = true; selectedArchivedTeachers.value = new Set() }
const cancelArchivedSelectMode = () => { isArchivedSelectMode.value = false; selectedArchivedTeachers.value = new Set() }

// ── View toggle ────────────────────────────────────────────────────────────
const toggleView = () => {
  showArchived.value = !showArchived.value; teachersPage.value = 1; archivedTeachersPage.value = 1
  cancelSelectMode(); cancelArchivedSelectMode()
  if (showArchived.value) teachersStore.fetchArchivedTeachers()
}

// ── Modal ──────────────────────────────────────────────────────────────────
const openModal = (t) => { selectedTeacher.value = t || null; showModal.value = true }
const viewTeacher = (t) => router.push({ name: 'SchoolAdminTeacherProfile', params: { id: t.id } })
const editTeacher = (t) => { selectedTeacher.value = t; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedTeacher.value = null }

const submitTeacher = async (data) => {
  savingTeacher.value = true
  try {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      qualification: data.qualification,
      staff_id: data.staff_id,
      date_joined: data.date_joined,
    }
    if (data.id) {
      await teachersStore.updateTeacher(data.id, payload)
    } else {
      await teachersStore.createTeacher({ ...payload, password: 'teach12345' })
    }
    uiStore.addToast({ title: 'Teacher saved', message: 'Teacher has been saved successfully.', variant: 'success' })
    closeModal()
  } catch (error) {
    if (isNameTakenError(error)) {
      uiStore.addToast({ title: 'Name taken', message: 'That name has already been taken.', variant: 'error' })
    } else {
      uiStore.addToast({ title: 'Error', message: error?.response?.data?.message || error?.message || 'Failed to save teacher.', variant: 'error' })
    }
  } finally {
    savingTeacher.value = false
  }
}

// ── Revoke / restore / delete ──────────────────────────────────────────────
const revokeTeacher = async (id) => {
  if (!confirm("Revoke this teacher's privileges? They will be moved to archive.")) return
  revokeLoading.value = new Set([...revokeLoading.value, id])
  try { await teachersStore.revokeTeacher(id); uiStore.addToast({ title: 'Teacher revoked', message: 'Moved to archive.', variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { revokeLoading.value = new Set([...revokeLoading.value].filter((x) => x !== id)) }
}

const revokeSelectedTeachers = async () => {
  const ids = Array.from(selectedTeachers.value)
  if (!confirm(`Revoke ${ids.length} teacher(s)?`)) return
  isRevokingSelected.value = true
  try { for (const id of ids) await teachersStore.revokeTeacher(id); cancelSelectMode(); uiStore.addToast({ title: 'Revoked', message: `${ids.length} teacher(s) moved to archive.`, variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { isRevokingSelected.value = false }
}

const restoreArchivedTeacher = async (id) => {
  if (!confirm('Restore this teacher?')) return
  restoreLoading.value = new Set([...restoreLoading.value, id])
  try { await teachersStore.restoreTeacher(id); uiStore.addToast({ title: 'Teacher restored', message: 'Teacher has been restored.', variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { restoreLoading.value = new Set([...restoreLoading.value].filter((x) => x !== id)) }
}

const restoreSelectedArchivedTeachers = async () => {
  const ids = Array.from(selectedArchivedTeachers.value)
  if (!confirm(`Restore ${ids.length} teacher(s)?`)) return
  isRestoringArchivedSelected.value = true
  try { for (const id of ids) await teachersStore.restoreTeacher(id); cancelArchivedSelectMode(); uiStore.addToast({ title: 'Restored', message: `${ids.length} teacher(s) restored.`, variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { isRestoringArchivedSelected.value = false }
}

const deleteArchivedTeacher = async (id) => {
  if (!confirm('Permanently delete this teacher? Cannot be undone.')) return
  deleteLoading.value = new Set([...deleteLoading.value, id])
  try { await teachersStore.deleteTeacherFromStore(id); uiStore.addToast({ title: 'Teacher deleted', message: 'Permanently deleted.', variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { deleteLoading.value = new Set([...deleteLoading.value].filter((x) => x !== id)) }
}

const deleteSelectedArchivedTeachers = async () => {
  const ids = Array.from(selectedArchivedTeachers.value)
  if (!confirm(`Permanently delete ${ids.length} teacher(s)? Cannot be undone.`)) return
  isDeletingArchivedSelected.value = true
  try { for (const id of ids) await teachersStore.deleteTeacherFromStore(id); cancelArchivedSelectMode(); uiStore.addToast({ title: 'Deleted', message: `${ids.length} teacher(s) permanently deleted.`, variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e.message || 'Failed.', variant: 'error' }) }
  finally { isDeletingArchivedSelected.value = false }
}

const goToImport = () => router.push('/school-admin/teachers/import')

// ── Watchers ───────────────────────────────────────────────────────────────
watch(searchQuery, () => { teachersPage.value = 1; selectedTeachers.value = new Set() })
watch(teachersTotalPages, (total) => { if (teachersPage.value > total) teachersPage.value = total })
watch(archivedTeachersTotalPages, (total) => { if (archivedTeachersPage.value > total) archivedTeachersPage.value = total })
watch(showArchived, () => { cancelSelectMode(); cancelArchivedSelectMode() })

onMounted(() => teachersStore.fetchTeachers())
</script>
