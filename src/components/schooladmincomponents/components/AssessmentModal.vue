<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Assessment' : 'Create Assessment' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="form.title"
            label="Assessment Title"
            placeholder="e.g. JSS1 English CA1"
            required
            :error="errors.title"
            @blur="touch('title')"
          />
          <AppSelect
            v-model="form.category"
            :options="categoryOptions"
            label="Assessment Type"
            placeholder="Select type"
            required
            :error="errors.category"
            @blur="touch('category')"
          />
          <AppInput
            v-model="form.totalMarks"
            type="number"
            label="Marks"
            placeholder="30"
            required
            :error="errors.totalMarks"
            @blur="touch('totalMarks')"
          />
          <div class="grid gap-4 sm:grid-cols-2">
            <AppSelect
              v-model="form.classLevelId"
              :options="classLevelOptions"
              label="Class Level"
              placeholder="Select level"
              required
              :error="errors.classLevelId"
              @blur="touch('classLevelId')"
            />
            <AppSelect
              v-model="form.classArmId"
              :options="classArmOptions"
              label="Class Arm"
              placeholder="All arms"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <AppButton
              type="submit"
              :text="isEdit ? 'Update Assessment' : 'Create Assessment'"
              full-width
              variant="primary"
            />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import AppInput from '../../shared/AppInput.vue'
import AppSelect from '../../shared/AppSelect.vue'
import {
  getClassLevelOptions,
  getClassArmOptions,
  getCategoryOptions,
} from '../../assessments/mockAssessments'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.assessment)

const categoryOptions = getCategoryOptions()
const classLevelOptions = getClassLevelOptions()
const classArmOptions = getClassArmOptions()

const defaultForm = () => ({
  title: '',
  category: '',
  totalMarks: '',
  classLevelId: '',
  classArmId: '',
})

const form = reactive(defaultForm())
const errors = reactive({ title: '', category: '', totalMarks: '', classLevelId: '' })

const resetForm = () => {
  Object.assign(form, defaultForm())
  Object.assign(errors, { title: '', category: '', totalMarks: '', classLevelId: '' })
}

watch(
  () => [props.show, props.assessment],
  ([show, assessment]) => {
    if (!show) return
    if (assessment) {
      form.title = assessment.title ?? ''
      form.category = assessment.category ?? ''
      form.totalMarks = assessment.totalMarks ?? ''
      form.classLevelId = assessment.classLevelId ?? ''
      form.classArmId = assessment.classArmId ?? ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const validateField = (field) => {
  if (field === 'title') errors.title = String(form.title).trim() ? '' : 'Title is required.'
  if (field === 'category') errors.category = form.category ? '' : 'Assessment type is required.'
  if (field === 'classLevelId') errors.classLevelId = form.classLevelId ? '' : 'Class level is required.'
  if (field === 'totalMarks') errors.totalMarks = Number(form.totalMarks) > 0 ? '' : 'Marks must be greater than zero.'
}

const touch = (field) => validateField(field)

const validate = () => {
  ['title', 'category', 'totalMarks', 'classLevelId'].forEach(validateField)
  return !errors.title && !errors.category && !errors.totalMarks && !errors.classLevelId
}

const submit = () => {
  if (!validate()) return
  emit('submit', {
    id: props.assessment?.id,
    title: String(form.title).trim(),
    category: form.category,
    totalMarks: Number(form.totalMarks),
    classLevelId: Number(form.classLevelId),
    classArmId: form.classArmId ? Number(form.classArmId) : null,
  })
}
</script>
