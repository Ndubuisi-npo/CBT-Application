<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-4xl max-h-[80vh] transform overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
      <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-6 h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEdit ? 'Edit Subject' : 'Create Subject' }}</h3>
          <AppButton @click="$emit('close')" :icon="X" variant="ghost" class="text-slate-400 hover:text-slate-600" />
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-4" @submit.prevent="submit">
          <FormField label="Subject Name" :error="errors.name">
            <input v-model="form.name" class="sa-input" placeholder="Mathematics" />
          </FormField>
          
          <FormField label="Subject Code" :error="errors.code">
            <input v-model="form.code" class="sa-input" placeholder="MATH" />
          </FormField>
          
          <FormField label="Class Level" :error="errors.class_level_ids">
            <select v-model="selectedClassLevelId" class="sa-input" @change="handleClassLevelSelect">
              <option value="">Select a class level</option>
              <option v-for="option in availableClassLevelOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>

            <div v-if="selectedClassLevels.length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="classLevel in selectedClassLevels"
                :key="classLevel.id"
                class="inline-flex items-center gap-2 rounded-full bg-[#0B1F3A]/8 px-3 py-1 text-sm font-medium text-[#0B1F3A]"
              >
                {{ classLevel.name }}
                <button type="button" class="text-slate-500 transition hover:text-slate-700" @click="removeClassLevel(classLevel.id)">
                  <X class="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          </FormField>

          <FormField label="Class Arms">
            <div v-if="!selectedClassLevels.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Select a class level to load its arms.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="group in classArmGroups"
                :key="group.classLevel.id"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ group.classLevel.name }}</p>
                    <p class="text-xs text-slate-500">All available arms are selected automatically when you add a class level.</p>
                  </div>
                  <span v-if="loadingClassArmIds.has(group.classLevel.id)" class="text-xs text-slate-500">Loading arms...</span>
                </div>

                <div v-if="group.arms.length" class="grid gap-2 sm:grid-cols-2">
                  <label
                    v-for="arm in group.arms"
                    :key="arm.id"
                    class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
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
          </FormField>
          
          <div class="flex gap-2">
            <AppButton 
              type="submit" 
              :text="isEdit ? 'Update Subject' : 'Create Subject'" 
              full-width 
              variant="primary" 
              :loadingText="isEdit ? 'Updating Subject...' : 'Creating Subject...'"
              :processing="loading" 
              :disabled="loading"
            />
            <AppButton type="button" text="Cancel" variant="outline" @click="$emit('close')" />
          </div>
        </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '../../shared/AppButton.vue'
import FormField from './FormField.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { getClassArms } from '../services/api/classes'

const props = defineProps({
  show: { type: Boolean, default: false },
  subject: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit', 'submitted'])

const isEdit = computed(() => !!props.subject)

const form = reactive({
  name: '',
  code: '',
  class_level_ids: [],
  class_arm_ids: []
})

const errors = reactive({
  name: '',
  code: '',
  class_level_ids: ''
})

const loading = ref(false)
const selectedClassLevelId = ref('')
const loadingClassArmIds = ref(new Set())
const classArmsByLevelId = ref({})

const classesStore = useSchoolAdminClassesStore()

const classLevelOptions = computed(() => {
  return classesStore.classes.map(classLevel => ({
    value: classLevel.id,
    label: classLevel.name,
  }))
})

const availableClassLevelOptions = computed(() => {
  return classLevelOptions.value.filter(option => !form.class_level_ids.includes(option.value))
})

const selectedClassLevels = computed(() => {
  return form.class_level_ids
    .map(id => classesStore.classes.find(classLevel => classLevel.id === id))
    .filter(Boolean)
})

const classArmGroups = computed(() => {
  return selectedClassLevels.value.map(classLevel => ({
    classLevel,
    arms: classArmsByLevelId.value[classLevel.id] || [],
  }))
})

const resetForm = () => {
  Object.assign(form, { name: '', code: '', class_level_ids: [], class_arm_ids: [] })
  Object.assign(errors, { name: '', code: '', class_level_ids: '' })
  selectedClassLevelId.value = ''
  classArmsByLevelId.value = {}
  loadingClassArmIds.value = new Set()
}

const ensureClassesLoaded = async () => {
  if (classesStore.classes.length === 0 && !classesStore.loading) {
    await classesStore.fetchClasses()
  }
}

const selectAllArmsForLevel = (classLevelId) => {
  const armIds = (classArmsByLevelId.value[classLevelId] || []).map(arm => arm.id)
  form.class_arm_ids = Array.from(new Set([...form.class_arm_ids, ...armIds]))
}

const loadClassArmsForLevel = async (classLevelId, { autoSelectAll = false } = {}) => {
  if (!classLevelId) return

  if (classArmsByLevelId.value[classLevelId]) {
    if (autoSelectAll) {
      selectAllArmsForLevel(classLevelId)
    }
    return
  }

  loadingClassArmIds.value = new Set([...loadingClassArmIds.value, classLevelId])

  try {
    const arms = await getClassArms(classLevelId)
    classArmsByLevelId.value = {
      ...classArmsByLevelId.value,
      [classLevelId]: Array.isArray(arms) ? arms : [],
    }

    if (autoSelectAll) {
      selectAllArmsForLevel(classLevelId)
    }
  } catch (error) {
    classArmsByLevelId.value = {
      ...classArmsByLevelId.value,
      [classLevelId]: [],
    }
  } finally {
    loadingClassArmIds.value = new Set(
      [...loadingClassArmIds.value].filter(id => id !== classLevelId)
    )
  }
}

const populateForm = async (subject) => {
  resetForm()

  if (!subject) return

  form.name = subject.name || ''
  form.code = subject.code || ''
  form.class_level_ids = subject.class_levels?.map(level => level.id).filter(Boolean) || []
  form.class_arm_ids = subject.class_arms?.map(arm => arm.id).filter(Boolean) || []

  const shouldAutoSelectAllArms = form.class_arm_ids.length === 0
  await Promise.all(
    form.class_level_ids.map(classLevelId =>
      loadClassArmsForLevel(classLevelId, { autoSelectAll: shouldAutoSelectAllArms })
    )
  )
}

const handleClassLevelSelect = async () => {
  const classLevelId = selectedClassLevelId.value

  if (!classLevelId || form.class_level_ids.includes(classLevelId)) {
    selectedClassLevelId.value = ''
    return
  }

  form.class_level_ids = [...form.class_level_ids, classLevelId]
  errors.class_level_ids = ''
  selectedClassLevelId.value = ''

  await loadClassArmsForLevel(classLevelId, { autoSelectAll: true })
}

const removeClassLevel = (classLevelId) => {
  form.class_level_ids = form.class_level_ids.filter(id => id !== classLevelId)

  const armIdsForLevel = (classArmsByLevelId.value[classLevelId] || []).map(arm => arm.id)
  form.class_arm_ids = form.class_arm_ids.filter(id => !armIdsForLevel.includes(id))
}

const toggleClassArm = (classArmId) => {
  form.class_arm_ids = form.class_arm_ids.includes(classArmId)
    ? form.class_arm_ids.filter(id => id !== classArmId)
    : [...form.class_arm_ids, classArmId]
}

onMounted(async () => {
  try {
    await ensureClassesLoaded()
  } catch (error) {
  }
})

watch(() => props.show, async (show) => {
  if (show) {
    await ensureClassesLoaded()
    await populateForm(props.subject)
    return
  }

  if (!show) {
    loading.value = false
    resetForm()
  }
}, { immediate: true })

watch(() => props.subject, async (subject) => {
  if (!props.show) return
  await ensureClassesLoaded()
  await populateForm(subject)
})

const validate = () => {
  errors.name = form.name ? '' : 'Subject name is required.'
  errors.code = form.code ? '' : 'Subject code is required.'
  errors.class_level_ids = form.class_level_ids.length === 0 ? 'At least one class level is required.' : ''
  return !errors.name && !errors.code && !errors.class_level_ids
}

const submit = async () => {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const payload = {
      name: form.name,
      code: form.code,
      class_level_ids: form.class_level_ids,
      class_arm_ids: form.class_arm_ids
    }
    
    await emit('submit', {
      id: props.subject?.id,
      ...payload
    })
    
    // Don't reset form or close here - let parent handle after toast
  } catch (error) {
  } finally {
    // Keep loading state active until parent closes modal
    // Don't auto-reset loading state
  }
}
</script>
