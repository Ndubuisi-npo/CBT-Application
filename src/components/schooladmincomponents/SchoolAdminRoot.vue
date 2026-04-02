<template>
  <div class="sa-theme min-h-screen bg-[#F3F6FB] text-slate-900">
    <ToastStack />
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import ToastStack from './components/ToastStack.vue'
import { useSchoolAdminProfileStore } from './stores/profile'

const profileStore = useSchoolAdminProfileStore()

onMounted(() => {
  if (!profileStore.profile.address) profileStore.fetchProfile()
})
</script>
