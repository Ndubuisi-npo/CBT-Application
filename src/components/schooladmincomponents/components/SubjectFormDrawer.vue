<!--
  SubjectFormDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  Create/Edit drawer for subjects, replacing the old SubjectModal.vue.
  The class-level / class-arm multi-select logic is preserved as-is
  (verified working) — only the presentation moved to AppDrawer.
-->
<template>
  <AppDrawer
    :model-value="show"
    :title="isEdit ? 'Edit Subject' : 'Create Subject'"
    eyebrow="Subjects"
    :subtitle="isEdit ? 'Update this subject\u2019s details.' : 'Add a new subject to your curriculum.'"
    size="md"
    :has-unsaved-changes="isDirty"
    :persistent="saving"
    @close="$emit('close')"
  >
    <form id="subject-form" class="space-y-6" @submit.prevent="submit">
      <FormSection title="Subject Details" description="Name and code used throughout the app.">
        <ResponsiveFormGrid :cols="2">
          <AppInput v-model="form.name" label="Subject Name" placeholder="Mathematics" required :error="errors.name" @blur="touch('name')" />
          <AppInput v-model="form.code" label="Subject Code" placeholder="MATH" required :error="errors.code" @blur="touch('code')" />
        </ResponsiveFormGrid>
      </FormSection>

      <FormSection title="Class Levels & Arms" description="Where this subject is taught." :badge="form.class_level_ids.length ? `${form.class_level_ids.length} selected` : ''">
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">
              Class Level <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              v-model="selectedClassLevelId"
              class="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              @change="handleClassLevelSelect"
            >
              <option value="">Select a class level</option>
              <option v-for="option in availableClassLevelOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <p v-if="errors.class_level_ids" class="mt-1.5 text-xs text-red-600" role="alert">{{ errors.class_level_ids }}</p>

            <div v-if="selectedClassLevels.length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="classLevel in selectedClassLevels"
                :key="classLevel.id"
                class="inline-flex items-center gap-2 rounded-full bg-[#0B1F3A]/8 px-3 py-1 text-sm font-medium text-[#0B1F3A]"
              >
                {{ classLevel.name }}
                <button type="button" class="text-slate-500 transition hover:text-slate-700" @click="removeClassLevel(classLevel.id)" aria-label="Remove class level">
                  <X class="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          </div>

          <div v-if="!selectedClassLevels.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Select a class level to load its arms.
          </div>

          <div v-else class="space-y-4">
            <div v-for="group in classArmGroups" :key="group.classLevel.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ group.classLevel.name }}</p>
                  <p class="text-xs text-slate-500">All available arms are selected automatically when you add a class level.</p>
                </div>
                <span v-if="loadingClassArmIds.has(group.classLevel.id)" class="text-xs text-slate-500">Loading arms…</span>
              </div>

              <div v-if="group.arms.length" class="grid gap-2 sm:grid-cols-2">
                <label v-for="arm in group.arms" :key="arm.id" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    :checked="form.class_arm_ids.includes(arm.id)"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#D4AF37]"
                    @change="toggleClassArm(arm.id)"
                  />
                  <span>{{ arm.name }}</span>
                </label>
              </div>
              <div v-else-if="!loadingClassArmIds.has(group.classLevel.id)" class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No class arms found for this class level.
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </form>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        :submit-label="isEdit ? 'Update Subject' : 'Create Subject'"
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
import { X } from 'lucide-vue-next'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppInput from '../../shared/AppInput.vue'
import FormSection from '../../shared/FormSection.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import DrawerFooter from '../../shared/DrawerFooter.vue'
import { getClassArms } from '../services/api/classes'
import { fetchClassLevels } from '../../../js/api/classManagement'

const props = defineProps({
  show: { type: Boolean, default: false },
  subject: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.subject)

const emptyForm = () => ({ name: '', code: '', class_level_ids: [], class_arm_ids: [] })
const form = reactive(emptyForm())
const errors = reactive({ name: '', code: '', class_level_ids: '' })
const touched = reactive({})
const initialSnapshot = ref(JSON.stringify(form))
const isDirty = computed(() => JSON.stringify(form) !== initialSnapshot.value)

const selectedClassLevelId = ref('')
const loadingClassArmIds = ref(new Set())
const classArmsByLevelId = ref({})
const allClassLevels = ref([])
const loadingClassLevels = ref(false)

const classLevelOptions = computed(() =>
  allClassLevels.value.map((level) => ({ value: level.id, label: level.name })),
)
const availableClassLevelOptions = computed(() =>
  classLevelOptions.value.filter((option) => !form.class_level_ids.includes(option.value)),
)
const selectedClassLevels = computed(() =>
  form.class_level_ids.map((id) => allClassLevels.value.find((l) => l.id === id)).filter(Boolean),
)
const classArmGroups = computed(() =>
  selectedClassLevels.value.map((classLevel) => ({
    classLevel,
    arms: classArmsByLevelId.value[classLevel.id] || [],
  })),
)

const resetForm = (source) => {
  const s = source || {}
  Object.assign(form, {
    name: s.name || '',
    code: s.code || '',
    class_level_ids: s.class_levels?.map((l) => l.id).filter(Boolean) || [],
    class_arm_ids: s.class_arms?.map((a) => a.id).filter(Boolean) || [],
  })
  Object.assign(errors, { name: '', code: '', class_level_ids: '' })
  Object.keys(touched).forEach((k) => (touched[k] = false))
  selectedClassLevelId.value = ''
  classArmsByLevelId.value = {}
  loadingClassArmIds.value = new Set()
}

const loadAllClassLevels = async () => {
  if (loadingClassLevels.value) return
  loadingClassLevels.value = true
  try {
    const data = await fetchClassLevels()
    allClassLevels.value = Array.isArray(data) ? data : (data?.class_levels || data?.data || [])
  } catch { allClassLevels.value = [] }
  finally { loadingClassLevels.value = false }
}

const selectAllArmsForLevel = (classLevelId) => {
  const armIds = (classArmsByLevelId.value[classLevelId] || []).map((arm) => arm.id)
  form.class_arm_ids = Array.from(new Set([...form.class_arm_ids, ...armIds]))
}

const loadClassArmsForLevel = async (classLevelId, { autoSelectAll = false } = {}) => {
  if (!classLevelId) return
  if (classArmsByLevelId.value[classLevelId] || loadingClassArmIds.value.has(classLevelId)) {
    if (autoSelectAll && classArmsByLevelId.value[classLevelId]) selectAllArmsForLevel(classLevelId)
    return
  }
  loadingClassArmIds.value = new Set([...loadingClassArmIds.value, classLevelId])
  try {
    const arms = await getClassArms(classLevelId)
    classArmsByLevelId.value = { ...classArmsByLevelId.value, [classLevelId]: Array.isArray(arms) ? arms : [] }
    if (autoSelectAll) selectAllArmsForLevel(classLevelId)
  } catch {
    classArmsByLevelId.value = { ...classArmsByLevelId.value, [classLevelId]: [] }
  } finally {
    loadingClassArmIds.value = new Set([...loadingClassArmIds.value].filter((id) => id !== classLevelId))
  }
}

const populateArms = async () => {
  const shouldAutoSelectAllArms = form.class_arm_ids.length === 0
  const uniqueClassLevelIds = [...new Set(form.class_level_ids)]
  await Promise.all(uniqueClassLevelIds.map((id) => loadClassArmsForLevel(id, { autoSelectAll: shouldAutoSelectAllArms })))
  initialSnapshot.value = JSON.stringify(form)
}

const handleClassLevelSelect = async () => {
  const classLevelId = selectedClassLevelId.value
  if (!classLevelId || form.class_level_ids.includes(classLevelId)) { selectedClassLevelId.value = ''; return }
  form.class_level_ids = [...form.class_level_ids, classLevelId]
  errors.class_level_ids = ''
  selectedClassLevelId.value = ''
  await loadClassArmsForLevel(classLevelId, { autoSelectAll: true })
}

const removeClassLevel = (classLevelId) => {
  form.class_level_ids = form.class_level_ids.filter((id) => id !== classLevelId)
  const armIdsForLevel = (classArmsByLevelId.value[classLevelId] || []).map((arm) => arm.id)
  form.class_arm_ids = form.class_arm_ids.filter((id) => !armIdsForLevel.includes(id))
}

const toggleClassArm = (classArmId) => {
  form.class_arm_ids = form.class_arm_ids.includes(classArmId)
    ? form.class_arm_ids.filter((id) => id !== classArmId)
    : [...form.class_arm_ids, classArmId]
}

watch(() => props.show, async (show) => {
  if (show) {
    resetForm(props.subject)
    await loadAllClassLevels()
    await populateArms()
  } else {
    resetForm(props.subject)
  }
}, { immediate: true })

const touch = (field) => { touched[field] = true; validateField(field) }
const validators = {
  name: (v) => (v?.trim() ? '' : 'Subject name is required.'),
  code: (v) => (v?.trim() ? '' : 'Subject code is required.'),
}
const validateField = (field) => { errors[field] = validators[field]?.(form[field]) || '' }

const validate = () => {
  Object.keys(validators).forEach((field) => { touched[field] = true; validateField(field) })
  errors.class_level_ids = form.class_level_ids.length === 0 ? 'At least one class level is required.' : ''
  return !errors.name && !errors.code && !errors.class_level_ids
}

const submit = () => {
  if (props.saving) return
  if (!validate()) return
  emit('submit', {
    id: props.subject?.id,
    name: form.name,
    code: form.code,
    class_level_ids: form.class_level_ids,
    class_arm_ids: form.class_arm_ids,
  })
}

const requestCancel = () => {
  if (isDirty.value && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return
  emit('close')
}
</script>
