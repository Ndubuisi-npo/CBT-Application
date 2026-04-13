<template>
  <div class="space-y-6">
    <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <OverviewCard title="Total Students" value="1,284" helper="Current enrolled learners" :icon="GraduationCap" />
      <OverviewCard title="Total Teachers" :value="`${teachersStore.teachers?.length || 0} Teachers`" helper="Teaching staff across levels" :icon="Users" />
      <OverviewCard title="Active Session" :value="activeSession" helper="Current academic cycle" :icon="CalendarClock" />
      <OverviewCard title="Total Classes" :value="`${classesStore.classes?.length || 0} Classes`" helper="Active classes configured" :icon="School" />
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Recent Activity" subtitle="Operational timeline for academic administration.">
        <div class="space-y-4">
          <div v-for="item in recentActivity" :key="item.title" class="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F3A] text-[#D4AF37]">
              <component :is="item.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ item.title }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Quick Status" subtitle="Snapshot of school setup readiness.">
        <div class="space-y-4">
          <div v-for="status in setupStatus" :key="status.label" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-slate-500">{{ status.label }}</p>
              <p class="text-sm font-semibold text-slate-900">{{ status.value }}</p>
            </div>
            <div class="mt-3 h-2 rounded-full bg-white">
              <div class="h-full rounded-full bg-gradient-to-r from-[#0B1F3A] to-[#D4AF37]" :style="{ width: status.progress }"></div>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { BookOpen, CalendarClock, GraduationCap, School, Users } from 'lucide-vue-next'
import OverviewCard from '../components/OverviewCard.vue'
import SectionCard from '../components/SectionCard.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminTeachersStore } from '../stores/teachers'

const sessionsStore = useSchoolAdminSessionsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()

onMounted(() => {
  if (!sessionsStore.sessions?.length) sessionsStore.fetchSessions()
  if (!classesStore.classes?.length) classesStore.fetchClasses()
  if (!teachersStore.teachers?.length) teachersStore.fetchTeachers()
})

const activeSession = computed(() => sessionsStore.sessions?.find((session) => session.current ?? session.status === 'Active')?.name || 'Not set')

const recentActivity = [
  { title: 'New class created', description: 'JSS1A was added and assigned to Mrs. Ada Nwosu.', icon: School },
  { title: 'Session activated', description: '2025/2026 academic session is active across the school.', icon: CalendarClock },
  { title: 'Subject assignment updated', description: 'Mathematics is now linked to JSS1A and SS2B.', icon: BookOpen },
]

const setupStatus = [
  { label: 'Sessions configured', value: 'Complete', progress: '100%' },
  { label: 'Terms configured', value: '2 of 3', progress: '66%' },
  { label: 'Subjects assigned', value: '18 mapped', progress: '74%' },
]
</script>
