<!--
  DrawerFooter.vue
  ────────────────────────────────────────────────────────────────────────
  Standard "Cancel — Save" action bar for AppDrawer's #footer slot. Covers
  the common create/edit case; for anything bespoke (e.g. a view-mode
  single "Close" button) just build the footer markup directly as before.

  Usage:
    <template #footer>
      <DrawerFooter
        :processing="loading"
        :submit-label="isEdit ? 'Update Teacher' : 'Create Teacher'"
        :submit-loading-label="isEdit ? 'Updating…' : 'Creating…'"
        @cancel="$emit('close')"
        @submit="handleSubmit"
      />
    </template>
-->
<template>
  <div class="flex items-center gap-3" :class="align === 'right' ? 'justify-end' : ''">
    <AppButton
      type="button"
      text="Cancel"
      variant="outline"
      :disabled="processing"
      class="flex-1 sm:flex-none"
      @click="$emit('cancel')"
    />
    <AppButton
      :type="submitType"
      :text="submitLabel"
      :loading-text="submitLoadingLabel"
      :processing="processing"
      :disabled="processing || submitDisabled"
      variant="primary"
      class="flex-1 sm:flex-none"
      @click="submitType === 'button' ? $emit('submit') : undefined"
    />
  </div>
</template>

<script setup>
import AppButton from './AppButton.vue'

defineProps({
  submitLabel: { type: String, default: 'Save Changes' },
  submitLoadingLabel: { type: String, default: 'Saving…' },
  processing: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
  /** Use 'submit' when the drawer body is a <form @submit.prevent="..."> so the native submit fires it. */
  submitType: { type: String, default: 'submit', validator: v => ['submit', 'button'].includes(v) },
  align: { type: String, default: 'stretch' },
})

defineEmits(['cancel', 'submit'])
</script>
