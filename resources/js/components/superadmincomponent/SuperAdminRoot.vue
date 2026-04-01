<template>
  <div class="sa-theme min-h-screen bg-[#F3F6FB] text-slate-900">
    <ToastStack />
    <router-view />
  </div>
</template>

<script setup>
import ToastStack from './components/ToastStack.vue'
</script>
