<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Class Arm' : 'Create Class Arm'"
    eyebrow="Classes"
    :subtitle="classLevelName ? `Part of ${classLevelName}.` : 'Add a new arm to this class level.'"
    size="sm"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="class-arm-form" class="space-y-6" @submit.prevent="submit">
      <FormSection title="Class Arm Details">
        <ResponsiveFormGrid :cols="1">
          <AppInput :model-value="classLevelName" label="Class Level" disabled />
          <AppInput
            v-model="form.suffix"
            :label="prefix ? 'Class Arm Suffix' : 'Class Arm Name'"
            :placeholder="prefix ? 'A' : 'JSS 1A'"
            required
            :error="errors.suffix"
            :hint="prefix && form.suffix ? `Full name: ${fullName}` : ''"
            @blur="touch('suffix')"
          />
        </ResponsiveFormGrid>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Class Arm' : 'Create Class Arm'"
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
  classItem: { type: Object, default: null },
  classLevelName: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.classItem)
const prefix = computed(() => props.classLevelName?.trim())
const fullName = computed(() => {
  const suffix = form.suffix?.trim()
  if (!prefix.value) return suffix
  return suffix ? `${prefix.value} ${suffix}` : prefix.value
})

const form = reactive({ suffix: '' })
const errors = reactive({ suffix: '' })
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))
const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const resetForm = () => {
  const classItem = props.classItem
  if (classItem) {
    const existingName = classItem.name || ''
    const prefixText = props.classLevelName?.trim()
    form.suffix = (prefixText && existingName.startsWith(prefixText))
      ? existingName.slice(prefixText.length).trim()
      : existingName
  } else {
    form.suffix = ''
  }
  errors.suffix = ''
  touched.suffix = false
  initialSnapshot.value = JSON.stringify(form)
}

watch(() => [props.classItem, props.classLevelName], () => resetForm(), { immediate: true })
watch(() => props.show, (show) => { if (!show) resetForm() })

const touch = (field) => { touched[field] = true; validateField(field) }
const validateField = (field) => {
  if (field === 'suffix') errors.suffix = form.suffix?.trim() ? '' : (prefix.value ? 'Class arm suffix is required.' : 'Class arm name is required.')
}
const validate = () => { touch('suffix'); return !errors.suffix }

const submit = () => {
  if (props.saving) return
  if (!validate()) return
  emit('submit', { id: props.classItem?.id, name: fullName.value })
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
