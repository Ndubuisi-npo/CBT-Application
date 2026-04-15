<template>
  <div class="space-y-6">
    <SectionCard :title="`Assign Teachers to ${subject?.name || 'Subject'}`" subtitle="Manage teacher assignments for this subject.">
      <SkeletonRows v-if="isLoading" :columns="5" />
      <div v-else-if="hasError" class="text-center py-8">
        <p class="text-slate-600">Subject not found or an error occurred.</p>
        <button @click="$router.push('/school-admin/subjects')" class="mt-4 text-blue-600 hover:text-blue-800">
          Back to Subjects
        </button>
      </div>
      <div v-else-if="!subject" class="text-center py-8">
        <p class="text-slate-600">Loading subject information...</p>
      </div>
      <div v-else class="overflow-hidden rounded-[24px] border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 bg-white">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="heading in headings" :key="heading" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ heading }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="assignments.length === 0">
                <td colspan="5" class="px-5 py-8 text-center text-slate-600">
                  No teacher assignments found for this subject.
                </td>
              </tr>
              <tr v-for="assignment in assignments" :key="assignment.id" class="transition hover:bg-slate-50/80">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ getTeacherName(assignment.user_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getClassName(assignment.class_level_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ getSessionName(assignment.academic_session_id) }}</td>
                <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(assignment.created_at) }}</td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100" @click="deleteAssignment(assignment.id)">Remove</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Assign New Teacher" subtitle="Add a new teacher assignment for this subject.">
      <form class="space-y-5" @submit.prevent="submit">
        <FormField label="Teacher" :error="errors.user_id">
          <select v-model="form.user_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
            <option value="">Select a teacher</option>
            <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.user?.id || teacher.id">
              {{ teacher.user?.first_name }} {{ teacher.user?.last_name }}
            </option>
          </select>
        </FormField>

        <FormField label="Class Level" :error="errors.class_level_id">
          <select v-model="form.class_level_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
            <option value="">Select a class level</option>
            <option v-for="classLevel in classesStore.classes" :key="classLevel.id" :value="classLevel.id">
              {{ classLevel.name }}
            </option>
          </select>
        </FormField>

        <FormField label="Academic Session" :error="errors.academic_session_id">
          <select v-model="form.academic_session_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
            <option value="">Select an academic session</option>
            <option v-for="session in sessionsStore.sessions" :key="session.id" :value="session.id">
              {{ session.name }}
            </option>
          </select>
        </FormField>

        <button type="submit" class="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 font-medium text-white transition hover:bg-[#0F2940] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">Assign Teacher</button>
      </form>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import FormField from '../components/FormField.vue'
import SectionCard from '../components/SectionCard.vue'
import SkeletonRows from '../components/SkeletonRows.vue'
import { useSchoolAdminClassesStore } from '../stores/classes'
import { useSchoolAdminSessionsStore } from '../stores/sessions'
import { useSchoolAdminSubjectsStore } from '../stores/subjects'
import { useSchoolAdminTeachersStore } from '../stores/teachers'
import { useSchoolAdminUiStore } from '../stores/ui'

const route = useRoute()
const headings = ['Teacher', 'Class Level', 'Academic Session', 'Assigned Date', 'Actions']
const subjectsStore = useSchoolAdminSubjectsStore()
const classesStore = useSchoolAdminClassesStore()
const teachersStore = useSchoolAdminTeachersStore()
const sessionsStore = useSchoolAdminSessionsStore()
const uiStore = useSchoolAdminUiStore()

const isLoading = computed(() => subjectsStore.loading || classesStore.loading || teachersStore.loading || sessionsStore.loading)
const hasError = computed(() => !isLoading.value && !subject.value && subjectsStore.subjects.length > 0)

const subjectId = computed(() => route.params.id)
const subject = computed(() => {
  console.log('Looking for subject with ID:', subjectId.value)
  console.log('Available subjects:', subjectsStore.subjects)
  const found = subjectsStore.subjects.find(s => s.id === subjectId.value)
  console.log('Found subject:', found)
  return found
})
const assignments = computed(() => {
  if (!subject.value) return []
  const assignments = subject.value?.teacher_assignments || []
  console.log('Subject assignments:', assignments)
  return assignments
})

const form = reactive({
  user_id: '',
  class_level_id: '',
  academic_session_id: ''
})

const errors = reactive({
  user_id: '',
  class_level_id: '',
  academic_session_id: ''
})

const getTeacherName = (teacherId) => {
  const teacher = teachersStore.teachers.find(t => (t.user?.id || t.id) === teacherId)
  return teacher ? `${teacher.user?.first_name} ${teacher.user?.last_name}` : 'Unknown'
}

const getClassName = (classId) => {
  const classLevel = classesStore.classes.find(c => c.id === classId)
  return classLevel ? classLevel.name : 'Unknown'
}

const getSessionName = (sessionId) => {
  const session = sessionsStore.sessions.find(s => s.id === sessionId)
  return session ? session.name : 'Unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

const validate = () => {
  errors.user_id = form.user_id ? '' : 'Teacher is required.'
  errors.class_level_id = form.class_level_id ? '' : 'Class level is required.'
  errors.academic_session_id = form.academic_session_id ? '' : 'Academic session is required.'
  return !errors.user_id && !errors.class_level_id && !errors.academic_session_id
}

const deleteAssignment = async (assignmentId) => {
  if (!confirm('Are you sure you want to remove this teacher assignment? This action cannot be undone.')) {
    return
  }
  
  try {
    await subjectsStore.removeAssignment(subjectId.value, assignmentId)
    uiStore.addToast({ title: 'Assignment removed', message: 'Teacher assignment has been removed.', variant: 'success' })
    await subjectsStore.fetchSubjects() // Refresh to get updated assignments
  } catch (error) {
    uiStore.addToast({ title: 'Error', message: 'Failed to remove assignment.', variant: 'error' })
  }
}

const submit = async () => {
  if (!validate()) return

  try {
    console.log('Submitting teacher assignment:', {
      subjectId: subjectId.value,
      form: form
    })
    
    await subjectsStore.assignTeacher(subjectId.value, form)
    uiStore.addToast({ title: 'Teacher assigned', message: 'Teacher has been successfully assigned to the subject.', variant: 'success' })
    
    // Reset form
    Object.assign(form, {
      user_id: '',
      class_level_id: '',
      academic_session_id: ''
    })
    
    await subjectsStore.fetchSubjects() // Refresh to get updated assignments
  } catch (error) {
    console.error('Assignment error:', error)
    uiStore.addToast({ title: 'Error', message: error.message || 'Failed to assign teacher.', variant: 'error' })
  }
}

onMounted(async () => {
  try {
    await subjectsStore.fetchSubjects()
    await classesStore.fetchClasses()
    await teachersStore.fetchTeachers()
    await sessionsStore.fetchSessions()
    
    // Debug: Log teacher data structure
    console.log('Teachers data structure:', teachersStore.teachers)
    if (teachersStore.teachers.length > 0) {
      console.log('First teacher structure:', teachersStore.teachers[0])
    }
  } catch (error) {
    console.error('Error loading data:', error)
    uiStore.addToast({ title: 'Error', message: 'Failed to load data. Please check your connection.', variant: 'error' })
  }
})
</script>
