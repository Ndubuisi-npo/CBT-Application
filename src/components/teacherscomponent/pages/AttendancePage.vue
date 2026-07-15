<template>
  <div class="space-y-6">
    <SectionCard title="Attendance" subtitle="Record exam attendance for scheduled sessions.">
      <template #header>
        <div class="flex flex-wrap gap-2">
          <select
            v-model="selectedExamId"
            class="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F3A]"
            @change="loadStudents"
          >
            <option value="">Select exam…</option>
            <option v-for="e in attendableExams" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select>
          <AppButton text="Mark All Present" variant="outline" size="sm" @click="markAll('present')" :disabled="!selectedExamId" />
          <AppButton text="Mark All Absent"  variant="ghost"   size="sm" @click="markAll('absent')"  :disabled="!selectedExamId" />
          <AppButton
            text="Save Attendance"
            variant="primary"
            size="sm"
            :processing="saving"
            :disabled="!selectedExamId || !students.length"
            @click="save"
          />
        </div>
      </template>

      <div v-if="!selectedExamId" class="py-8 text-center text-sm text-slate-400">Select an exam to manage attendance.</div>
      <div v-else-if="loading" class="py-8 text-center text-sm text-slate-500">Loading students…</div>
      <div v-else-if="loadError" class="py-6 text-center text-sm text-rose-600">
        {{ loadError }}
        <button class="ml-2 underline font-semibold" @click="loadStudents">Retry</button>
      </div>
      <div v-else>
        <!-- Summary -->
        <div class="grid gap-4 pt-6 md:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Present</p>
            <p class="mt-2 text-2xl font-semibold text-emerald-700">{{ presentCount }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Absent</p>
            <p class="mt-2 text-2xl font-semibold text-rose-600">{{ absentCount }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 text-sm">
            <p class="text-xs uppercase tracking-wider text-slate-400">Unmarked</p>
            <p class="mt-2 text-2xl font-semibold text-amber-600">{{ unmarkedCount }}</p>
          </div>
        </div>

        <div v-if="!students.length" class="py-8 text-center text-sm text-slate-500">No students found for this exam.</div>
        <div v-else class="overflow-x-auto mt-6">
          <table class="min-w-full divide-y divide-slate-200 rounded-2xl border border-slate-200 overflow-hidden">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                <th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Present</th>
                <th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Absent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="s in students" :key="s.id">
                <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ s.first_name || s.student?.first_name }} {{ s.last_name || s.student?.last_name }}</td>
                <td class="px-5 py-4 text-sm text-slate-500">{{ s.email || s.student?.email || '–' }}</td>
                <td class="px-5 py-4 text-center">
                  <input type="checkbox" :checked="attendance[s.id] === 'present'" class="h-4 w-4 accent-emerald-600"
                    @change="setAttendance(s.id, 'present')" />
                </td>
                <td class="px-5 py-4 text-center">
                  <input type="checkbox" :checked="attendance[s.id] === 'absent'" class="h-4 w-4 accent-rose-600"
                    @change="setAttendance(s.id, 'absent')" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const store = useTeacherExamsStore()
const ui    = useSchoolAdminUiStore()

const selectedExamId = ref('')
const students       = ref([])
const attendance     = reactive({})
const loading        = ref(false)
const loadError      = ref('')
const saving         = ref(false)

// Attendance is relevant for draft exams (before they're launched)
const attendableExams = computed(() =>
  store.exams.filter((e) => ['draft', 'active'].includes(e.status))
)

const presentCount  = computed(() => students.value.filter((s) => attendance[s.id] === 'present').length)
const absentCount   = computed(() => students.value.filter((s) => attendance[s.id] === 'absent').length)
const unmarkedCount = computed(() => students.value.filter((s) => !attendance[s.id]).length)

const loadStudents = async () => {
  if (!selectedExamId.value) return
  loading.value   = true
  loadError.value = ''
  try {
    const res  = await store.fetchAttendanceStudents(selectedExamId.value)
    const list = Array.isArray(res) ? res : res?.data || []
    students.value = list

    list.forEach((s) => {
      attendance[s.id] = s.attendance_status || s.status || ''
    })
    if (list.length === 0) {
      const exam = store.exams.find(e => e.id === selectedExamId.value)

      loadError.value = `No students found for this exam. This could mean: (1) No students are assigned to ${exam?.class_level?.name || exam?.class_arm?.name || 'this class'}, or (2) The exam is not linked to any class.`
    }
  } catch (err) {
    console.error('Failed to load students:', err)
    loadError.value = err.message || 'Failed to load students. The API endpoint /api/exams/{id}/attendance/class-students may not be implemented yet.'
  } finally {
    loading.value = false
  }
}

const setAttendance = (studentId, status) => {
  attendance[studentId] = attendance[studentId] === status ? '' : status
}

const markAll = (status) => {
  students.value.forEach((s) => { attendance[s.id] = status })
}

const save = async () => {
  saving.value = true
  try {
    const payload = students.value
      .filter((s) => attendance[s.id])
      .map((s) => ({ student_id: s.id, status: attendance[s.id] }))
    await store.saveAttendance(selectedExamId.value, payload)
    ui.addToast({ title: 'Saved', message: 'Attendance recorded successfully.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!store.exams.length) {
    await store.fetchExams().catch(() => {})
  }
})
</script>
