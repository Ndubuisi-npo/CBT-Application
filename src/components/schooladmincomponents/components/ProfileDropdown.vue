<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      :class="{ 'ring-2 ring-[#D4AF37] ring-offset-2': isOpen }"
    >
      <div class="h-10 w-10 flex items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-semibold text-white">
        {{ userInitials }}
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
            <h3 class="font-semibold text-slate-900">{{ authStore.user?.name || 'School Admin' }}</h3>
            <p class="text-sm text-slate-500">{{ authStore.user?.role || 'Tenant administrator' }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ authStore.user?.email || '' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-2">
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
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminAuthStore } from '../stores/auth'
import { useSchoolAdminUiStore } from '../stores/ui'

const authStore = useSchoolAdminAuthStore()
const uiStore = useSchoolAdminUiStore()

const isOpen = ref(false)
const isLoggingOut = ref(false)
const dropdownRef = ref(null)

const userInitials = computed(() => {
  const name = authStore.user?.name || 'School Admin'
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
    await authStore.logout()
    uiStore.addToast({
      title: 'Logged out',
      message: 'You have been signed out successfully.',
      variant: 'success',
    })
    // Navigate to login page
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout failed:', error)
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
