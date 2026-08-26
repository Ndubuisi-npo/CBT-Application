// Maps the REAL backend's assessment/schedule status fields
// (`assessment_status`: draft | active | completed,
//  `question_submission_status`: open | closed)
// onto the presentation model used by the updated UI/UX reference
// (`src/utils/status.ts`, `src/components/assessment/LifecycleTrail.tsx`).
//
// This file owns status → label/tone/step mapping so every migrated page
// (schedule, submissions, submission detail, teacher assessments/workspace)
// presents the exact same badges, banners, and lifecycle trail for a given
// assessment. Real status values are the source of truth; nothing here
// renames or replaces them — it only maps them to display metadata.

export const LIFECYCLE_STEPS = ['Scheduled', 'Questions', 'Review', 'Live', 'Complete']

const normalize = (value) => String(value ?? '').toLowerCase()

/** Badge tone for an assessment's overall status. */
export function assessmentStatusMeta(status) {
  switch (normalize(status)) {
    case 'active':
      return { label: 'Active', variant: 'success' }
    case 'completed':
      return { label: 'Complete', variant: 'info' }
    case 'draft':
    default:
      return { label: 'Draft', variant: 'default' }
  }
}

/** Badge tone for a teacher's paper/submission status. */
export function submissionStatusMeta(status) {
  switch (normalize(status)) {
    case 'submitted':
      return { label: 'Awaiting review', variant: 'info' }
    case 'changes_requested':
      return { label: 'Changes requested', variant: 'warning' }
    case 'approved':
      return { label: 'Approved', variant: 'success' }
    case 'draft':
    default:
      return { label: 'Draft', variant: 'default' }
  }
}

/** Badge tone for whether the question-submission window is open. */
export function questionSubmissionMeta(status) {
  return normalize(status) === 'open'
    ? { label: 'Questions open', variant: 'success' }
    : { label: 'Questions closed', variant: 'default' }
}

/**
 * Which of the 5 lifecycle steps (Scheduled/Questions/Review/Live/Complete)
 * an assessment currently sits at, 0-indexed. Real backend has 3
 * assessment_status values (draft/active/completed) plus an orthogonal
 * question_submission_status (open/closed) — this folds both into the same
 * 5-step trail the reference UI uses.
 */
export function lifecycleStep(assessmentStatus, questionSubmissionStatus) {
  const status = normalize(assessmentStatus)
  if (status === 'completed') return 4
  if (status === 'active') return 3
  if (normalize(questionSubmissionStatus) === 'closed') return 2
  if (status === 'draft') return 1
  return 0
}

/** True once an assessment has been scheduled (has dates) at all. */
export function isScheduled(assessment) {
  return Boolean(assessment?.scheduled_date || assessment?.schedule_id)
}
