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
        <div v-if="activitiesLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3A]"></div>
        </div>
        <div v-else-if="processedActivities.length === 0" class="text-center py-8">
          <Activity class="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p class="text-slate-500">No recent activity found</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="item in processedActivities" :key="item.title" class="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
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
import { computed, onMounted, ref } from 'vue'
import { BookOpen, CalendarClock, GraduationCap, School, Users, Plus, Edit, Trash2, CheckCircle, XCircle, Shield, UserPlus, Users as UsersIcon, PlayCircle, PauseCircle, LogIn, LogOut, Download, Upload, Database, RefreshCw, Activity } from 'lucide-vue-next'
import OverviewCard from '../components/OverviewCard.vue'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useActivities } from '../composables/useActivities'

const sessionsStore = useSchoolAdminSessionsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const { recentActivities, fetchAllActivities, getActivityIcon, formatActivityDescription, loading: activitiesLoading } = useActivities()

onMounted(async () => {
  if (!sessionsStore.sessions?.length) sessionsStore.fetchSessions()
  if (!classesStore.classes?.length) classesStore.fetchClasses()
  if (!teachersStore.teachers?.length) teachersStore.fetchTeachers()
  
  // Fetch recent activities
  try {
    await fetchAllActivities({ limit: 10, sort: 'created_at', order: 'desc' })
  } catch (error) {
    console.error('Failed to fetch activities:', error)
  }
})

const activeSession = computed(() => sessionsStore.sessions?.find((session) => session.current ?? session.status === 'Active')?.name || 'Not set')

// Icon mapping for activities
const iconMap = {
  'Plus': Plus,
  'Edit': Edit,
  'Trash2': Trash2,
  'CheckCircle': CheckCircle,
  'XCircle': XCircle,
  'Shield': Shield,
  'UserPlus': UserPlus,
  'Users': UsersIcon,
  'PlayCircle': PlayCircle,
  'PauseCircle': PauseCircle,
  'LogIn': LogIn,
  'LogOut': LogOut,
  'Download': Download,
  'Upload': Upload,
  'Database': Database,
  'RefreshCw': RefreshCw,
  'Activity': Activity,
  'School': School,
  'BookOpen': BookOpen,
  'CalendarClock': CalendarClock,
  'Users': Users
}

// Process activities for display
const processedActivities = computed(() => {
  return recentActivities.value.map(activity => ({
    title: formatActivityDescription(activity),
    description: new Date(activity.created_at).toLocaleString(),
    icon: iconMap[getActivityIcon(activity.action_type)] || Activity
  }))
})

const setupStatus = [
  { label: 'Sessions configured', value: 'Complete', progress: '100%' },
  { label: 'Terms configured', value: '2 of 3', progress: '66%' },
  { label: 'Subjects assigned', value: '18 mapped', progress: '74%' },
]
</script>
