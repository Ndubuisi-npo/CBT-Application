<template>
  <div class="space-y-2">
    <label class="sa-label">{{ label }}</label>
    <slot />
    <p v-if="error" class="sa-error">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  error: String,
})
</script>
