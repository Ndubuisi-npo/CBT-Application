<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Assessments"
      subtitle="Open active assessments and build your submission for each one."
      eyebrow="Assessments"
    />

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-4">
        <AppInput v-model="searchQuery" label="Search" placeholder="Search assessments…" />
        <AppSelect v-model="filterClassLevel" label="Class" :options="classLevelOptions" placeholder="All classes" />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="store.loading && !visibleAssessments.length" class="p-5">
        <SkeletonRows :rows="6" :columns="6" class="hidden lg:block" />
        <div class="grid gap-3 sm:grid-cols-2 lg:hidden">
          <div v-for="i in 6" :key="i" class="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div v-else class="hidden overflow-x-auto lg:block">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th class="px-5 py-3">Assessment</th>
              <th class="px-5 py-3 text-right">Marks Cap</th>
              <th class="px-5 py-3">Class</th>
              <th class="px-5 py-3">Term</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="!visibleAssessments.length">
              <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-500">No assessments are open for you right now.</td>
            </tr>
            <tr v-for="assessment in visibleAssessments" :key="assessment.id" class="group align-top hover:bg-slate-50">
              <td class="w-[320px] max-w-[360px] px-5 py-4">
                <p class="text-[15px] font-semibold leading-5 text-slate-900">{{ assessment.title }}</p>
              </td>
              <td class="px-5 py-4 text-right font-medium text-slate-700">{{ assessment.total_marks ?? assessment.totalMarks }}</td>
              <td class="px-5 py-4 text-slate-600">{{ classText(assessment) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ termText(assessment) }}</td>
              <td class="px-5 py-4">
                <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.status)" />
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <AppButton text="Open" variant="outline" size="sm" @click="openAssessment(assessment.id)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="visibleAssessments.length" class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <ResponsiveDataCard
          v-for="assessment in visibleAssessments"
          :key="assessment.id"
          avatar-color="bg-[#0B1F3A]/10 text-[#0B1F3A]"
          :avatar-text="(assessment.title || '?').slice(0, 2).toUpperCase()"
          :title="assessment.title"
          :fields="[
            { label: 'Marks Cap', value: assessment.total_marks ?? assessment.totalMarks ?? '—' },
            { label: 'Class', value: classText(assessment) },
            { label: 'Term', value: termText(assessment) },
          ]"
        >
          <template #badge>
            <AppBadge :label="getAssessmentStatusLabel(assessment)" :variant="getStatusVariant(assessment.status)" />
          </template>
          <template #actions>
            <AppButton text="Open" variant="outline" size="sm" @click="openAssessment(assessment.id)" />
          </template>
        </ResponsiveDataCard>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import ResponsiveDataCard from '../../shared/ResponsiveDataCard.vue'
import SkeletonRows from '../../schooladmincomponents/components/SkeletonRows.vue'
import { useAssessmentsStore, getStatusVariant, getAssessmentStatusLabel } from '../../schooladmincomponents/stores/assessments'

const router = useRouter()
const store = useAssessmentsStore()
const searchQuery = ref('')
const filterClassLevel = ref('')

const classLevelOptions = computed(() => store.classLevelOptions)

onMounted(async () => {
  await Promise.all([
    store.fetchRefData(),
    store.fetchTeacherAssessments(),
  ])
})

const classLevelName = (id) => store.classLevelOptions.find((o) => String(o.value) === String(id))?.label || ''
const classArmName = (id) => store.classArmOptions.find((o) => String(o.value) === String(id))?.label || ''
const classText = (a) => {
  const nestedLevel = a.classLevel?.name || a.class_level?.name || ''
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = nestedLevel || classLevelName(levelId)
  const arm = armId ? ` ${classArmName(armId)}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
}
const termText = (a) => a.term?.name || a.term_name || a.term?.title || '—'

const visibleAssessments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return store.assessments
    // Drafts aren't visible/actionable for teachers yet — nothing to build
    // against until an admin opens the assessment (§4/§9).
    .filter((assessment) => (assessment.status || '').toLowerCase() !== 'draft')
    .filter((assessment) => {
      const matchesSearch = query ? `${assessment.title || ''}`.toLowerCase().includes(query) : true
      const levelId = assessment.class_level_id ?? assessment.classLevelId
      const matchesClass = filterClassLevel.value ? String(levelId) === String(filterClassLevel.value) : true
      return matchesSearch && matchesClass
    })
})

const openAssessment = (id) => router.push(`/teachers/assessments/${id}`)
</script>
