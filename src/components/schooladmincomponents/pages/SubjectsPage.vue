<template>
  <div class="space-y-6">
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
              <tr v-for="subject in paginatedSubjects" :key="subject.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ subject.name }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ subject.code || '-' }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatClassLevels(subject) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatAssignedTeachers(subject) }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <AppButton text="Edit" @click="editSubject(subject)" variant="outline" size="xs" />
                    <AppButton text="Assign Teacher" @click="$router.push(`/school-admin/subjects/${subject.id}/assign-teacher`)" variant="warning" size="xs" />
                    <AppButton text="Delete" @click="deleteSubject(subject.id)" variant="danger" size="xs" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-4 bg-white border-t border-slate-200">
        <div class="text-sm text-slate-600">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, subjectsStore.subjects.length) }} of {{ subjectsStore.subjects.length }} subjects
        </div>
        <div class="flex gap-2">
          <AppButton 
            @click="previousPage" 
            text="Previous"
            :disabled="!hasPreviousPage"
            variant="outline"
            size="sm"
          />
          
          <span class="flex items-center gap-1">
            <AppButton 
              v-for="page in totalPages" 
              :key="page"
              @click="goToPage(page)"
              :text="page.toString()"
              :variant="page === currentPage ? 'primary' : 'outline'"
              size="sm"
              rounded="md"
            />
          </span>
          
          <AppButton 
            @click="nextPage" 
            text="Next"
            :disabled="!hasNextPage"
            variant="outline"
            size="sm"
          />
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

        <FormField label="Class Levels (optional)" :error="errors.class_level_ids">
          <TagMultiSelect v-model="form.class_level_ids" :options="classOptions" placeholder="Select class levels" />
        </FormField>

        <AppButton 
          type="submit" 
          :text="form.id ? 'Update Subject' : 'Create Subject'"
          full-width
          variant="primary"
          :processing="subjectsStore.loading"
        />
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import AppButton from '../../shared/AppButton.vue'
import TagMultiSelect from '../components/TagMultiSelect.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const headings = ['Subject Name', 'Code', 'Class Levels', 'Assigned Teachers', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const form = reactive({ id: null, name: '', code: '', class_level_ids: [] })
const errors = reactive({ name: '', code: '', class_level_ids: '' })

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 10

const classOptions = computed(() => classesStore.classes.map((item) => item.name))
const teacherOptions = computed(() => teachersStore.teachers.map((teacher) => teacher.user?.first_name + ' ' + teacher.user?.last_name).filter(Boolean))

const getClassNameById = (id) => classesStore.classes.find((item) => item.id === id)?.name || id

const formatClassLevels = (subject) => {
  if (!subject.class_levels || !Array.isArray(subject.class_levels)) {
    return '-'
  }
  
  return subject.class_levels.map(classLevel => classLevel.name).join(' | ')
}

const formatAssignedTeachers = (subject) => {
  if (!subject.teacher_assignments || !Array.isArray(subject.teacher_assignments)) {
    return '-'
  }
  
  const teacherNames = subject.teacher_assignments
    .map(assignment => {
      const teacher = teachersStore.teachers.find(t => t.id === assignment.user_id)
      return teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : null
    })
    .filter(Boolean)
  
  return teacherNames.length > 0 ? teacherNames.join(', ') : '-'
}

// Pagination computed properties
const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return subjectsStore.subjects.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(subjectsStore.subjects.length / itemsPerPage)
})

const hasNextPage = computed(() => {
  return currentPage.value < totalPages.value
})

const hasPreviousPage = computed(() => {
  return currentPage.value > 1
})

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

  const selected = []
  if (Array.isArray(subject.class_levels)) {
    selected.push(...subject.class_levels.map(classLevel => classLevel.name))
  }
  form.class_level_ids = selected.filter(Boolean)
}

const validate = () => {
  errors.name = form.name ? '' : 'Subject name is required.'
  return !errors.name
}

// Pagination functions
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (hasPreviousPage.value) {
    currentPage.value--
  }
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
  }

  // Handle class_level_ids
  if (form.class_level_ids.length) {
    const ids = form.class_level_ids
      .map((name) => classesStore.classes.find((item) => item.name === name)?.id)
      .filter(Boolean)
    payload.class_level_ids = ids
  }

  // Include ID if editing
  if (form.id) {
    payload.id = form.id
  }

  try {
    await subjectsStore.saveSubject(payload)

    uiStore.addToast({ title: 'Subject saved', message: 'Subject configuration was updated.', variant: 'success' })
    Object.assign(form, { id: null, name: '', code: '', class_level_ids: [] })
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to save subject', variant: 'error' })
  }
}
</script>
