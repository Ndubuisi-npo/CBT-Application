<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessments"
      subtitle="Open active assessments and create subject assignments for your classroom." 
      eyebrow="Assessments"
    />

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-4">
        <AppInput v-model="searchQuery" label="Search" placeholder="Search assessments…" />
        <AppSelect v-model="filterClassLevel" label="Class" :options="classLevelOptions" placeholder="All classes" />
        <div class="lg:col-span-2 flex flex-wrap items-end gap-2">
          <AppButton text="Open Assessment" variant="primary" size="sm" :disabled="!selectedAssessmentId" @click="openAssessment" />
          <span v-if="selectedAssessmentId" class="text-sm text-slate-500">Ready to open mock assessment.</span>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Title</th>
              <th class="px-5 py-3">Description</th>
              <th class="px-5 py-3">Due</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Marks</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="assessment in visibleAssessments" :key="assessment.id" class="group hover:bg-slate-50">
              <td class="px-5 py-4 font-semibold text-slate-900">{{ assessment.title }}</td>
              <td class="px-5 py-4 text-slate-500">{{ assessment.description }}</td>
              <td class="px-5 py-4">{{ assessment.dueDate }} · {{ assessment.dueTime }}</td>
              <td class="px-5 py-4">{{ getClassLevelName(assessment.classLevelId) }}{{ assessment.classArmId ? ` ${getClassArmName(assessment.classArmId)}` : '' }}</td>
              <td class="px-5 py-4">{{ assessment.totalMarks }}</td>
              <td class="px-5 py-4"><AppBadge :label="assessment.status" :variant="getStatusVariant(assessment.status)" /></td>
              <td class="px-5 py-4">
                <AppButton text="Open" variant="outline" size="sm" @click="selectAssessment(assessment.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import {
  currentTeacherId,
  getTeacherAssessments,
  getClassLevelOptions,
  getClassLevelName,
  getClassArmName,
  getStatusVariant,
} from '../../assessments/mockAssessments'

const router = useRouter()
const searchQuery = ref('')
const filterClassLevel = ref('')
const selectedAssessmentId = ref(null)
const classLevelOptions = getClassLevelOptions()
const assessments = getTeacherAssessments(currentTeacherId)

const visibleAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return assessments.filter((assessment) => {
    const matchesSearch = query ? `${assessment.title} ${assessment.description}`.toLowerCase().includes(query) : true
    const matchesClass = filterClassLevel.value ? assessment.classLevelId === Number(filterClassLevel.value) : true
    return matchesSearch && matchesClass
  })
})

const selectAssessment = (id) => {
  selectedAssessmentId.value = id
  router.push(`/teachers/assessments/${id}`)
}
const openAssessment = () => {
  if (!selectedAssessmentId.value) return
  router.push(`/teachers/assessments/${selectedAssessmentId.value}`)
}
</script>
