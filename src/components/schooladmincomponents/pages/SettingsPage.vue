<template>
  <div class="max-w-2xl">
    <SectionCard title="Change Password" subtitle="Update your account password for security.">
      <form @submit.prevent="handlePasswordChange" class="space-y-5">
        <FormField label="Current Password" :error="errors.currentPassword">
          <div class="relative">
            <input 
              v-model="passwordForm.currentPassword" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              class="sa-input pr-12" 
              placeholder="Enter your current password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              :disabled="loading"
            >
              <Eye v-if="!showCurrentPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
        </FormField>

        <FormField label="New Password" :error="errors.newPassword">
          <div class="relative">
            <input 
              v-model="passwordForm.newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              class="sa-input pr-12" 
              placeholder="Enter your new password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              :disabled="loading"
            >
              <Eye v-if="!showNewPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
        </FormField>

        <FormField label="Confirm New Password" :error="errors.confirmPassword">
          <div class="relative">
            <input 
              v-model="passwordForm.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              class="sa-input pr-12" 
              placeholder="Confirm your new password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              :disabled="loading"
            >
              <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
        </FormField>

        <AppButton 
          type="submit" 
          text="Change Password" 
          full-width 
          variant="primary" 
          :processing="loading" 
          @click="handlePasswordChange" 
        />
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import AppButton from '../../shared/AppButton.vue'
import { useSchoolAdminUiStore } from '../stores/ui'
import { changePassword } from '../services/api/settings'
import { useActivities } from '../composables/useActivities'

const uiStore = useSchoolAdminUiStore()
const loading = ref(false)

// Password visibility states
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  // Validate current password
  if (!passwordForm.currentPassword.trim()) {
    errors.currentPassword = 'Current password is required'
    isValid = false
  }

  // Validate new password
  if (!passwordForm.newPassword.trim()) {
    errors.newPassword = 'New password is required'
    isValid = false
  } else if (passwordForm.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters long'
    isValid = false
  }

  // Validate confirm password
  if (!passwordForm.confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your new password'
    isValid = false
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const handlePasswordChange = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  const { addActivity } = useActivities()

  try {
    await changePassword({
      current_password: passwordForm.currentPassword,
      password: passwordForm.newPassword,
      password_confirmation: passwordForm.confirmPassword
    })
    
    // Log activity
    try {
      await addActivity({
        entity_type: 'user',
        action_type: 'password_change',
        details: {
          name: 'Current User'
        }
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
    
    // Reset form
    Object.keys(passwordForm).forEach(key => {
      passwordForm[key] = ''
    })

    uiStore.addToast({ 
      title: 'Password Changed', 
      message: 'Your password has been successfully updated.', 
      variant: 'success' 
    })
  } catch (error) {
    uiStore.addToast({ 
      title: 'Error', 
      message: error.message || 'Failed to change password. Please try again.', 
      variant: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>
