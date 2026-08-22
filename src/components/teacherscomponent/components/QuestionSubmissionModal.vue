<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
      <div class="px-5 pb-5 pt-5 sm:p-6">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Submissions</h3>
            <p class="mt-0.5 truncate text-sm text-slate-500">{{ assessment?.title || 'Assessment' }}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            @click="$emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Existing submissions -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div v-else-if="submissions.length" class="space-y-3">
          <div
            v-for="item in submissions"
            :key="item.id"
            class="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900">{{ item.subject?.label || item.subject?.name || 'Subject' }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ item.session?.label || item.session?.name || '—' }} · {{ item.term?.label || item.term?.name || '—' }}
                </p>
              </div>
              <AppBadge :label="getQuestionSubmissionStatusLabel(item.status)" :variant="getQuestionSubmissionStatusVariant(item.status)" />
            </div>
            <p class="mt-3 whitespace-pre-line text-sm text-slate-700">{{ item.question }}</p>
            <p class="mt-2 text-xs text-slate-400">
              Submitted {{ fmtDateTime(item.submitted_at) }}{{ item.teacher?.name ? ` by ${item.teacher.name}` : '' }}
            </p>

            <div v-if="item.reviews?.length" class="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review history</p>
              <div v-for="(review, index) in item.reviews" :key="index" class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p class="font-medium text-slate-700">{{ review.reviewed_by || 'Reviewer' }} · {{ fmtDateTime(review.date) }}</p>
                <p class="mt-1">{{ review.review }}</p>
              </div>
            </div>
          </div>
        </div>
        <AppEmptyState v-else :icon="MessageSquareText" title="No submissions yet" description="Submit a question below to get started." />

        <!-- New submission -->
        <form class="mt-5 space-y-4 border-t border-slate-100 pt-5" @submit.prevent="submit">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">New submission</p>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppSelect
              v-model="form.sessionId"
              label="Session"
              placeholder="Select session"
              required
              :options="sessionOptions"
              :error="errors.sessionId"
              @update:modelValue="onSessionChange"
            />
            <AppSelect
              v-model="form.termId"
              label="Term"
              placeholder="Select term"
              required
              :options="termOptions"
              :disabled="!form.sessionId"
              :error="errors.termId"
            />
          </div>

          <AppSelect
            v-model="form.subjectId"
            label="Subject"
            placeholder="Select subject"
            required
            :options="subjectOptions"
            :error="errors.subjectId"
          />

          <AppTextarea v-model="form.question" label="Question" placeholder="Type the question you're submitting…" :rows="4" />
          <p v-if="errors.question" class="text-xs text-red-600">{{ errors.question }}</p>

          <div class="flex gap-2 pt-1">
            <AppButton type="submit" text="Submit Question" full-width variant="primary" :processing="saving" />
            <AppButton type="button" text="Close" variant="outline" @click="$emit('close')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { MessageSquareText, X } from 'lucide-vue-next'
import AppBadge from '../../shared/AppBadge.vue'
import AppButton from '../../shared/AppButton.vue'
import AppEmptyState from '../../shared/AppEmptyState.vue'
import AppSelect from '../../shared/AppSelect.vue'
import AppTextarea from '../../shared/AppTextarea.vue'
import { fmtDateTime } from '../../../js/lib/helpers'
import { useAssessmentsStore } from '../../schooladmincomponents/stores/assessments'
import {
  useQuestionSubmissionsStore,
  getQuestionSubmissionStatusLabel,
  getQuestionSubmissionStatusVariant,
} from '../stores/questionSubmissions'

const props = defineProps({
  show: { type: Boolean, default: false },
  assessment: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const refStore = useAssessmentsStore()
const store = useQuestionSubmissionsStore()

const loading = computed(() => store.loading)
const saving = computed(() => store.saving)
const submissions = computed(() => store.submissionsFor(props.assessment?.id))

const sessionOptions = computed(() => refStore.sessionOptions)
const termOptions = computed(() => refStore.termOptions)
const subjectOptions = computed(() => refStore.subjectOptions)

const defaultForm = () => ({ sessionId: '', termId: '', subjectId: '', question: '' })
const form = reactive(defaultForm())
const errors = reactive({ sessionId: '', termId: '', subjectId: '', question: '' })
const resetErrors = () => Object.assign(errors, { sessionId: '', termId: '', subjectId: '', question: '' })

const onSessionChange = async (sessionId) => {
  form.termId = ''
  if (sessionId) await refStore.fetchTerms(sessionId)
}

watch(
  () => [props.show, props.assessment?.id],
  async ([show, assessmentId]) => {
    if (!show || !assessmentId) return
    Object.assign(form, defaultForm())
    resetErrors()
    await store.fetchSubmissions(assessmentId)
  },
  { immediate: true }
)

const validate = () => {
  resetErrors()
  if (!form.sessionId) errors.sessionId = 'Session is required.'
  if (!form.termId) errors.termId = 'Term is required.'
  if (!form.subjectId) errors.subjectId = 'Subject is required.'
  if (!form.question.trim()) errors.question = 'Question is required.'
  return !Object.values(errors).some(Boolean)
}

const submit = async () => {
  if (!validate() || !props.assessment?.id) return
  try {
    await store.createSubmission(props.assessment.id, {
      session_id: form.sessionId,
      term_id: form.termId,
      subject_id: form.subjectId,
      question: form.question.trim(),
    })
    Object.assign(form, defaultForm())
  } catch {
    // Store already surfaced the error toast; keep the modal open to retry.
  }
}
</script>
