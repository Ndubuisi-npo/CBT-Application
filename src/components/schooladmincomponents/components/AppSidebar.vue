<template>
  <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" @click="$emit('close-mobile')" />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-white/60 bg-[#0B1F3A] text-white shadow-2xl shadow-[#0B1F3A]/15 transition-transform duration-300 lg:sticky lg:z-auto"
    :class="[collapsed ? 'w-24' : 'w-72', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
  >
    <!-- Branding -->
    <div class="flex h-20 items-center gap-4 border-b border-white/10 px-5" :class="collapsed ? 'justify-center' : ''">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-[#D4AF37]">
        <component :is="isTeacherSection ? FileQuestion : Building2" class="h-5 w-5" />
      </div>
      <div v-if="!collapsed">
        <p class="text-xs uppercase tracking-[0.28em] text-[#D4AF37]">
          {{ isTeacherSection ? 'Teacher Portal' : 'School Admin' }}
        </p>
        <p class="text-lg font-semibold">
          {{ isTeacherSection ? 'Teacher Dashboard' : (profile.schoolName || 'School Admin') }}
        </p>
      </div>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 space-y-1 overflow-y-auto px-4 py-6">
      <ActionButton
        v-for="item in navItems"
        :key="item.to"
        tag="RouterLink"
        :to="item.to"
        variant="ghost"
        class="group flex w-full items-start justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200"
        :class="isActive(item.to) ? 'bg-[#102946] text-white shadow-lg shadow-black/10' : 'text-slate-100 hover:bg-white/10 hover:text-white'"
        @click="$emit('close-mobile')"
      >
        <component
          :is="item.icon"
          class="h-5 w-5 shrink-0"
          :class="isActive(item.to) ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-[#D4AF37]'"
        />
        <span v-if="!collapsed">{{ item.label }}</span>
      </ActionButton>
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-white/10 p-4">
      <AppButton
        type="button"
        :icon="PanelLeftClose"
        :text="collapsed ? '' : 'Collapse sidebar'"
        variant="ghost"
        full-width
        class="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
        @click="$emit('toggle')"
      />
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  AlarmClockCheck,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarCheck2,
  CalendarRange,
  ClipboardList,
  Columns3,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  PanelLeftClose,
  School,
  ScrollText,
  Settings,
  Shapes,
  Users,
} from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import ActionButton from '../../shared/ActionButton.vue'
import { useSchoolAdminProfileStore } from '../stores/profile'

defineProps({
  collapsed: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
})

defineEmits(['toggle', 'close-mobile'])

const route = useRoute()
const profileStore = useSchoolAdminProfileStore()
const profile = computed(() => profileStore.profile)
const isTeacherSection = computed(() => route.path.startsWith('/teachers'))

/**
 * REFACTOR: Teacher nav includes full exam management.
 * School Admin nav DOES NOT include Assessments/Exams.
 * Admin has ZERO exam responsibilities.
 */
const navItems = computed(() => {
  if (isTeacherSection.value) {
    return [
      { label: 'Dashboard', to: '/teachers/dashboard', icon: LayoutDashboard },
      // ── Exam lifecycle (teacher-owned) ──
      { label: 'My Exams', to: '/teachers/exams', icon: ClipboardList },
      // ── Supporting features ──
      { label: 'Question Bank', to: '/teachers/questions', icon: FileQuestion },
      // { label: 'My Classes', to: '/teachers/my-classes', icon: BookOpenCheck },
      { label: 'Students', to: '/teachers/students', icon: GraduationCap },
      { label: 'Attendance', to: '/teachers/attendance', icon: CalendarCheck2 },
      // { label: 'Grading', to: '/teachers/grading', icon: ScrollText },
      // { label: 'Results', to: '/teachers/results', icon: BarChart3 },
      // { label: 'Timetable', to: '/teachers/timetable', icon: AlarmClockCheck },
      { label: 'Settings', to: '/teachers/settings', icon: Settings },
      { label: 'Profile', to: '/teachers/profile', icon: School },
    ]
  }

  // School Admin nav — NO exam/assessment items
  return [
    { label: 'Dashboard', to: '/school-admin/dashboard', icon: LayoutDashboard },
    { label: 'Academic Sessions', to: '/school-admin/sessions', icon: CalendarRange },
    { label: 'Teachers', to: '/school-admin/teachers', icon: Users },
    { label: 'Students', to: '/school-admin/students', icon: GraduationCap },
    { label: 'Exam Approvals', to: '/school-admin/exams', icon: ClipboardList },
    { label: 'Class Levels', to: '/school-admin/class-levels', icon: Columns3 },
    { label: 'Subjects', to: '/school-admin/subjects', icon: Shapes },
    { label: 'Settings', to: '/school-admin/settings', icon: Settings },
    { label: 'School Profile', to: '/school-admin/profile', icon: School },
  ]
})

const isActive = (target) =>
  route.path === target || route.path.startsWith(`${target}/`)
</script>
