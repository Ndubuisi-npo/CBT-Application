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


        <AppButton type="button" text="Save Settings" full-width variant="primary" :processing="settingsStore.loading" @click="submit" />
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
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
