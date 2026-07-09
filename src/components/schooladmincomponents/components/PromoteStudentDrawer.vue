<!--
  PromoteStudentDrawer.vue
  ────────────────────────────────────────────────────────────────────────
  There is no dedicated "promote" endpoint in the backend — promoting a
  student is just moving them to a new class level/arm, which the existing
  updateStudent(id, { class_level_id, class_arm_id }) call already supports.
  This is a small, focused drawer rather than reusing the full edit form,
  since promotion is a single-purpose action.
-->
<template>
  <AppDrawer
    :model-value="show"
    title="Promote Student"
    eyebrow="Students"
    :subtitle="studentName ? `Move ${studentName} to a new class.` : 'Move this student to a new class.'"
    size="sm"
    :persistent="saving"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Current Class</p>
        <p class="mt-1 text-sm font-semibold text-slate-900">{{ currentClassLabel }}</p>
      </div>

      <FormSection title="New Class" description="Select where this student should move to.">
        <ResponsiveFormGrid :cols="1">
          <AppSelect
            v-model="classLevelId"
            label="Class Level"
            placeholder="Select class level"
            required
            :disabled="loadingClassLevels"
            :hint="loadingClassLevels ? 'Loading…' : ''"
            :options="classLevels.map((l) => ({ value: l.id, label: l.name }))"
          />
          <AppSelect
            v-model="classArmId"
            label="Class Arm"
            placeholder="Select class arm"
            required
            :disabled="!classLevelId || loadingClassArms"
            :hint="loadingClassArms ? 'Loading…' : (classLevelId && !classArms.length ? 'No arms found.' : '')"
            :options="classArms.map((a) => ({ value: a.id, label: a.name }))"
          />
        </ResponsiveFormGrid>
      </FormSection>
    </div>

    <template #footer>
      <DrawerFooter
        :processing="saving"
        submit-label="Promote Student"
        submit-loading-label="Promoting…"
        :submit-disabled="!classLevelId || !classArmId"
        submit-type="button"
        @cancel="$emit('close')"
        @submit="submit"
      />
    </template>
  </AppDrawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppDrawer from '../../shared/AppDrawer.vue'
import AppSelect from '../../shared/AppSelect.vue'
import FormSection from '../../shared/FormSection.vue'
import ResponsiveFormGrid from '../../shared/ResponsiveFormGrid.vue'
import DrawerFooter from '../../shared/DrawerFooter.vue'
import { fetchClassLevels, fetchClassArms } from '../../../js/api/classManagement'

const props = defineProps({
  show: { type: Boolean, default: false },
  student: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const sp = computed(() => {
  if (!props.student) return null
  return props.student.studentProfile || props.student.student_profile || props.student.profile || null
})

const studentName = computed(() => {
  const t = props.student || {}
  return `${t.first_name || ''} ${t.last_name || ''}`.trim()
})

const currentClassLabel = computed(() => {
  const profile = sp.value || {}
  const classArm = profile.class_arm || profile.classArm || {}
  const classLevel = profile.class_level || profile.classLevel || classArm.class_level || classArm.classLevel || {}
  const armName = classArm.name
  const levelName = classLevel.name
  if (armName && levelName) return `${levelName} ${armName}`
  return armName || levelName || 'Not assigned'
})

const classLevels = ref([])
const classArms = ref([])
const loadingClassLevels = ref(false)
const loadingClassArms = ref(false)
const classLevelId = ref('')
const classArmId = ref('')

const loadClassLevels = async () => {
  loadingClassLevels.value = true
  try {
    const data = await fetchClassLevels()
    classLevels.value = Array.isArray(data) ? data : (data?.class_levels || data?.data || [])
  } catch { classLevels.value = [] }
  finally { loadingClassLevels.value = false }
}

const loadClassArms = async (id) => {
  if (!id) { classArms.value = []; return }
  loadingClassArms.value = true
  try {
    const data = await fetchClassArms(id)
    classArms.value = Array.isArray(data) ? data : (data?.arms || data?.class_arms || data?.data || [])
  } catch { classArms.value = [] }
  finally { loadingClassArms.value = false }
}

watch(() => props.show, async (show) => {
  if (!show) return
  const profile = sp.value || {}
  const classArm = profile.class_arm || profile.classArm || {}
  const classLevel = profile.class_level || profile.classLevel || classArm.class_level || classArm.classLevel || {}
  classLevelId.value = classLevel.id || ''
  classArmId.value = ''
  await loadClassLevels()
  if (classLevelId.value) await loadClassArms(classLevelId.value)
}, { immediate: true })

watch(classLevelId, (id, prevId) => {
  if (id === prevId) return
  classArmId.value = ''
  loadClassArms(id)
})

const submit = () => {
  if (!classLevelId.value || !classArmId.value) return
  emit('submit', { id: props.student?.id, class_level_id: classLevelId.value, class_arm_id: classArmId.value })
}
</script>
