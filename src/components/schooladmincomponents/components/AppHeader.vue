<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <AppButton type="button" :icon="PanelLeft" variant="ghost" class="lg:hidden" @click="$emit('toggle-sidebar')" />
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{{ profileStore.profile.schoolName || 'School Admin' }}</p>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">{{ pageTitle }}</h2>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <ProfileDropdown />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {  PanelLeft } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import ProfileDropdown from './ProfileDropdown.vue'
import { useSchoolAdminUiStore } from '../stores/ui'
import { useSchoolAdminProfileStore } from '../stores/profile'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const profileStore = useSchoolAdminProfileStore()
const uiStore = useSchoolAdminUiStore()

const titles = {
  '/school-admin/dashboard': 'Dashboard Overview',
  '/school-admin/sessions': 'Academic Sessions',
  '/school-admin/terms': 'Terms',
  '/school-admin/classes': 'Classes',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/teachers/import': 'Import Teachers',
  '/school-admin/students': 'Students',
  '/school-admin/students/import': 'Import Students',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/settings': 'School Settings',
  '/school-admin/profile': 'School Profile',
  '/teachers/dashboard': 'Teacher Dashboard',
  '/teachers/my-classes': 'Assigned Classes',
  '/teachers/questions': 'Question Bank',
  '/teachers/exam-wizard': 'Exam Creation Wizard',
  '/teachers/exams': 'Exams & Monitoring',
  '/teachers/students': 'Students',
  '/teachers/attendance': 'Attendance',
  '/teachers/grading': 'Theory Grading',
  '/teachers/results': 'Results',
  '/teachers/timetable': 'Timetable',
  '/teachers/settings': 'Teacher Settings',
  '/teachers/profile': 'Teacher Profile',
}

const pageTitle = computed(() => titles[route.path] || (route.path.startsWith('/teachers') ? 'Teacher Dashboard' : 'School Admin'))
</script>
