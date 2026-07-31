/**
 * useExamMarksDistribution
 *
 * Draft-state marks distribution for the exam builder question editor.
 * Implements manual FE-MD-100 Rev A:
 *   - 02-00-00 Draft state (question_id, default_marks, marks, is_marks_locked, order)
 *   - 02-02-00 Local-only actions (no network calls here — see 07-00-00 for submit)
 *   - 03-04-00 Integration procedure ("useExamMarksDistribution")
 *   - 04-00-00 Recompute procedure (trigger events + rules by event)
 *   - 05-00-00 Locked question input validation
 *   - 06-00-00 Fault isolation edge cases
 *   - 07-01-00 Pre-submit check
 *
 * All state mutation here is local/in-memory (draft). Nothing in this file
 * performs a network request.
 */
import { computed, ref } from 'vue'
import { distribute } from '../../../lib/marksDistributor'

const TOLERANCE = 0.01

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function roundToTwo(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
}

/**
 * Pure function version of the 03-04-00 integration procedure.
 * Given a total marks value and a draft questions list, returns a new
 * questions list with recalculated marks for unlocked questions, plus the
 * supporting figures needed to drive the UI (06-00-00 fault isolation).
 */
export function recomputeDraft(totalMarks, draftQuestions = []) {
  const total = toNumber(totalMarks)
  // Keep original draft order (order field controls display order only —
  // it does not control which question receives the extra hundredth;
  // that is decided purely by pool position in step 6 of 03-02-00).
  const ordered = [...draftQuestions].sort((a, b) => toNumber(a.order) - toNumber(b.order))

  const lockedQuestions = ordered.filter((q) => q.is_marks_locked)
  const unlockedQuestions = ordered.filter((q) => !q.is_marks_locked)

  // Step 1: locked sum
  const lockedSum = roundToTwo(lockedQuestions.reduce((sum, q) => sum + toNumber(q.marks), 0))
  // Step 2: remaining value
  const remaining = roundToTwo(total - lockedSum)
  // Step 3: unlocked count
  const unlockedCount = unlockedQuestions.length

  // Step 4: zero pool rule (05-04-00) — skip recompute, no distribute call
  if (unlockedCount === 0) {
    return {
      questions: ordered,
      lockedSum,
      remaining,
      unlockedCount,
      error: null,
      lockedExceedsTotal: remaining < -TOLERANCE,
    }
  }

  // Step 5: locked exceeds total — do not distribute, do not allow save
  if (remaining < -TOLERANCE) {
    return {
      questions: ordered,
      lockedSum,
      remaining,
      unlockedCount,
      error: 'Locked marks exceed total. Reduce a locked question.',
      lockedExceedsTotal: true,
    }
  }

  // Step 6/7/8: distribute the (non-negative) remaining value across the pool
  const shares = distribute(Math.max(remaining, 0), unlockedCount)
  let cursor = 0
  const questions = ordered.map((q) => {
    if (q.is_marks_locked) return { ...q, marks: roundToTwo(q.marks) }
    const marks = shares[cursor]
    cursor += 1
    return { ...q, marks }
  })

  return {
    questions,
    lockedSum,
    remaining,
    unlockedCount,
    error: null,
    lockedExceedsTotal: false,
  }
}

/** 05-02-00: max value a locked question's input may hold. */
export function maxAllowedForLockedQuestion(totalMarks, draftQuestions, questionId) {
  const total = toNumber(totalMarks)
  const otherLockedSum = draftQuestions
    .filter((q) => q.is_marks_locked && String(q.question_id) !== String(questionId))
    .reduce((sum, q) => sum + toNumber(q.marks), 0)
  return roundToTwo(total - otherLockedSum)
}

/** 07-01-00: pre-submit check. */
export function checkSubmitReady(totalMarks, draftQuestions, { lockedExceedsTotal = false } = {}) {
  const total = toNumber(totalMarks)
  const sum = roundToTwo(draftQuestions.reduce((s, q) => s + toNumber(q.marks), 0))
  const difference = roundToTwo(total - sum)
  const withinTolerance = Math.abs(difference) <= TOLERANCE
  return { sum, difference, canSubmit: withinTolerance && !lockedExceedsTotal }
}

export function normalizeDraftQuestion(question, order = 1) {
  const baseMarks = toNumber(question?.default_marks ?? question?.marks ?? 1)
  const currentMarks = toNumber(question?.marks ?? question?.default_marks ?? 1)
  return {
    question_id: question?.question_id ?? question?.id,
    default_marks: roundToTwo(baseMarks),
    marks: roundToTwo(currentMarks),
    is_marks_locked: Boolean(question?.is_marks_locked),
    order: toNumber(question?.order, order),
  }
}

/**
 * Reactive composable wrapping recomputeDraft() for use inside the exam
 * builder question editor. `totalMarksRef` should be a ref/computed holding
 * the exam's total marks value.
 */
export function useExamMarksDistribution(totalMarksRef) {
  const draftQuestions = ref([])

  const state = computed(() => recomputeDraft(totalMarksRef.value, draftQuestions.value))

  const questions = computed(() => state.value.questions)
  const lockedSum = computed(() => state.value.lockedSum)
  const remaining = computed(() => state.value.remaining)
  const unlockedCount = computed(() => state.value.unlockedCount)
  const lockedExceedsTotal = computed(() => state.value.lockedExceedsTotal)
  const allLocked = computed(() => draftQuestions.value.length > 0 && unlockedCount.value === 0)
  // 06-00-00: locked sum equals total, pool non-empty -> nothing left to distribute
  const zeroPoolNoMarksLeft = computed(() => unlockedCount.value > 0 && remaining.value <= TOLERANCE && remaining.value >= -TOLERANCE)

  const submitCheck = computed(() => checkSubmitReady(totalMarksRef.value, questions.value, {
    lockedExceedsTotal: lockedExceedsTotal.value,
  }))

  const canSubmit = computed(() => {
    if (!draftQuestions.value.length) return false
    if (lockedExceedsTotal.value) return false
    return submitCheck.value.canSubmit
  })

  function applyRecompute() {
    draftQuestions.value = recomputeDraft(totalMarksRef.value, draftQuestions.value).questions
  }

  /** Replace the whole draft (e.g. hydrating from an existing exam). */
  function setQuestions(list) {
    draftQuestions.value = list.map((q, idx) => normalizeDraftQuestion(q, idx + 1))
    applyRecompute()
  }

  /** Trigger event 1: add a question. */
  function addQuestion(question) {
    if (draftQuestions.value.some((q) => String(q.question_id) === String(question.question_id ?? question.id))) return
    const order = draftQuestions.value.length + 1
    draftQuestions.value = [
      ...draftQuestions.value,
      normalizeDraftQuestion({ ...question, is_marks_locked: false }, order),
    ]
    applyRecompute()
  }

  /** Trigger event 2: remove a question. */
  function removeQuestion(questionId) {
    draftQuestions.value = draftQuestions.value
      .filter((q) => String(q.question_id) !== String(questionId))
      .map((q, idx) => ({ ...q, order: idx + 1 }))
    applyRecompute()
  }

  /** Trigger event 3: lock a question — keep its current value, remove from pool. */
  function lockQuestion(questionId) {
    draftQuestions.value = draftQuestions.value.map((q) =>
      String(q.question_id) === String(questionId) ? { ...q, is_marks_locked: true } : q,
    )
    applyRecompute()
  }

  /** Trigger event 4: unlock a question — add back to pool, recompute now (no stale value). */
  function unlockQuestion(questionId) {
    draftQuestions.value = draftQuestions.value.map((q) =>
      String(q.question_id) === String(questionId) ? { ...q, is_marks_locked: false } : q,
    )
    applyRecompute()
  }

  /**
   * Trigger event 5: edit the marks value of a locked question.
   * Returns { accepted, max } per 05-02-00 / 05-03-00.
   */
  function editLockedMarks(questionId, newValue) {
    const max = maxAllowedForLockedQuestion(totalMarksRef.value, draftQuestions.value, questionId)
    const value = toNumber(newValue)
    if (value < 0 || value > max + TOLERANCE) {
      return { accepted: false, max }
    }
    draftQuestions.value = draftQuestions.value.map((q) =>
      String(q.question_id) === String(questionId)
        ? { ...q, marks: roundToTwo(value), is_marks_locked: true }
        : q,
    )
    applyRecompute()
    return { accepted: true, max }
  }

  /** Reorder only — does not affect the distribution total. */
  function reorder(orderedQuestionIds) {
    const byId = new Map(draftQuestions.value.map((q) => [String(q.question_id), q]))
    draftQuestions.value = orderedQuestionIds
      .map((id, idx) => {
        const q = byId.get(String(id))
        return q ? { ...q, order: idx + 1 } : null
      })
      .filter(Boolean)
  }

  return {
    draftQuestions: questions,
    lockedSum,
    remaining,
    unlockedCount,
    lockedExceedsTotal,
    allLocked,
    zeroPoolNoMarksLeft,
    submitCheck,
    canSubmit,
    setQuestions,
    addQuestion,
    removeQuestion,
    lockQuestion,
    unlockQuestion,
    editLockedMarks,
    reorder,
  }
}
