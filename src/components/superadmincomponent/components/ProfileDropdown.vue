<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      :class="{ 'ring-2 ring-[#D4AF37] ring-offset-2': isOpen }"
    >
      <div class="h-10 w-10 flex items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-semibold text-white">
        {{ userInitials }}
      </div>
      <ChevronDown class="h-4 w-4 text-slate-400 transition-transform" :class="{ 'rotate-180': isOpen }" />
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
            <h3 class="font-semibold text-slate-900">{{ authComposable.user?.name || 'Super Admin' }}</h3>
            <p class="text-sm text-slate-500">{{ authComposable.user?.role || 'Platform administrator' }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ authComposable.user?.email || '' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-2">
        <AppButton
          @click="handleLogout"
          text="Log Out"
          variant="outline"
          size="sm"
          full-width
          class="justify-start"
          loadingText="Logging out..."
          :processing="isLoggingOut"
          :disabled="isLoggingOut"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import { useSuperAdminAuth } from '../composables/useSuperAdminAuth'

const authComposable = useSuperAdminAuth()

const isOpen = ref(false)
const isLoggingOut = ref(false)
const dropdownRef = ref(null)

const userInitials = computed(() => {
  const name = authComposable.user?.name || 'Super Admin'
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
    await authComposable.logout()
    // Show success message if toast system is available
    console.log('Logged out successfully')
    // Navigate to login page
    window.location.href = '/super-admin/login'
  } catch (error) {
    console.error('Logout failed:', error)
    // Show error message if toast system is available
    console.error('Unable to sign out.')
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
