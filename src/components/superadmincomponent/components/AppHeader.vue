<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <AppButton type="button" :icon="PanelLeft" variant="ghost" class="lg:hidden" @click="$emit('toggle-sidebar')" />
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Multi-tenant operations</p>
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
import { PanelLeft } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import ProfileDropdown from './ProfileDropdown.vue'
import { useSuperAdminUiStore } from '../stores/ui'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const uiStore = useSuperAdminUiStore()

const titles = {
  '/super-admin/dashboard': 'Dashboard Overview',
  '/super-admin/tenants': 'Tenant Management',
  '/super-admin/tenants/new': 'Create Tenant',
  '/super-admin/plans': 'Subscription Plans',
  '/super-admin/audit-logs': 'Audit Logs',
  '/super-admin/settings': 'Platform Settings',
}

const pageTitle = computed(() => titles[route.path] || 'Super Admin')
</script>
