<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Class Levels</h1>
        <p class="mt-1 text-sm text-slate-500">Manage class levels (e.g., JSS 1, SS 1) and their associated arms.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton v-if="selectedItems.size" text="Delete Selected" variant="danger" size="sm" @click="deleteSelected" />
        <AppButton v-if="isSelectMode" text="Cancel" variant="ghost" size="sm" @click="cancelSelectMode" />
        <AppButton v-if="!isSelectMode" :icon="CheckSquare" text="Select" variant="ghost" size="sm" @click="startSelectMode" />
        <AppButton :icon="Plus" text="Create Class Level" variant="primary" size="sm" @click="openModal()" />
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white">
      <SkeletonRows v-if="classLevelsStore.loading" :columns="3" />

      <div v-else-if="!classLevelsStore.classLevels.length" class="px-5 py-16 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Columns3 class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">No class levels yet</h3>
        <p class="mt-1.5 text-sm text-slate-500">Create class levels to organise your school's structure.</p>
        <div class="mt-5">
          <AppButton :icon="Plus" text="Create First Level" variant="primary" size="sm" @click="openModal()" />
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50">
              <th v-if="isSelectMode" class="w-10 px-5 py-3">
                <input type="checkbox" :checked="areAllSelected" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleSelectAll($event.target.checked)" />
              </th>
              <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Class Level</th>
              <th class="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Arms</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="level in paginatedLevels" :key="level.id" class="group transition hover:bg-slate-50/70">
              <td v-if="isSelectMode" class="px-5 py-3.5">
                <input type="checkbox" :checked="selectedItems.has(level.id)" class="h-4 w-4 rounded border-slate-300 text-[#D4AF37]" @change="toggleItemSelection(level.id, $event.target.checked)" />
              </td>
              <td class="px-5 py-3.5">
                <p class="font-semibold text-slate-900">{{ level.name }}</p>
              </td>
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {{ getClassesCount(level) }} arm{{ getClassesCount(level) !== 1 ? 's' : '' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100" @click="openModal(level)">Edit</button>
                  <RouterLink :to="`/school-admin/classes/${level.id}`" class="rounded-lg px-2.5 py-1 text-xs font-medium text-[#0B1F3A] ring-1 ring-slate-200 transition hover:bg-slate-100">View Arms</RouterLink>
                  <button class="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50" :disabled="deleteLoading.has(level.id)" @click="deleteClassLevel(level.id)">{{ deleteLoading.has(level.id) ? '…' : 'Delete' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="classLevelsStore.classLevels.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <p class="text-xs text-slate-500">Showing {{ startIndex }}–{{ endIndex }} of {{ classLevelsStore.classLevels.length }}</p>
        <div class="flex items-center gap-1.5">
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft class="h-4 w-4" /></button>
          <span class="px-2 text-xs font-medium text-slate-700">{{ currentPage }} / {{ totalPages }}</span>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <ClassLevelModal :show="showModal" :classLevel="selectedClassLevel" :loading="isSaving" @close="closeModal" @submit="submitClassLevel" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckSquare, ChevronLeft, ChevronRight, Columns3, Plus } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import ClassLevelModal from '../components/ClassLevelModal.vue'
import { useSchoolAdminClassLevelsStore } from '../stores/classLevels'
import { useSchoolAdminUiStore } from '../stores/ui'

const classLevelsStore = useSchoolAdminClassLevelsStore()
const uiStore = useSchoolAdminUiStore()

const isSelectMode = ref(false)
const selectedItems = ref(new Set())
const showModal = ref(false)
const selectedClassLevel = ref(null)
const deleteLoading = ref(new Set())
const isSaving = ref(false)
const itemsPerPage = 10
const currentPage = ref(1)

const areAllSelected = computed(() =>
  classLevelsStore.classLevels.length > 0 && classLevelsStore.classLevels.every((l) => selectedItems.value.has(l.id)),
)
const totalPages = computed(() => Math.max(1, Math.ceil(classLevelsStore.classLevels.length / itemsPerPage)))
const startIndex = computed(() => classLevelsStore.classLevels.length ? (currentPage.value - 1) * itemsPerPage + 1 : 0)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, classLevelsStore.classLevels.length))
const paginatedLevels = computed(() => classLevelsStore.classLevels.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

const getClassesCount = (l) => l.class_arms_count ?? 0

const startSelectMode = () => { isSelectMode.value = true; selectedItems.value = new Set() }
const cancelSelectMode = () => { isSelectMode.value = false; selectedItems.value = new Set() }
const toggleSelectAll = (checked) => { const next = new Set(); if (checked) classLevelsStore.classLevels.forEach((l) => next.add(l.id)); selectedItems.value = next }
const toggleItemSelection = (id, checked) => { const next = new Set(selectedItems.value); checked ? next.add(id) : next.delete(id); selectedItems.value = next }

const openModal = (l) => { selectedClassLevel.value = l || null; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedClassLevel.value = null }

const deleteSelected = async () => {
  const ids = Array.from(selectedItems.value)
  if (!confirm(`Delete ${ids.length} class level(s)? This cannot be undone.`)) return
  try {
    ids.forEach((id) => deleteLoading.value.add(id))
    for (const id of ids) await classLevelsStore.deleteClassLevel(id)
    cancelSelectMode()
    uiStore.addToast({ title: 'Deleted', message: `${ids.length} class level(s) deleted.`, variant: 'success' })
  } catch (e) { uiStore.addToast({ title: 'Error', message: e?.response?.data?.message || 'Failed to delete.', variant: 'error' }) }
  finally { deleteLoading.value = new Set() }
}

const deleteClassLevel = async (id) => {
  if (!confirm('Delete this class level? All associated arms will also be deleted.')) return
  deleteLoading.value = new Set([...deleteLoading.value, id])
  try { await classLevelsStore.deleteClassLevel(id); uiStore.addToast({ title: 'Deleted', message: 'Class level deleted.', variant: 'success' }) }
  catch (e) { uiStore.addToast({ title: 'Error', message: e?.response?.data?.message || 'Failed.', variant: 'error' }) }
  finally { deleteLoading.value = new Set([...deleteLoading.value].filter((x) => x !== id)) }
}

const submitClassLevel = async (data) => {
  isSaving.value = true
  try {
    data.id ? await classLevelsStore.updateClassLevel(data.id, { name: data.name }) : await classLevelsStore.createClassLevel({ name: data.name })
    uiStore.addToast({ title: 'Saved', message: 'Class level saved.', variant: 'success' })
    setTimeout(closeModal, 100)
  } catch (e) { uiStore.addToast({ title: 'Error', message: e?.response?.data?.message || 'Failed.', variant: 'error' }) }
  finally { isSaving.value = false }
}

onMounted(async () => {
  try { await classLevelsStore.fetchClassLevels() }
  catch { uiStore.addToast({ title: 'Error', message: 'Failed to load class levels.', variant: 'error' }) }
})
</script>
