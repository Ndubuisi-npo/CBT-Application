<template>
  <div class="space-y-6">
    <SectionCard title="Students" subtitle="Search and manage the students attached to your current teaching classes.">
      <template #header>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[220px]">
            <div class="relative">
              <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input v-model="searchQuery" type="text" class="student-input pl-12" placeholder="Search students..." />
            </div>
          </div>
        </div>
      </template>

      <div v-if="filteredStudents.length === 0" class="rounded-[24px] border border-slate-200 bg-white p-12 text-center mt-6">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Users class="h-12 w-12 text-slate-400" />
        </div>
        <h3 class="mt-6 text-xl font-semibold text-slate-900">No Students Found</h3>
        <p class="mt-2 text-slate-600">Try adjusting your search terms.</p>
      </div>

      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200 mt-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {{ heading }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="student in filteredStudents" :key="student.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.admissionNo }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">
                  <p class="font-semibold text-slate-900">{{ student.name }}</p>
                  <p class="text-xs text-slate-500">{{ student.gender }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.className }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.email }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ student.phone }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="View" variant="outline" size="xs" @click="notify(`Viewing ${student.name}'s profile card.`)" />
                    <AppButton text="Results" variant="outline" size="xs" @click="notify(`Opening ${student.name}'s objective results.`)" />
                    <AppButton text="Attendance" variant="outline" size="xs" @click="notify(`Opening ${student.name}'s attendance record.`)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Search, Users } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'
import SectionCard from '../components/SectionCard.vue'
import { teacherStudents, teacherProfile } from '../data/mockTeacherData'

const uiStore = useSchoolAdminUiStore()
const headings = ['Admission No', 'Student', 'Class', 'Email', 'Phone', 'Actions']
const searchQuery = ref('')

const filteredStudents = computed(() =>
  teacherStudents.filter((student) => {
    const haystack = `${student.name} ${student.admissionNo} ${student.className} ${student.email}`.toLowerCase()
    const isInAssignedClass = teacherProfile.assignedClasses.includes(student.className)
    return (
      isInAssignedClass &&
      (!searchQuery.value || haystack.includes(searchQuery.value.toLowerCase()))
    )
  }),
)

const notify = (message) => {
  uiStore.addToast({
    title: 'Student action',
    message,
    variant: 'success',
  })
}
</script>

<style scoped>
.student-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.75rem 1rem 0.75rem 3rem;
  font-size: 0.875rem;
  color: rgb(51 65 85);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.student-input:focus {
  border-color: #0b1f3a;
  box-shadow: 0 0 0 3px rgb(212 175 55 / 0.25);
}
</style>
