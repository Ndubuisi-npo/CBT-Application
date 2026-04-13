<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <button type="button" class="sa-icon-button lg:hidden" @click="$emit('toggle-sidebar')">
          <PanelLeft class="h-25 w-5" />
        </button>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Multi-tenant operations</p>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">{{ pageTitle }}</h2>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button type="button" class="sa-icon-button relative">
          <Bell class="h-5 w-5" />
          <span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]"></span>
        </button>
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
          @click="handleLogout"
          title="Logout"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B1F3A] text-sm font-semibold text-white">{{ adminInitials }}</div>
          <div class="hidden text-left sm:block">
            <p class="text-sm font-semibold text-slate-900">{{ authComposable.user?.name || 'Super Admin' }}</p>
            <p class="text-xs text-slate-500">{{ authComposable.user?.role || 'Platform administrator' }}</p>
          </div>
          <LogOut class="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, PanelLeft, LogOut } from 'lucide-vue-next'
import { useSuperAdminAuth } from '../composables/useSuperAdminAuth'
import { useSuperAdminUiStore } from '../stores/ui'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authComposable = useSuperAdminAuth()
const uiStore = useSuperAdminUiStore()

const adminInitials = computed(() => {
  const name = authComposable.user?.name || authComposable.user?.email || 'Super Admin'
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
})

const handleLogout = async () => {
  try {
    await authComposable.logout()
    uiStore.addToast({
      title: 'Logged out',
      message: 'You have been signed out successfully.',
      variant: 'success',
    })
    router.push('/super-admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
    uiStore.addToast({
      title: 'Logout failed',
      message: error?.message || 'Unable to sign out.',
      variant: 'error',
    })
  }
}

onMounted(async () => {
  if (!authComposable.user) {
    try {
      await authComposable.fetchCurrentUser()
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }
})

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
