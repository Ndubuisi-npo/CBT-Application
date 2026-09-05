<template>
  <div class="relative" ref="dropdownRef">
    <button
      data-tour="profile-menu-button"
      type="button"
      aria-label="Open profile menu"
      class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 pr-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
      @click="toggleDropdown"
      :class="{ 'ring-2 ring-[#D4AF37] ring-offset-2': isOpen }"
    >
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-[11px] font-semibold text-white">
        {{ userInitials }}
      </div>
      <div class="hidden min-w-0 sm:block">
        <p class="max-w-[120px] truncate text-xs font-semibold leading-tight text-[#0B1F3A]">{{ userName }}</p>
        <p class="mt-0.5 text-[11px] leading-tight text-slate-500">{{ roleLabel }}</p>
      </div>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg z-50"
      @click.stop
    >
      <!-- User Info -->
      <div class="p-4 border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 flex items-center justify-center rounded-full bg-[#0B1F3A] text-lg font-semibold text-white">
            {{ userInitials }}
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-slate-900">{{ `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'School Admin' }}</h3>
            <p class="text-sm text-slate-500">{{ user?.role || 'Tenant administrator' }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ user?.email || '' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-2">
        <button
          v-if="showTakeTour"
          data-tour="restart-tour-btn"
          @click="handleTakeTour"
          class="flex w-full items-center gap-2 text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A] transition-colors rounded-md"
        >
          <Compass class="h-4 w-4 text-[#D4AF37]" />
          Take Product Tour
        </button>
        <button
          @click="handleLogout"
          :disabled="isLoggingOut"
          class="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoggingOut ? 'Logging out...' : 'Log Out' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Compass } from 'lucide-vue-next'
import { logout as unifiedLogout, getAuthUser, getAuthRole } from '../../../js/lib/auth'
import { useSchoolAdminUiStore } from '../stores/ui'
import { isTourEligibleRole, restartProductTour } from '../../../tours'

const uiStore = useSchoolAdminUiStore()

const isOpen = ref(false)
const isLoggingOut = ref(false)
const dropdownRef = ref(null)

const user = computed(() => getAuthUser())
// Students (and any other non-tour role) never see this option.
const showTakeTour = computed(() => isTourEligibleRole(getAuthRole()))
const userName = computed(() => `${user.value?.first_name || ''} ${user.value?.last_name || ''}`.trim() || 'School Admin')
const roleLabel = computed(() => getAuthRole() === 'teacher' ? 'Teacher' : 'School admin')

const handleTakeTour = () => {
  closeDropdown()
  void restartProductTour(getAuthRole())
}

const userInitials = computed(() => {
  if (!user.value) return 'SA'
  const name = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim() || 'User'
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleLogout = async () => {
  isLoggingOut.value = true

  try {
    await unifiedLogout()
    uiStore.addToast({
      title: 'Logged out',
      message: 'You have been signed out successfully.',
      variant: 'success',
    })
    window.location.href = '/login'
  } catch (error) {
    uiStore.addToast({
      title: 'Logout failed',
      message: error?.message || 'Unable to sign out.',
      variant: 'error',
    })
  } finally {
    isLoggingOut.value = false
    closeDropdown()
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
