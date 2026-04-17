<template>
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
    @click="$emit('close-mobile')"
  ></div>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-white/60 bg-[#0B1F3A] text-white shadow-2xl shadow-[#0B1F3A]/15 transition-transform duration-300 lg:sticky lg:z-auto"
    :class="[
      collapsed ? 'w-24' : 'w-72',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div class="flex h-20 items-center gap-4 border-b border-white/10 px-5" :class="collapsed ? 'justify-center' : ''">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-[#D4AF37]">
        SA
      </div>
      <div v-if="!collapsed">
        <p class="text-xs uppercase tracking-[0.28em] text-[#D4AF37]">EduCBT</p>
        <p class="text-lg font-semibold">Control Center</p>
      </div>
    </div>

    <nav class="flex-1 space-y-2 px-4 py-6">
      <ActionButton
        v-for="item in navItems"
        :key="item.to"
        tag="RouterLink"
        :to="item.to"
        variant="ghost"
        class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200"
        :class="isActive(item.to) ? 'bg-white text-[#0B1F3A] shadow-lg shadow-black/10' : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="$emit('close-mobile')"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" :class="isActive(item.to) ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-[#D4AF37]'" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </ActionButton>
    </nav>

    <div class="border-t border-white/10 p-4">
      <AppButton type="button" :icon="PanelLeftClose" :text="collapsed ? '' : 'Collapse sidebar'" variant="ghost" full-width class="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/15" @click="$emit('toggle')" />
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { BookCopy, CalendarRange, Columns3, LayoutDashboard, PanelLeftClose, Settings, Shapes, School, Users, Building2 } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import ActionButton from '../../shared/ActionButton.vue'

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
  mobileOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle', 'close-mobile'])

const route = useRoute()

const navItems = computed(() => [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Tenants', to: '/super-admin/tenants', icon: School },
  { label: 'Subscription Plans', to: '/super-admin/plans', icon: CreditCard },
  { label: 'Audit Logs', to: '/super-admin/audit-logs', icon: ClipboardList },
  { label: 'Settings', to: '/super-admin/settings', icon: Settings },
])

const isActive = (target) => route.path === target || route.path.startsWith(`${target}/`)
</script>
