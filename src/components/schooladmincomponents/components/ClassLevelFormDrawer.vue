<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Class Level' : 'Create Class Level'"
    eyebrow="Classes"
    :subtitle="isEdit ? 'Update this class level\u2019s name.' : 'Add a new class level, e.g. JSS 1 or SS 1.'"
    size="sm"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="class-level-form" @submit.prevent="submit">
      <FormSection title="Class Level Details">
        <ResponsiveFormGrid :cols="1">
          <AppInput v-model="form.name" label="Class Level Category" placeholder="JSS 1" required :error="errors.name" @blur="touch('name')" />
        </ResponsiveFormGrid>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Class Level' : 'Create Class Level'"
        :submit-loading-label="isEdit ? 'Updating…' : 'Creating…'"
        submit-type="button"
        @cancel="requestCancel"
        @submit="submit"
      />
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppInput from '../../shared/AppInput.vue'
import FormSection from '../../shared/FormSection.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import DrawerFooter from '../../shared/DrawerFooter.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  classLevel: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.classLevel)

const form = reactive({ name: '' })
const errors = reactive({ name: '' })
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))
const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const resetForm = (source) => {
  form.name = source?.name || ''
  errors.name = ''
  touched.name = false
  initialSnapshot.value = JSON.stringify(form)
}

watch(() => props.classLevel, (l) => resetForm(l), { immediate: true })
watch(() => props.show, (show) => { if (!show) resetForm(props.classLevel) })

const touch = (field) => { touched[field] = true; validateField(field) }
const validateField = (field) => {
  if (field === 'name') errors.name = form.name?.trim() ? '' : 'Class level category is required.'
}
const validate = () => { touch('name'); return !errors.name }

const submit = () => {
  if (props.saving) return
  if (!validate()) return
  emit('submit', { id: props.classLevel?.id, name: form.name })
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
