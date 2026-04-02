<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
    <SectionCard title="Grading Scale" subtitle="Adjust grade bands and score ranges for this tenant.">
      <div class="space-y-4">
        <div v-for="band in settingsStore.settings.gradingScale" :key="band.grade" class="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[80px_1fr_1fr] sm:items-center">
          <div class="rounded-2xl bg-[#0B1F3A] px-4 py-3 text-center text-sm font-semibold text-[#D4AF37]">{{ band.grade }}</div>
          <FormField label="Minimum score">
            <input v-model.number="band.min" type="number" class="sa-input" />
          </FormField>
          <FormField label="Maximum score">
            <input v-model.number="band.max" type="number" class="sa-input" />
          </FormField>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Assessment Weights" subtitle="Continuous Assessment and Exam scores must total 100%.">
      <div class="space-y-5">
        <FormField label="Continuous Assessment (%)" :error="weightError">
          <input v-model.number="settingsStore.settings.caWeight" type="number" class="sa-input" min="0" max="100" />
        </FormField>
        <FormField label="Exam (%)" :error="weightError">
          <input v-model.number="settingsStore.settings.examWeight" type="number" class="sa-input" min="0" max="100" />
        </FormField>

        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div class="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Total Allocation</span>
            <span>{{ totalWeight }}%</span>
          </div>
          <div class="mt-3 h-3 rounded-full bg-white">
            <div class="h-full rounded-full bg-gradient-to-r from-[#0B1F3A] to-[#D4AF37]" :style="{ width: `${Math.min(totalWeight, 100)}%` }"></div>
          </div>
        </div>

        <button type="button" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="submit">Save Settings</button>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import { useSchoolAdminSettingsStore } from '../stores/settings'
import { useSchoolAdminUiStore } from '../stores/ui'

const settingsStore = useSchoolAdminSettingsStore()
const uiStore = useSchoolAdminUiStore()

onMounted(() => {
  settingsStore.fetchSettings()
})

const totalWeight = computed(() => Number(settingsStore.settings.caWeight) + Number(settingsStore.settings.examWeight))
const weightError = computed(() => (totalWeight.value === 100 ? '' : 'Continuous Assessment and Exam must total 100%.'))

const submit = async () => {
  if (totalWeight.value !== 100) return
  await settingsStore.saveSettings(settingsStore.settings)
  uiStore.addToast({ title: 'Settings saved', message: 'School grading and assessment settings were updated.', variant: 'success' })
}
</script>
