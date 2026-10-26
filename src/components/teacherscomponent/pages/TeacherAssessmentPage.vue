<template>
  <div class="space-y-6">
    <AppPageHeader
      v-if="!loadingPage"
      :title="assessment?.title || 'Assessment Workspace'"
      :subtitle="assessment?.description || 'Build your paper for this assessment.'"
      eyebrow="Submissions"
    >
      <template #actions>
        <AppButton text="All submissions" variant="outline" size="sm" :icon="ArrowLeft" @click="router.push('/teachers/assessments')" />
      </template>
    </AppPageHeader>

    <div v-if="assessment && !loadingPage" class="-mt-2 mb-1 flex flex-wrap items-center gap-2">
      <SubmissionCountdown v-if="deadline" :deadline="deadline" @expired="deadlinePassed = true" />
      <AppBadge v-if="submission" :label="getSubmissionStatusLabel(submissionStatus)" :variant="getSubmissionStatusVariant(submissionStatus)" dot />
      <AppBadge :label="classText" variant="default" />
    </div>

    <div
      v-if="loadingPage"
      class="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1F3A]/5">
        <LoaderCircle class="h-8 w-8 animate-spin text-[#0B1F3A]" aria-hidden="true" />
      </div>
      <h1 class="mt-5 text-lg font-semibold text-slate-900">Loading assessment</h1>
      <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Preparing your assessment workspace, submission, and timetable.
      </p>
    </div>

    <template v-else-if="assessment">
      <p v-if="deadlinePassed" class="rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-800">
        The submission window closed on {{ formatScheduleDate(deadline) }}. Your paper is now read-only.
      </p>
      <p v-else-if="banner" class="rounded-2xl px-5 py-4 text-sm" :class="banner.tone">{{ banner.text }}</p>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="space-y-6">
          <!-- Step 1: create paper -->
          <section v-if="!submission" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Step 1</p>
            <h2 class="text-3xl font-light leading-tight tracking-tight text-[#0B1F3A]">Start your paper</h2>
            <p class="mt-2 max-w-lg text-sm text-slate-500">
              Name the paper and pick the subject it covers. You can add questions from your bank straight after.
            </p>

            <div class="mt-6 max-w-lg space-y-4">
              <AppSelect v-model="form.subjectId" label="Subject" :options="subjectOptions" placeholder="Select subject" required :error="errors.subjectId" @blur="touch('subjectId')" />
              <AppInput v-model="form.title" label="Paper title" placeholder="e.g. Mathematics — First Term" required :error="errors.title" @blur="touch('title')" />
              <AppTextarea v-model="form.description" label="Short description" placeholder="e.g. Covers algebra chapters 1–4" :rows="2" />
              <AppButton text="Create paper" variant="primary" :disabled="deadlinePassed" :processing="creating" @click="createSubmission" />
            </div>
          </section>

          <!-- Question builder -->
          <section v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-slate-900">{{ submission.title }}</h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ submissionSubjectName }} · {{ questionCount }} {{ questionCount === 1 ? 'question' : 'questions' }}
                  <template v-if="submission.description"> · {{ submission.description }}</template>
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <AppButton
                  text="Add from bank"
                  variant="outline"
                  size="sm"
                  :icon="Plus"
                  :disabled="!canAddQuestion"
                  :title="!canAddQuestion && editable ? `Marks cap (${assessmentCap}) reached` : null"
                  @click="openQuestionBankModal"
                />
                <AppButton
                  text="Submit for review"
                  variant="success"
                  size="sm"
                  :icon="Send"
                  :disabled="!canSubmitForReview"
                  :processing="submitting"
                  @click="submitForReview"
                />
              </div>
            </div>

            <AppEmptyState
              v-if="!questions.length"
              :icon="FileQuestion"
              title="No questions yet"
              description="Add your first question from the bank to get started."
            >
              <template #actions>
                <AppButton text="Add from bank" variant="primary" :icon="Plus" :disabled="!editable" @click="openQuestionBankModal" />
              </template>
            </AppEmptyState>

            <div v-else class="space-y-4 p-5 sm:p-6">
              <div v-for="(question, index) in questions" :key="question.id ?? index" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900">Question {{ question.order ?? index + 1 }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ questionTypeLabel(question.type) }} · {{ question.marks }} marks</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <AppButton text="Edit" variant="outline" size="xs" :disabled="!editable" @click="editQuestion(question)" />
                    <AppButton :icon="Trash2" variant="ghost" size="xs" :disabled="!editable" aria-label="Delete question" @click="removeQuestion(question.id)" />
                  </div>
                </div>
                <p class="mt-3 text-sm text-slate-700">{{ question.content }}</p>
                <img v-if="question.image_url" :src="question.image_url" alt="Question image" class="mt-3 max-h-32 rounded-xl border border-slate-200 object-contain" />
                <div v-if="question.options?.length" class="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="option.id ?? optIndex"
                    class="rounded-2xl px-3 py-2 text-sm"
                    :class="option.is_correct ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700'"
                  >
                    <span v-if="option.label" class="font-semibold">{{ option.label }}.</span> {{ option.content }}
                  </div>
                </div>
                <p v-if="question.explanation" class="mt-3 text-xs text-slate-500">
                  <span class="font-semibold text-slate-700">Explanation:</span> {{ question.explanation }}
                </p>
              </div>
            </div>
          </section>

          <!-- Admin feedback -->
          <section v-if="submission && comments.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Admin feedback</p>
            <ul class="space-y-3">
              <li v-for="comment in comments" :key="comment.id" class="rounded-xl bg-slate-50/70 p-4">
                <p class="text-xs font-semibold text-slate-900">{{ comment.author || 'School admin' }}</p>
                <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ comment.text ?? comment.body ?? comment.comment }}</p>
                <p class="mt-1.5 text-[11px] text-slate-400">{{ formatDate(comment.createdAt ?? comment.created_at) }}</p>
              </li>
            </ul>
          </section>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Marks allocation</p>
            <p class="text-5xl font-light leading-none text-[#0B1F3A]">
              {{ marksUsed }}<span class="text-2xl text-slate-400">/{{ assessmentCap }}</span>
            </p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-[#0B1F3A] transition-[width] duration-300" :style="{ width: `${completionPercent}%` }" />
            </div>
            <p class="mt-2 text-xs text-slate-400">{{ completionText }}</p>

            <dl class="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Questions</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ questionCount }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Term</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ termText }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-xs text-slate-400">Window closes</dt>
                <dd class="text-right text-sm font-medium text-slate-900">{{ formatScheduleDate(deadline) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Exam day slot: teacher-owned scheduling -->
          <section
            v-if="assessment.schedule_id"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="exam-slot-heading"
            :aria-busy="slotsLoading || savingSlot || removingSlot"
          >
            <div class="mb-4 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Exam day slots</p>
                <h2 id="exam-slot-heading" class="mt-1 text-base font-semibold text-[#0B1F3A]">
                  {{ slotState === 'editable' ? (ownSlot ? 'Your exam slot' : 'Schedule your subject') : 'Exam timetable' }}
                </h2>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                :class="slotStateBadge.tone"
              >
                <component :is="slotStateBadge.icon" class="h-3 w-3" aria-hidden="true" />
                {{ slotStateBadge.label }}
              </span>
            </div>

            <!-- Loading / error -->
            <div v-if="slotsLoading" class="space-y-2" role="status" aria-label="Loading exam timetable">
              <div class="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div class="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div class="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div v-else-if="slotsError" class="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              <p>{{ slotsError }}</p>
              <AppButton class="mt-2" text="Try again" variant="outline" size="xs" @click="loadSlots" />
            </div>

            <template v-else>
              <!-- State C: not approved -->
              <p
                v-if="slotState === 'unapproved'"
                class="mb-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
              >
                <Lock class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>Scheduling opens after your paper is approved.</span>
              </p>

              <!-- State B: approved, schedule not draft (or access revoked) -->
              <p
                v-else-if="slotState === 'locked'"
                class="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
              >
                <Lock class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>{{ lockedMessage }}</span>
              </p>

              <!-- State A: editor -->
              <form v-else class="mb-5 space-y-3.5" novalidate @submit.prevent="saveSlot">
                <p v-if="ownSlot" class="rounded-xl bg-[#F3F6FB] px-3 py-2 text-xs text-slate-600">
                  Currently scheduled:
                  <span class="font-semibold text-[#0B1F3A]">
                    {{ formatSlotDate(slotStartInstant(ownSlot)) }}, {{ formatSlotTime(slotStartInstant(ownSlot)) }} – {{ formatSlotTime(slotEndInstant(ownSlot)) }}
                  </span>
                </p>

                <div>
                  <label for="slot-date" class="mb-1.5 block text-sm font-medium text-slate-700">Exam date</label>
                  <input
                    id="slot-date"
                    type="date"
                    :value="slotForm.date"
                    :min="windowStartKey || undefined"
                    :max="windowEndKey || undefined"
                    :disabled="slotBusy"
                    :aria-invalid="!!shownErrors.date"
                    :aria-describedby="shownErrors.date ? 'slot-date-error' : 'slot-window-hint'"
                    :class="[slotInputClass, shownErrors.date ? '!border-red-300' : '']"
                    @input="onDateInput($event.target.value)"
                  />
                  <p v-if="shownErrors.date" id="slot-date-error" class="mt-1.5 text-xs text-red-600" role="alert">{{ shownErrors.date }}</p>
                  <p v-else-if="windowLabel" id="slot-window-hint" class="mt-1.5 text-xs text-slate-500">
                    Allowed window (Lagos time): {{ windowLabel }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="slot-start" class="mb-1.5 block text-sm font-medium text-slate-700">Start time</label>
                    <input
                      id="slot-start"
                      type="time"
                      step="300"
                      :value="slotForm.start"
                      :disabled="slotBusy"
                      :aria-invalid="!!shownErrors.start"
                      :aria-describedby="shownErrors.start ? 'slot-start-error' : undefined"
                      :class="[slotInputClass, shownErrors.start ? '!border-red-300' : '']"
                      @input="onStartInput($event.target.value)"
                    />
                    <p v-if="shownErrors.start" id="slot-start-error" class="mt-1.5 text-xs text-red-600" role="alert">{{ shownErrors.start }}</p>
                  </div>
                  <div>
                    <label for="slot-end" class="mb-1.5 block text-sm font-medium text-slate-700">End time</label>
                    <input
                      id="slot-end"
                      type="time"
                      step="300"
                      :value="slotForm.end"
                      :disabled="slotBusy"
                      :aria-invalid="!!shownErrors.end"
                      :aria-describedby="shownErrors.end ? 'slot-end-error' : undefined"
                      :class="[slotInputClass, shownErrors.end ? '!border-red-300' : '']"
                      @input="onEndInput($event.target.value)"
                    />
                    <p v-if="shownErrors.end" id="slot-end-error" class="mt-1.5 text-xs text-red-600" role="alert">{{ shownErrors.end }}</p>
                  </div>
                </div>

                <div>
                  <label for="slot-duration" class="mb-1.5 block text-sm font-medium text-slate-700">Duration (minutes)</label>
                  <input
                    id="slot-duration"
                    type="number"
                    min="1"
                    step="5"
                    inputmode="numeric"
                    :value="slotForm.duration"
                    :disabled="slotBusy"
                    :aria-invalid="!!shownErrors.duration"
                    :aria-describedby="shownErrors.duration ? 'slot-duration-error' : 'slot-duration-hint'"
                    :class="[slotInputClass, shownErrors.duration ? '!border-red-300' : '']"
                    @input="onDurationInput($event.target.value)"
                  />
                  <p v-if="shownErrors.duration" id="slot-duration-error" class="mt-1.5 text-xs text-red-600" role="alert">{{ shownErrors.duration }}</p>
                  <p v-else id="slot-duration-hint" class="mt-1.5 text-xs text-slate-500">
                    The end time follows the start time and duration{{ assessment.duration_minutes ? ` (assessment default: ${assessment.duration_minutes} min)` : '' }}.
                  </p>
                </div>

                <!-- Daily capacity -->
                <div
                  class="rounded-xl border px-3 py-2.5"
                  :class="capacity.full ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'"
                  aria-live="polite"
                >
                  <p class="flex items-center justify-between gap-2 text-xs font-semibold" :class="capacity.full ? 'text-rose-700' : 'text-slate-700'">
                    <span>{{ capacityText }}</span>
                    <span v-if="!capacity.unlimited && slotForm.date" class="font-medium tabular-nums opacity-70">{{ capacity.used }}/{{ capacity.cap }}</span>
                  </p>
                  <div
                    v-if="!capacity.unlimited && slotForm.date"
                    class="mt-2 h-1.5 overflow-hidden rounded-full bg-white"
                    role="progressbar"
                    aria-label="Subject slots used on the chosen day"
                    :aria-valuemin="0"
                    :aria-valuemax="capacity.cap"
                    :aria-valuenow="Math.min(capacity.used, capacity.cap)"
                  >
                    <div
                      class="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                      :class="capacity.full ? 'bg-rose-500' : 'bg-[#0B1F3A]'"
                      :style="{ width: `${capacity.percent}%` }"
                    />
                  </div>
                  <p class="mt-1.5 text-[11px] text-slate-500">
                    {{ capacity.full ? 'Pick another day — ' : '' }}Counted across every schedule for {{ classText }}.
                  </p>
                </div>

                <p v-if="shownErrors.form" class="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                  {{ shownErrors.form }}
                </p>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <AppButton
                    type="submit"
                    :text="ownSlot ? 'Update slot' : 'Save slot'"
                    loading-text="Saving…"
                    variant="primary"
                    size="sm"
                    :icon="CalendarClock"
                    :processing="savingSlot"
                    :disabled="removingSlot || capacity.full"
                  />
                  <template v-if="ownSlot">
                    <AppButton
                      v-if="!confirmingRemove"
                      text="Remove"
                      variant="outline"
                      size="sm"
                      :icon="Trash2"
                      :disabled="savingSlot || removingSlot"
                      @click="confirmingRemove = true"
                    />
                    <div v-else class="flex w-full flex-wrap items-center gap-2 rounded-xl bg-rose-50 px-3 py-2" role="alertdialog" aria-label="Confirm slot removal">
                      <span class="mr-auto text-xs font-medium text-rose-800">Remove your exam slot?</span>
                      <AppButton text="Keep" variant="ghost" size="xs" :disabled="removingSlot" @click="confirmingRemove = false" />
                      <AppButton text="Yes, remove" loading-text="Removing…" variant="danger" size="xs" :processing="removingSlot" @click="removeSlot" />
                    </div>
                  </template>
                </div>
              </form>

              <!-- Timetable -->
              <div>
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Timetable</p>
                  <span v-if="store.slotMutating" class="text-[11px] text-slate-400" role="status">Updating…</span>
                </div>

                <p
                  v-if="!timetableDays.length"
                  class="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400"
                >
                  No subject slots have been placed yet.
                </p>

                <div v-else class="space-y-3">
                  <div v-for="day in timetableDays" :key="day.key">
                    <p class="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{{ formatDateKey(day.key) }}</span>
                      <span v-if="dayUsageLabel(day.key)" class="font-medium tabular-nums text-slate-400">{{ dayUsageLabel(day.key) }}</span>
                    </p>
                    <ul class="space-y-1.5">
                      <li
                        v-for="slot in day.slots"
                        :key="slot.id"
                        class="rounded-xl border px-3 py-2 text-sm"
                        :class="isOwnSlot(slot) ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10' : 'border-slate-200 bg-white'"
                      >
                        <div class="flex items-baseline justify-between gap-2">
                          <span class="min-w-0 truncate font-medium text-slate-900">
                            {{ slotSubjectName(slot) }}
                            <span v-if="slot.subject?.code || slot.subject_code || slot.subjectCode" class="font-normal text-slate-400">· {{ slot.subject?.code || slot.subject_code || slot.subjectCode }}</span>
                          </span>
                          <span v-if="isOwnSlot(slot)" class="shrink-0 rounded-full bg-[#0B1F3A] px-2 py-0.5 text-[10px] font-semibold text-white">You</span>
                        </div>
                        <p class="mt-0.5 text-xs text-slate-500">
                          {{ formatSlotTime(slotStartInstant(slot)) }} – {{ formatSlotTime(slotEndInstant(slot)) }}
                          <template v-if="formatDuration(slotDurationMinutes(slot))"> · {{ formatDuration(slotDurationMinutes(slot)) }}</template>
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </section>
        </div>
      </div>
    </template>

    <AppEmptyState
      v-else
      :icon="Inbox"
      title="Assessment not found"
      description="This assessment is no longer available to you."
    >
      <template #actions>
        <AppButton text="Back to submissions" variant="outline" @click="router.push('/teachers/assessments')" />
      </template>
    </AppEmptyState>

    <QuestionModal
      v-if="showQuestionModal"
      :show="showQuestionModal"
      :question="activeQuestion"
      :saving="savingQuestion"
      @close="closeQuestionModal"
      @submit="saveQuestion"
    />

    <QuestionBankModal
      v-if="showQuestionBankModal"
      :show="showQuestionBankModal"
      :subject-id="submission?.subject_id ?? submission?.subjectId"
      :subject-label="submissionSubjectName"
      :class-level-id="assessment?.class_level_id ?? assessment?.classLevelId"
      :remaining-marks="remainingMarks"
      :saving="addingSelectedQuestions"
      @close="showQuestionBankModal = false"
      @submit="addSelectedBankQuestions"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarClock, CheckCircle2, FileQuestion, Inbox, LoaderCircle, Lock, PencilLine, Plus, Send, Trash2 } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppInput from '../../shared/AppInput.vue'
import AppPageHeader from '../../shared/AppPageHeader.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import QuestionModal from '../components/QuestionModal.vue'
import QuestionBankModal from '../components/QuestionBankModal.vue'
import SubmissionCountdown from '../components/SubmissionCountdown.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import {
  computeDayCapacity,
  firstFieldError,
  formatDateKey,
  formatDuration,
  formatSlotDate,
  formatSlotTime,
  groupSlotsByDay,
  lagosLocalToDate,
  lagosLocalToIso,
  parseSlotInstant,
  slotDurationMinutes,
  slotEndInstant,
  slotStartInstant,
  slotErrorMessage,
  slotSubjectId,
  submissionSubjectId,
  toLagosDateKey,
  toLagosTimeInput,
} from '../../../js/lib/slotTime'
import {
  useAssessmentsStore,
  getSubmissionStatusLabel,
  getSubmissionStatusVariant,
} from '../../schooladmincomponents/stores/assessments'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const assessmentId = route.params.id

const form = reactive({ subjectId: '', title: '', description: '' })
const errors = reactive({ subjectId: '', title: '' })
const showQuestionModal = ref(false)
const showQuestionBankModal = ref(false)
const activeQuestion = ref(null)
const deadlinePassed = ref(false)
const creating = ref(false)
const submitting = ref(false)
const savingQuestion = ref(false)
const addingSelectedQuestions = ref(false)
const loadingPage = ref(true)

const assessment = computed(() => store.current)
const submission = computed(() => store.currentSubmission)
const questions = computed(() => submission.value?.questions ?? submission.value?.submissionQuestions ?? [])
const questionCount = computed(() => questions.value.length || submission.value?.question_count || 0)
const subjectOptions = computed(() => store.subjectOptions)
const scheduleSubjects = computed(() => store.scheduleSubjects)
// The backend doesn't document a `comments` relation on Submission — the
// request-changes comment is delivered to the teacher via notification, not
// stored as a thread. Render defensively in case the backend adds one later.
const comments = computed(() => (Array.isArray(submission.value?.comments) ? submission.value.comments : []))

const submissionStatus = computed(() => (submission.value?.status || 'draft').toLowerCase())
const deadline = computed(() => assessment.value?.question_submission_ends || null)

const BANNERS = {
  changes_requested: { tone: 'bg-amber-50 text-amber-800', text: 'Changes were requested on this paper. Update it and submit again before the window closes.' },
  submitted: { tone: 'bg-sky-50 text-sky-800', text: 'Your paper is awaiting review by the school admin. Editing is locked until they respond.' },
  approved: { tone: 'bg-emerald-50 text-emerald-800', text: 'This paper has been approved. Once the assessment is activated it becomes a live exam automatically.' },
}
const banner = computed(() => (submission.value ? BANNERS[submissionStatus.value] : undefined))

// Editing is allowed while the question window is open and the submission is
// either a fresh draft or has been sent back for changes. `changes_requested`
// naturally re-enables the builder; `submitted`/`approved` lock it.
const editable = computed(() =>
  !deadlinePassed.value &&
  (assessment.value?.question_submission_status ?? 'open') === 'open' &&
  ['draft', 'changes_requested'].includes(submissionStatus.value)
)
const assessmentCap = computed(() => assessment.value?.total_marks ?? assessment.value?.totalMarks ?? 0)
const canAddQuestion = computed(() => editable.value && marksUsed.value < assessmentCap.value)
const canSubmitForReview = computed(() => editable.value && questionCount.value > 0)

onMounted(async () => {
  try {
    await Promise.all([store.fetchRefData(), store.fetchAssessment(assessmentId)])
    if (assessment.value) {
      await store.fetchMySubmission(assessmentId)
      if (assessment.value.schedule_id) await loadSlots()
      if (deadline.value && (parseSlotInstant(deadline.value)?.getTime() ?? Infinity) <= Date.now()) {
        deadlinePassed.value = true
      }
    }
  } finally {
    loadingPage.value = false
  }
})

/* ---------------------------------------------------------------------------
 * Teacher-owned exam slot
 * ------------------------------------------------------------------------- */

const slotInputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

const slotForm = reactive({ date: '', start: '', end: '', duration: '' })
const slotServerErrors = reactive({ date: '', start: '', end: '', duration: '', form: '' })
const slotsLoading = ref(false)
const slotsError = ref('')
const savingSlot = ref(false)
const removingSlot = ref(false)
const confirmingRemove = ref(false)
const slotAttempted = ref(false)
// Set when the server tells us we can't edit even though the page thought we could (403 / 409).
const slotRevokedReason = ref('')

const slotBusy = computed(() => savingSlot.value || removingSlot.value)
const assessmentStatus = computed(() => (assessment.value?.assessment_status ?? '').toLowerCase())

// Two independent conditions: the paper must be approved AND the schedule still draft.
const canPlaceSlot = computed(() =>
  submissionStatus.value === 'approved' && assessmentStatus.value === 'draft' && !slotRevokedReason.value
)
const slotState = computed(() => {
  if (canPlaceSlot.value) return 'editable'
  if (submissionStatus.value === 'approved') return 'locked'
  return 'unapproved'
})
const lockedMessage = computed(() => slotRevokedReason.value || 'The schedule is locked.')
const slotStateBadge = computed(() => {
  if (slotState.value === 'editable') return { label: 'Editable', tone: 'bg-emerald-50 text-emerald-700', icon: PencilLine }
  if (slotState.value === 'locked') return { label: 'Locked', tone: 'bg-amber-50 text-amber-700', icon: Lock }
  return { label: 'Awaiting approval', tone: 'bg-slate-100 text-slate-600', icon: CheckCircle2 }
})

const mySubjectId = computed(() => submissionSubjectId(submission.value))
const isOwnSlot = (slot) =>
  mySubjectId.value !== null && slotSubjectId(slot) !== null && String(slotSubjectId(slot)) === String(mySubjectId.value)
const ownSlot = computed(() => scheduleSubjects.value.find(isOwnSlot) || null)
// One entry per slot, own slot included (highlighted) — never listed twice.
const timetableDays = computed(() => groupSlotsByDay(scheduleSubjects.value))

const windowStartKey = computed(() => toLagosDateKey(assessment.value?.assessment_starts))
const windowEndKey = computed(() => toLagosDateKey(assessment.value?.assessment_ends))
const windowLabel = computed(() => {
  const a = assessment.value
  if (!a?.assessment_starts || !a?.assessment_ends) return ''
  return `${formatSlotDate(a.assessment_starts)}, ${formatSlotTime(a.assessment_starts)} – ${formatSlotDate(a.assessment_ends)}, ${formatSlotTime(a.assessment_ends)}`
})

const startsLocal = computed(() => (slotForm.date && slotForm.start ? `${slotForm.date}T${slotForm.start}` : ''))
const endsLocal = computed(() => (slotForm.date && slotForm.end ? `${slotForm.date}T${slotForm.end}` : ''))

const capacity = computed(() =>
  computeDayCapacity({ meta: store.scheduleSubjectMeta, dateKey: slotForm.date, ownSlot: ownSlot.value })
)
const capacityText = computed(() => {
  const c = capacity.value
  if (c.unlimited) return 'No daily limit'
  if (!slotForm.date) return `Up to ${c.cap} subject slots per day — pick a date to see usage`
  if (c.full) return `Day full — ${c.used} of ${c.cap} subject slots used`
  return `${c.used} of ${c.cap} subject slots used`
})
const dayUsageLabel = (key) => {
  const c = computeDayCapacity({ meta: store.scheduleSubjectMeta, dateKey: key })
  if (c.unlimited) return ''
  return `${c.used}/${c.cap} used`
}

const minutesOf = (time) => {
  const match = /^(\d{2}):(\d{2})$/.exec(time || '')
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}
const timeOf = (minutes) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// Validation derived from the form; shown once the teacher has tried to save
// (or after a server error), except day-full which is shown immediately.
const liveErrors = computed(() => {
  const out = { date: '', start: '', end: '', duration: '' }
  if (!slotForm.date) out.date = 'Choose the exam date.'
  else if (!lagosLocalToDate(`${slotForm.date}T00:00`)) out.date = 'Enter a valid date.'
  if (!slotForm.start) out.start = 'Choose a start time.'
  if (!slotForm.end) out.end = 'Choose an end time.'
  const duration = Number(slotForm.duration)
  if (!slotForm.duration || !Number.isFinite(duration) || duration <= 0 || !Number.isInteger(duration)) {
    out.duration = 'Enter a duration in whole minutes (1 or more).'
  }
  const startMin = minutesOf(slotForm.start)
  const endMin = minutesOf(slotForm.end)
  if (!out.end && !out.start && startMin !== null && endMin !== null && endMin <= startMin) {
    out.end = 'End time must be after the start time (a slot can’t run past midnight).'
  }
  if (!out.date && !out.start && !out.end) {
    const starts = lagosLocalToDate(startsLocal.value)
    const ends = lagosLocalToDate(endsLocal.value)
    const windowStart = parseSlotInstant(assessment.value?.assessment_starts)
    const windowEnd = parseSlotInstant(assessment.value?.assessment_ends)
    if (starts && windowStart && !Number.isNaN(windowStart.getTime()) && starts < windowStart) {
      out.date = `The slot must start no earlier than ${formatSlotDate(windowStart)}, ${formatSlotTime(windowStart)} (Lagos time).`
    } else if (ends && windowEnd && !Number.isNaN(windowEnd.getTime()) && ends > windowEnd) {
      out.date = `The slot must finish by ${formatSlotDate(windowEnd)}, ${formatSlotTime(windowEnd)} (Lagos time).`
    }
  }
  if (capacity.value.full && slotForm.date) {
    out.date = out.date || `This day is full — ${capacity.value.used} of ${capacity.value.cap} subject slots used. Pick another day.`
  }
  return out
})
const hasLiveErrors = computed(() => Object.values(liveErrors.value).some(Boolean))
const shownErrors = computed(() => ({
  date: slotServerErrors.date || (capacity.value.full && slotForm.date ? liveErrors.value.date : (slotAttempted.value ? liveErrors.value.date : '')),
  start: slotServerErrors.start || (slotAttempted.value ? liveErrors.value.start : ''),
  end: slotServerErrors.end || (slotAttempted.value ? liveErrors.value.end : ''),
  duration: slotServerErrors.duration || (slotAttempted.value ? liveErrors.value.duration : ''),
  form: slotServerErrors.form,
}))

const clearServerErrors = () => {
  slotServerErrors.date = ''
  slotServerErrors.start = ''
  slotServerErrors.end = ''
  slotServerErrors.duration = ''
  slotServerErrors.form = ''
}

/** Fill the form from the teacher's existing slot, or sensible defaults when none is placed. */
const hydrateSlotForm = () => {
  clearServerErrors()
  slotAttempted.value = false
  confirmingRemove.value = false
  const own = ownSlot.value
  if (own) {
    slotForm.date = toLagosDateKey(slotStartInstant(own))
    slotForm.start = toLagosTimeInput(slotStartInstant(own))
    slotForm.end = toLagosTimeInput(slotEndInstant(own))
    slotForm.duration = String(slotDurationMinutes(own) ?? assessment.value?.duration_minutes ?? '')
  } else {
    slotForm.date = windowStartKey.value || ''
    slotForm.start = ''
    slotForm.end = ''
    slotForm.duration = assessment.value?.duration_minutes ? String(assessment.value.duration_minutes) : ''
  }
}

const recomputeEnd = () => {
  const startMin = minutesOf(slotForm.start)
  const duration = Number(slotForm.duration)
  if (startMin === null || !Number.isInteger(duration) || duration <= 0) return
  slotForm.end = timeOf(startMin + duration)
}

const onDateInput = (value) => { slotForm.date = value; slotServerErrors.date = ''; slotServerErrors.form = '' }
const onStartInput = (value) => {
  slotForm.start = value
  slotServerErrors.start = ''; slotServerErrors.end = ''; slotServerErrors.date = ''; slotServerErrors.form = ''
  recomputeEnd()
}
const onDurationInput = (value) => {
  slotForm.duration = value
  slotServerErrors.duration = ''; slotServerErrors.end = ''; slotServerErrors.form = ''
  recomputeEnd()
}
const onEndInput = (value) => {
  slotForm.end = value
  slotServerErrors.end = ''; slotServerErrors.date = ''; slotServerErrors.form = ''
  const startMin = minutesOf(slotForm.start)
  const endMin = minutesOf(value)
  if (startMin !== null && endMin !== null && endMin > startMin) slotForm.duration = String(endMin - startMin)
}

const loadSlots = async () => {
  slotsLoading.value = true
  slotsError.value = ''
  try {
    await store.fetchScheduleSubjects(assessmentId)
    hydrateSlotForm()
  } catch (error) {
    slotsError.value = slotErrorMessage(error, 'Unable to load the exam timetable.')
  } finally {
    slotsLoading.value = false
  }
}

/** Re-sync assessment status + timetable after the server contradicted our view of the page. */
const resyncAfterConflict = async () => {
  await store.fetchAssessment(assessmentId).catch(() => {})
  await store.fetchScheduleSubjects(assessmentId).catch(() => {})
  hydrateSlotForm()
}

const applyServerSlotError = (error) => {
  const status = error?.status
  const message = slotErrorMessage(error, 'Unable to save the subject slot.')
  if (status === 403) {
    slotRevokedReason.value = message
    resyncAfterConflict()
    return
  }
  if (status === 409) {
    slotRevokedReason.value = 'The schedule is locked.'
    resyncAfterConflict()
    return
  }
  if (status === 422) {
    const startsError = firstFieldError(error, ['starts_at'])
    const endsError = firstFieldError(error, ['ends_at'])
    const durationError = firstFieldError(error, ['duration_minutes'])
    if (startsError) slotServerErrors.date = startsError
    if (endsError) slotServerErrors.end = endsError
    if (durationError) slotServerErrors.duration = durationError
    if (startsError || endsError || durationError) return
    // No field errors: route by what the (verbatim) backend message is about.
    if (/\b(window|outside|within|between|earlier|later than the)\b/i.test(message) && !/overlap|capacity|cap\b|limit/i.test(message)) {
      slotServerErrors.date = message
    } else if (/end/i.test(message) && /(after|later|before)/i.test(message) && /start/i.test(message) && !/overlap/i.test(message)) {
      slotServerErrors.end = message
    } else {
      slotServerErrors.form = message
    }
    return
  }
  slotServerErrors.form = message
}

const saveSlot = async () => {
  if (slotBusy.value || !canPlaceSlot.value) return
  slotAttempted.value = true
  clearServerErrors()
  if (hasLiveErrors.value) return
  const startsAt = lagosLocalToIso(startsLocal.value)
  const endsAt = lagosLocalToIso(endsLocal.value)
  if (!startsAt || !endsAt) {
    slotServerErrors.form = 'Enter a valid date and time.'
    return
  }
  savingSlot.value = true
  try {
    // subject_id is deliberately absent: the backend derives it from the submission.
    await store.saveMySubmissionSlot(assessmentId, {
      starts_at: startsAt,
      ends_at: endsAt,
      duration_minutes: Number(slotForm.duration),
    })
    hydrateSlotForm()
  } catch (error) {
    applyServerSlotError(error)
  } finally {
    savingSlot.value = false
  }
}

const removeSlot = async () => {
  if (slotBusy.value || !canPlaceSlot.value) return
  clearServerErrors()
  removingSlot.value = true
  try {
    await store.removeMySubmissionSlot(assessmentId)
    hydrateSlotForm()
  } catch (error) {
    if (error?.status === 404) {
      // Nothing left to delete — treat as already removed and refresh.
      await store.fetchScheduleSubjects(assessmentId).catch(() => {})
      hydrateSlotForm()
    } else {
      confirmingRemove.value = false
      applyServerSlotError(error)
    }
  } finally {
    removingSlot.value = false
  }
}

const classText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  const nestedLevel = a.classLevel?.name || a.class_level?.name || ''
  const levelId = a.class_level_id ?? a.classLevelId
  const armId = a.class_arm_id ?? a.classArmId
  const level = nestedLevel || store.classLevelOptions.find((o) => String(o.value) === String(levelId))?.label || ''
  const arm = armId ? ` ${store.classArmOptions.find((o) => String(o.value) === String(armId))?.label || ''}` : ' (whole level)'
  return `${level}${arm}`.trim() || '—'
})
const termText = computed(() => {
  const a = assessment.value
  if (!a) return '—'
  return a.term?.name || a.term_name || a.term?.title || '—'
})
const submissionSubjectName = computed(() => {
  const s = submission.value
  if (!s) return ''
  if (s.subject?.name) return s.subject.name
  const subjectId = s.subject_id ?? s.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(subjectId))?.label || 'Submission'
})
const slotSubjectName = (slot) => {
  if (slot.subject?.name || slot.subject_name || slot.subjectName) return slot.subject?.name || slot.subject_name || slot.subjectName
  const id = slot.subject_id ?? slot.subjectId
  return store.subjectOptions.find((o) => String(o.value) === String(id))?.label || 'Subject'
}

// total_marks is server-derived from the sum of question marks — prefer the
// server value, fall back to a client sum only if absent.
const marksUsed = computed(() => {
  const serverTotal = submission.value?.total_marks ?? submission.value?.totalMarks
  if (typeof serverTotal === 'number') return serverTotal
  return questions.value.reduce((sum, q) => sum + Number(q.marks || 0), 0)
})
const remainingMarks = computed(() => Math.max(0, assessmentCap.value - marksUsed.value))
const completionPercent = computed(() => {
  if (!assessmentCap.value) return 0
  return Math.min(100, Math.round((marksUsed.value / assessmentCap.value) * 100))
})
const completionText = computed(() => {
  const cap = assessmentCap.value
  if (!cap || cap === 0) return 'No marks cap set'
  if (marksUsed.value >= cap) return 'Marks cap reached'
  return `${remainingMarks.value} marks remaining · ${completionPercent.value}% complete`
})

const questionTypeLabel = (type) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'fill_in_blank': return 'Fill in the Blank'
    default: return type || 'Unknown'
  }
}
const formatDate = (value) => (value ? fmtDateTime(value) : 'N/A')
const formatScheduleDate = (value) => (value ? `${formatSlotDate(value)}, ${formatSlotTime(value)}` : 'N/A')

const touch = (field) => {
  if (field === 'subjectId') errors.subjectId = form.subjectId ? '' : 'Subject is required.'
  if (field === 'title') errors.title = form.title.trim() ? '' : 'Title is required.'
}

const createSubmission = async () => {
  touch('subjectId')
  touch('title')
  if (errors.subjectId || errors.title) return
  creating.value = true
  try {
    await store.createSubmission(assessmentId, {
      subject_id: form.subjectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
    })
    form.subjectId = ''
    form.title = ''
    form.description = ''
  } catch {
    // Store surfaces the error toast (e.g. duplicate teacher/subject/assessment).
  } finally {
    creating.value = false
  }
}

const openQuestionBankModal = () => {
  showQuestionBankModal.value = true
}
const closeQuestionModal = () => {
  showQuestionModal.value = false
  activeQuestion.value = null
  savingQuestion.value = false
}
const addSelectedBankQuestions = async (chosen) => {
  if (!submission.value || !chosen?.length) return

  addingSelectedQuestions.value = true
  try {
    const payloads = chosen.map(({ question, marks }) => {
      const payload = {
        type: question.type,
        content: question.content || '',
        marks,
        explanation: question.explanation || null,
        image_url: question.image_url || null,
      }
      if (question.type !== 'fill_in_blank' && Array.isArray(question.options) && question.options.length) {
        payload.options = question.options.map((option, index) => ({
          content: option.content || '',
          is_correct: !!option.is_correct,
          label: option.label || null,
          image_url: option.image_url || null,
          order: index + 1,
        }))
      }
      return payload
    })

    await store.addQuestions(submission.value.id, payloads)
    showQuestionBankModal.value = false
  } catch (error) {
    // 422 means cap was exceeded — store already showed the error toast.
    // Keep modal open if it's a cap error so they can adjust, close otherwise.
    if (error?.status !== 422) {
      showQuestionBankModal.value = false
    }
  } finally {
    addingSelectedQuestions.value = false
  }
}
const saveQuestion = async (question) => {
  if (!submission.value) return
  const payload = {
    type: question.type,
    content: question.content,
    marks: question.marks,
    explanation: question.explanation,
    image_url: question.image_url,
    ...(question.type !== 'fill_in_blank' ? { options: question.options } : {}),
  }
  savingQuestion.value = true
  try {
    if (question.id) {
      // The backend only documents POST (create) and DELETE for submission
      // questions — there's no PATCH endpoint. "Edit" is implemented as
      // delete-then-recreate so it still only calls documented endpoints.
      await store.deleteQuestion(submission.value.id, question.id)
      await store.addQuestion(submission.value.id, payload)
    } else {
      await store.addQuestion(submission.value.id, payload)
    }
    closeQuestionModal()
  } catch {
    // Store surfaces the error toast; keep the modal open for retry.
    savingQuestion.value = false
  }
}
const editQuestion = (question) => {
  activeQuestion.value = { ...question }
  showQuestionModal.value = true
}
const removeQuestion = async (questionId) => {
  if (!window.confirm('Delete this question?')) return
  await store.deleteQuestion(submission.value.id, questionId).catch(() => {})
}

const submitForReview = async () => {
  if (!submission.value) return
  submitting.value = true
  try {
    await store.submitForReview(submission.value.id)
  } catch {
    // Store surfaces the error toast (e.g. marks exceed assessment cap).
  } finally {
    submitting.value = false
  }
}
</script>
