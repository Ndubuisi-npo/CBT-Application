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
              <th class="px-5 py-3">Assessment</th>
              <th class="px-5 py-3">Type</th>
              <th class="px-5 py-3 text-right">Marks</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="assessment in visibleAssessments" :key="assessment.id" class="group align-top hover:bg-slate-50">
              <td class="w-[320px] max-w-[360px] px-5 py-4">
                <p class="text-[15px] font-semibold leading-5 text-slate-900">{{ assessment.title }}</p>
              </td>
              <td class="px-5 py-4 text-slate-600">{{ getAssessmentTypeLabel(assessment) }}</td>
              <td class="px-5 py-4 text-right font-medium text-slate-700">{{ assessment.totalMarks }}</td>
              <td class="px-5 py-4 text-slate-600">{{ getClassLevelName(assessment.classLevelId) }}{{ assessment.classArmId ? ` ${getClassArmName(assessment.classArmId)}` : '' }}</td>
              <td class="px-5 py-4">
                <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.status)" />
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <AppButton text="Open" variant="outline" size="sm" @click="selectAssessment(assessment.id)" />
                </div>
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

const getAssessmentTypeLabel = (assessment) => (assessment.category === 'exam' ? 'Exam' : 'Test')
const getAssessmentStatusLabel = (assessment) => {
  if (assessment.isOpenForStudents) return 'Student Active'
  if (assessment.isOpenForTeachers) return 'Teacher Open'
  return assessment.status === 'draft' ? 'Draft' : 'Active'
}

const selectAssessment = (id) => {
  selectedAssessmentId.value = id
  router.push(`/teachers/assessments/${id}`)
}
const openAssessment = () => {
  if (!selectedAssessmentId.value) return
  router.push(`/teachers/assessments/${selectedAssessmentId.value}`)
}
</script>
