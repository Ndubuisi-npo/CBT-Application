<template>
  <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" @click="$emit('close-mobile')"></div>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-white/60 bg-[#0B1F3A] text-white shadow-2xl shadow-[#0B1F3A]/15 transition-transform duration-300 lg:sticky lg:z-auto"
    :class="[collapsed ? 'w-24' : 'w-72', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
  >
    <div class="flex h-20 items-center gap-4 border-b border-white/10 px-5" :class="collapsed ? 'justify-center' : ''">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-[#D4AF37]">
        {{ initials }}
      </div>
      <div v-if="!collapsed">
        <p class="text-xs uppercase tracking-[0.28em] text-[#D4AF37]">School Admin</p>
        <p class="text-lg font-semibold">{{ profile.schoolName }}</p>
      </div>
    </div>

    <nav class="flex-1 space-y-2 px-4 py-6">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 rounded-2xl border-l-2 px-4 py-3 text-sm font-medium transition duration-200"
        :class="isActive(item.to) ? 'border-[#D4AF37] bg-[#102946] text-white shadow-lg shadow-black/10' : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="$emit('close-mobile')"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" :class="isActive(item.to) ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-[#D4AF37]'" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="border-t border-white/10 p-4">
      <button type="button" class="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/15" @click="$emit('toggle')">
        <PanelLeftClose class="h-5 w-5 text-[#D4AF37]" />
        <span v-if="!collapsed">Collapse sidebar</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { BookCopy, CalendarRange, Columns3, LayoutDashboard, PanelLeftClose, Settings, Shapes, School, Users } from 'lucide-vue-next'
import { useSchoolAdminProfileStore } from '../stores/profile'

defineProps({
  collapsed: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
})

defineEmits(['toggle', 'close-mobile'])

const route = useRoute()
const profileStore = useSchoolAdminProfileStore()

const profile = computed(() => profileStore.profile)
const initials = computed(() => profile.value.schoolName.split(' ').map((part) => part[0]).slice(0, 2).join(''))

const navItems = computed(() => [
  { label: 'Dashboard', to: '/school-admin/dashboard', icon: LayoutDashboard },
  { label: 'Academic Sessions', to: '/school-admin/sessions', icon: CalendarRange },
  { label: 'Terms', to: '/school-admin/terms', icon: BookCopy },
  { label: 'Teachers', to: '/school-admin/teachers', icon: Users },
  { label: 'Classes', to: '/school-admin/classes', icon: Columns3 },
    { label: 'Subjects', to: '/school-admin/subjects', icon: Shapes },
  { label: 'Settings', to: '/school-admin/settings', icon: Settings },
  { label: 'School Profile', to: '/school-admin/profile', icon: School },
])

const isActive = (target) => route.path === target || route.path.startsWith(`${target}/`)
</script>
