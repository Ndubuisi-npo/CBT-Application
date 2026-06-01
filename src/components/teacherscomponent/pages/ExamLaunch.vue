<template>
  <div class="space-y-6">
    <!-- Exam Info -->
    <SectionCard :title="exam?.title || 'Loading...'" subtitle="Manage attendance and launch the exam session.">
      <template #header>
        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(exam?.status)">
          {{ exam?.status?.toUpperCase() }}
        </span>
      </template>
      <div class="grid gap-4 pt-6 md:grid-cols-3">
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Subject</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.subject || '-' }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Class</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.className || '-' }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 text-sm">
          <p class="text-slate-400 text-xs uppercase tracking-wider">Duration</p>
          <p class="mt-2 font-semibold text-slate-900">{{ exam?.duration || '-' }} min</p>
        </div>
      </div>
    </SectionCard>

    <!-- Attendance -->
    <SectionCard title="Student Attendance" subtitle="Mark present/absent before starting the session.">
      <template #header>
        <div class="flex flex-wrap gap-2">
          <AppButton text="Mark All Present" variant="outline" size="sm" @click="markAllPresent" />
          <AppButton text="Mark All Absent"  variant="ghost"   size="sm" @click="markAllAbsent"  />
          <AppButton
            text="Save Attendance"
            variant="secondary"
            size="sm"
            :processing="savingAttendance"
            @click="saveAttendance"
          />
        </div>
      </template>

      <div v-if="loadingStudents" class="py-8 text-center text-sm text-slate-500">Loading students…</div>
      <div v-else-if="!students.length" class="py-8 text-center text-sm text-slate-500">No students found for this exam.</div>
      <div v-else class="overflow-x-auto pt-6">
        <table class="min-w-full divide-y divide-slate-200 rounded-2xl overflow-hidden border border-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
              <th class="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Present</th>
              <th class="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Absent</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="s in students" :key="s.id">
              <td class="px-5 py-4 text-sm font-medium text-slate-900">{{ s.first_name }} {{ s.last_name }}</td>
              <td class="px-5 py-4 text-sm text-slate-500">{{ s.email || '-' }}</td>
              <td class="px-5 py-4 text-center">
                <input type="checkbox" :checked="attendance[s.id] === 'present'" class="h-4 w-4"
                  @change="setAttendance(s.id, 'present')" />
              </td>
              <td class="px-5 py-4 text-center">
                <input type="checkbox" :checked="attendance[s.id] === 'absent'" class="h-4 w-4"
                  @change="setAttendance(s.id, 'absent')" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="mt-4 flex gap-6 text-sm text-slate-600">
        <span>Present: <strong class="text-emerald-700">{{ presentCount }}</strong></span>
        <span>Absent: <strong class="text-rose-600">{{ absentCount }}</strong></span>
        <span>Unmarked: <strong class="text-amber-600">{{ unmarkedCount }}</strong></span>
      </div>
    </SectionCard>

    <!-- Launch Section -->
    <SectionCard title="Start Exam Session" subtitle="Confirm session duration and launch the exam for present students.">
      <div class="space-y-4 pt-6">
        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-700">Session Duration (minutes)</span>
          <input
            v-model.number="sessionDuration"
            type="number"
            min="1"
            class="w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-[#0B1F3A] focus:outline-none"
            placeholder="e.g. 60"
          />
        </label>

        <div class="flex flex-wrap gap-3">
          <AppButton
            v-if="exam?.status === 'draft'"
            text="🚀 Start Session"
            variant="primary"
            :processing="starting"
            :disabled="!sessionDuration || presentCount === 0"
            @click="confirmStart"
          />
          <AppButton
            v-if="exam?.status === 'active'"
            text="⏹ End Session"
            variant="danger"
            :processing="ending"
            @click="confirmEnd"
          />
          <AppButton text="← Back to Exams" variant="ghost" @click="$router.push('/teachers/exams')" />
        </div>

        <p v-if="exam?.status !== 'draft' && exam?.status !== 'active'" class="text-sm text-amber-600">
          The exam must be in <strong>draft</strong> status to start a session.
          Current status: <strong>{{ exam?.status }}</strong>
        </p>
      </div>
    </SectionCard>

    <!-- Confirm Modal -->
    <div v-if="confirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <h2 class="text-xl font-semibold text-slate-900">{{ confirmModal.title }}</h2>
        <p class="mt-3 text-sm text-slate-500">{{ confirmModal.message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <AppButton text="Cancel" variant="ghost" @click="confirmModal = null" />
          <AppButton :text="confirmModal.confirmLabel" :variant="confirmModal.variant" @click="confirmModal.onConfirm(); confirmModal = null" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '../../shared/AppButton.vue'
import SectionCard from '../components/SectionCard.vue'
import { useTeacherExamsStore } from '../stores/exams'
import { useSchoolAdminUiStore } from '../../schooladmincomponents/stores/ui'

const route = useRoute()
const router = useRouter()
const store  = useTeacherExamsStore()
const ui     = useSchoolAdminUiStore()

const examId = route.params.id
const exam   = ref(null)

const students       = ref([])
const attendance     = reactive({})
const loadingStudents = ref(false)
const savingAttendance = ref(false)
const sessionDuration  = ref(60)
const starting = ref(false)
const ending   = ref(false)
const confirmModal = ref(null)

const presentCount  = computed(() => students.value.filter((s) => attendance[s.id] === 'present').length)
const absentCount   = computed(() => students.value.filter((s) => attendance[s.id] === 'absent').length)
const unmarkedCount = computed(() => students.value.filter((s) => !attendance[s.id]).length)

const statusClass = (status) => {
  const map = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-indigo-100 text-indigo-700',
    active: 'bg-emerald-100 text-emerald-700',
    grading: 'bg-amber-100 text-amber-700',
    completed: 'bg-purple-100 text-purple-700',
    published: 'bg-emerald-100 text-emerald-700',
    locked: 'bg-rose-100 text-rose-700',
  }
  return map[(status || '').toLowerCase()] || 'bg-slate-100 text-slate-700'
}

const loadData = async () => {
  try {
    exam.value = await store.fetchExam(examId)
    sessionDuration.value = exam.value.duration || 60
  } catch {
    ui.addToast({ title: 'Error', message: 'Failed to load exam.', variant: 'error' })
  }

  loadingStudents.value = true
  try {
    const res = await store.fetchAttendanceStudents(examId)
    const list = Array.isArray(res) ? res : res?.data || []
    students.value = list
    // Pre-populate from existing attendance status
    list.forEach((s) => {
      attendance[s.id] = s.attendance_status || s.status || ''
    })
  } catch {
    ui.addToast({ title: 'Warning', message: 'Could not load student list.', variant: 'error' })
  } finally {
    loadingStudents.value = false
  }
}

onMounted(loadData)

const setAttendance = (studentId, status) => {
  attendance[studentId] = attendance[studentId] === status ? '' : status
}

const markAllPresent = () => students.value.forEach((s) => { attendance[s.id] = 'present' })
const markAllAbsent  = () => students.value.forEach((s) => { attendance[s.id] = 'absent'  })

const saveAttendance = async () => {
  savingAttendance.value = true
  try {
    const payload = students.value
      .filter((s) => attendance[s.id])
      .map((s) => ({ student_id: s.id, status: attendance[s.id] }))
    await store.saveAttendance(examId, payload)
    ui.addToast({ title: 'Attendance saved', message: 'Attendance recorded successfully.', variant: 'success' })

    // Auto-activate exam after attendance save
    starting.value = true
    await store.activateExam(examId, sessionDuration.value)
    exam.value = await store.fetchExam(examId)
    ui.addToast({ title: 'Exam launched', message: 'Exam is now active for present students.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Error', message: err.message, variant: 'error' })
  } finally {
    savingAttendance.value = false
    starting.value = false
  }
}

const confirmStart = () => {
  confirmModal.value = {
    title: 'Start Exam Session',
    message: `This will start a ${sessionDuration.value}-minute session for ${presentCount.value} present students. Continue?`,
    confirmLabel: 'Start Session',
    variant: 'primary',
    onConfirm: doStart,
  }
}

const doStart = async () => {
  starting.value = true
  try {
    await store.performLifecycleAction(examId, 'activate', { session_duration_minutes: sessionDuration.value })
    exam.value = store.exams.find((e) => String(e.id) === String(examId)) || exam.value
    ui.addToast({ title: 'Session started', message: 'Exam is now active.', variant: 'success' })
  } catch (err) {
    ui.addToast({ title: 'Start failed', message: err.message, variant: 'error' })
  } finally {
    starting.value = false
  }
}

const confirmEnd = () => {
  confirmModal.value = {
    title: 'End Exam Session',
    message: 'This will end the session and submit any remaining attempts. Are you sure?',
    confirmLabel: 'End Session',
    variant: 'danger',
    onConfirm: doEnd,
  }
}

const doEnd = async () => {
  ending.value = true
  try {
    await store.performLifecycleAction(examId, 'end-session')
    exam.value = store.exams.find((e) => String(e.id) === String(examId)) || exam.value
    ui.addToast({ title: 'Session ended', message: 'Exam session has ended.', variant: 'success' })
    router.push('/teachers/exams')
  } catch (err) {
    ui.addToast({ title: 'End failed', message: err.message, variant: 'error' })
  } finally {
    ending.value = false
  }
}
</script>
