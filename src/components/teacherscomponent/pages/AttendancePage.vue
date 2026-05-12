<template>
  <div class="space-y-6">
    <SectionCard title="Attendance" subtitle="Capture daily attendance with simple present or absent checkboxes.">
      <template #header>
        <div class="flex flex-wrap gap-2">
          <AppButton text="Mark All Present" variant="outline" size="sm" @click="markAllPresent" />
          <AppButton text="Save Attendance" variant="primary" size="sm" @click="saveAttendance" />
        </div>
      </template>

      <div class="grid gap-4 pt-6 md:grid-cols-3">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><p class="text-sm text-slate-500">Present</p><p class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.present }}</p></div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><p class="text-sm text-slate-500">Absent</p><p class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.absent }}</p></div>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><p class="text-sm text-slate-500">Class</p><p class="mt-3 text-3xl font-semibold text-slate-900">{{ className }}</p></div>
      </div>
    </SectionCard>

    <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admission No</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Present</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Absent</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="record in records" :key="record.studentId">
              <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ record.studentName }}</td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ record.admissionNo }}</td>
              <td class="px-5 py-4">
                <input :checked="record.present" type="checkbox" class="h-4 w-4 rounded border-slate-300" @change="setPresence(record.studentId, true)" />
              </td>
              <td class="px-5 py-4">
                <input :checked="!record.present" type="checkbox" class="h-4 w-4 rounded border-slate-300" @change="setPresence(record.studentId, false)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { attendanceRecords, cloneMock } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()
const records = ref(cloneMock(attendanceRecords))
const className = 'SS2 Gold'

const summary = computed(() => ({
  present: records.value.filter((item) => item.present).length,
  absent: records.value.filter((item) => !item.present).length,
}))

const setPresence = (studentId, present) => {
  records.value = records.value.map((item) =>
    item.studentId === studentId ? { ...item, present } : item,
  )
}

const markAllPresent = () => {
  records.value = records.value.map((item) => ({ ...item, present: true }))
}

const saveAttendance = () => {
  uiStore.addToast({
    title: 'Attendance saved',
    message: `${className} attendance has been submitted successfully.`,
    variant: 'success',
  })
}
</script>
