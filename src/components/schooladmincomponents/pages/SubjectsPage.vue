<template>
  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <SectionCard title="Subjects" subtitle="Manage subjects and teacher assignments.">
      <SkeletonRows v-if="subjectsStore.loading" :columns="5" />
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="subject in subjectsStore.subjects" :key="subject.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ subject.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.code || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatClassLevels(subject) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.description || '-' }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border-2 border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2" @click="editSubject(subject)">Edit</button>
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteSubject(subject.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="form.id ? 'Edit Subject' : 'Create Subject'" subtitle="Create and manage subject configurations.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Subject name" :error="errors.name">
          <input v-model="form.name" class="sa-input" placeholder="Mathematics" />
        </FormField>

        <FormField label="Subject code (optional)" :error="errors.code">
          <input v-model="form.code" class="sa-input" placeholder="ENG" />
        </FormField>

        <FormField label="Description (optional)" :error="errors.description">
          <textarea v-model="form.description" class="sa-input min-h-[120px]" placeholder="Short subject description"></textarea>
        </FormField>

        <FormField label="Assigned teachers (optional)" :error="errors.teachers">
          <TagMultiSelect v-model="form.teachers" :options="teacherOptions" placeholder="Select teachers" />
        </FormField>

        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">{{ form.id ? 'Update Subject' : 'Create Subject' }}</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import TagMultiSelect from '../components/TagMultiSelect.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Subject Name', 'Code', 'Class Levels', 'Description', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', code: '', description: '', class_levels: [], teachers: [] })
const errors = reactive({ name: '', code: '', description: '', class_levels: '', teachers: '' })

const classOptions = computed(() => classesStore.classes.map((item) => item.name))
const teacherOptions = computed(() => teachersStore.teachers.map((teacher) => teacher.user?.first_name + ' ' + teacher.user?.last_name).filter(Boolean))

const getClassNameById = (id) => classesStore.classes.find((item) => item.id === id)?.name || id

const formatClassLevels = (subject) => {
  const ids = Array.isArray(subject.class_level_ids)
    ? subject.class_level_ids
    : subject.class_level_ids != null
      ? [subject.class_level_id ?? subject.class_level_ids]
      : []

  if (!ids.length) return '-'
  return ids.map(getClassNameById).join(', ')
}

onMounted(async () => {
  try {
    await subjectsStore.fetchSubjects()
    await classesStore.fetchClasses()
    await teachersStore.fetchTeachers()
  } catch (error) {
    console.error('Error loading data:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})

const editSubject = (subject) => {
  form.id = subject.id
  form.name = subject.name || ''
  form.code = subject.code || ''
  form.description = subject.description || ''

  const selected = []
  if (Array.isArray(subject.class_level_ids)) {
    selected.push(...subject.class_level_ids.map(getClassNameById))
  } else if (subject.class_level_id != null) {
    selected.push(getClassNameById(subject.class_level_id))
  }
  form.class_levels = selected.filter(Boolean)

  // Handle teachers - assuming teachers come as array of teacher objects or IDs
  const teacherNames = []
  if (Array.isArray(subject.teachers)) {
    teacherNames.push(...subject.teachers.map(teacher => 
      typeof teacher === 'object' 
        ? teacher.user?.first_name + ' ' + teacher.user?.last_name
        : teacher
    ).filter(Boolean))
  }
  form.teachers = teacherNames
}

const validate = () => {
  errors.name = form.name ? '' : 'Subject name is required.'
  return !errors.name
}

const deleteSubject = async (id) => {
  if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
    return
  }
  
  try {
    await subjectsStore.deleteSubject(id)
    uiStore.addToast({ title: 'Subject deleted', message: 'Subject has been deleted.', variant: 'success' })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to delete subject.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate()) return

  const payload = {
    name: form.name,
    code: form.code || undefined,
    description: form.description !== '' ? form.description : null,
  }

  if (form.class_levels.length) {
    const ids = form.class_levels
      .map((name) => classesStore.classes.find((item) => item.name === name)?.id)
      .filter(Boolean)

    if (ids.length === 1) {
      payload.class_level_id = ids[0]
    } else if (ids.length > 1) {
      payload.class_level_id = ids
    }
  }

  try {
    const savedSubject = await subjectsStore.saveSubject(payload)
    
    // Handle teacher assignments if teachers are selected
    if (form.teachers.length > 0) {
      const teacherIds = form.teachers
        .map((teacherName) => {
          const teacher = teachersStore.teachers.find(t => 
            t.user?.first_name + ' ' + t.user?.last_name === teacherName
          )
          return teacher?.id
        })
        .filter(Boolean)
      
      // Assign each teacher to the subject
      for (const teacherId of teacherIds) {
        await subjectsStore.assignTeacher(savedSubject.id, { teacher_id: teacherId })
      }
    }

    uiStore.addToast({ title: 'Subject saved', message: 'Subject configuration was updated.', variant: 'success' })
    Object.assign(form, { id: null, name: '', code: '', description: '', class_levels: [], teachers: [] })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save subject', variant: 'error' })
  }
}
</script>
