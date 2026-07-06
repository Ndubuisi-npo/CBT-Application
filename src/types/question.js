/**
 * EduCBT Polymorphic Question Type System
 *
 * Three question types exist keyed on the `type` discriminant field:
 *   - 'mcq'           → Multiple-Choice Question (single OR multiple answer)
 *   - 'true_false'    → True / False Question
 *   - 'fill_in_blank' → Fill-in-the-Blank (FITB)
 *
 * Multiple-answer MCQ is distinguished by `allow_multiple_answers: true` on the question.
 * Single-answer MCQ has exactly one is_correct option.
 * Multiple-answer MCQ has two or more is_correct options.
 */

export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  FILL_IN_BLANK: 'fill_in_blank',
}

export const QUESTION_TYPE_LABELS = {
  mcq: 'Multiple Choice',
  true_false: 'True / False',
  fill_in_blank: 'Fill in the Blank',
}

export function detectContentFormat(content = '') {
  const text = String(content ?? '')
  if (!text.trim()) return 'text'
  const hasMathDelimiters = /\$\$[\s\S]+?\$\$|\$[^$]+\$/.test(text)
  return hasMathDelimiters ? 'latex' : 'text'
}

/**
 * Returns true if the question type uses option-based selection (MCQ or T/F).
 */
export function isChoiceBased(type) {
  return type === QUESTION_TYPES.MCQ || type === QUESTION_TYPES.TRUE_FALSE
}

/**
 * Returns true if the question type uses free-text input (FITB).
 */
export function isFillInBlank(type) {
  return type === QUESTION_TYPES.FILL_IN_BLANK
}

/**
 * Returns true if a question allows multiple correct answers to be selected.
 * Detects this by checking `allow_multiple_answers` flag or counting is_correct options.
 *
 * @param {object} question - The question object
 */
export function isMultipleAnswer(question) {
  if (!question) return false
  // Explicit flag from backend or set during creation
  if (question.allow_multiple_answers === true) return true
  // Infer from options: if more than 1 option is marked correct, it's multi-answer
  if (Array.isArray(question.options)) {
    const correctCount = question.options.filter(
      (o) => o && (o.is_correct === true || o.is_correct === 'true'),
    ).length
    if (correctCount > 1) return true
  }
  return false
}

/**
 * Build the correct answer-submit payload for a single question.
 * Per the API contract:
 *   - MCQ/TrueFalse single  → { selected_option_ids: [id], time_spent_seconds }
 *   - MCQ multiple answer   → { selected_option_ids: [id1, id2, ...], time_spent_seconds }
 *   - FITB                  → { text_answer, time_spent_seconds }
 * Never include both keys; the server returns HTTP 422 if you do.
 *
 * @param {string} type
 * @param {string|string[]|null} answer  option id(s) for choice-based, text string for FITB
 * @param {number|null} timeSpentSeconds
 */
export function buildAnswerPayload(type, answer, timeSpentSeconds = null) {
  const base = timeSpentSeconds != null ? { time_spent_seconds: timeSpentSeconds } : {}

  if (isChoiceBased(type)) {
    const ids = Array.isArray(answer) ? answer : answer ? [answer] : []
    return { ...base, selected_option_ids: ids }
  }

  // fill_in_blank
  return { ...base, text_answer: answer ?? '' }
}

/**
 * Build the correct create-question options payload for a given type.
 * Per the API:
 *   - MCQ/TrueFalse: include is_correct on each option
 *   - FITB: NEVER include is_correct; use match_pair for case-sensitivity metadata
 *
 * @param {string} type
 * @param {Array<{content: string, is_correct?: boolean, match_pair?: string}>} rawOptions
 */
export function buildOptionPayload(type, rawOptions = []) {
  const normalizeContentFormat = (content) => detectContentFormat(content)

  if (isFillInBlank(type)) {
    return rawOptions.map(({ content, match_pair }) => ({
      content,
      ...(match_pair !== undefined ? { match_pair } : {}),
      ...(normalizeContentFormat(content) === 'latex' ? { content_format: 'latex' } : {}),
    }))
  }

  // MCQ / TrueFalse — is_correct is required
  return rawOptions.map(({ content, is_correct, label, order }) => ({
    content,
    is_correct: !!is_correct,
    ...(label !== undefined ? { label } : {}),
    ...(order !== undefined ? { order } : {}),
    ...(normalizeContentFormat(content) === 'latex' ? { content_format: 'latex' } : {}),
  }))
}

/**
 * Get the display label for a question type value.
 */
export function getTypeLabel(type) {
  return QUESTION_TYPE_LABELS[type] || type || 'Unknown'
}

/** Default blank acceptable-answer entry for FITB questions. */
export function defaultFitbAnswer() {
  return { content: '', case_sensitive: false }
}

/** Default blank MCQ option. */
export function defaultMcqOption() {
  return { content: '', label: '', order: 0, is_correct: false }
}

/** Default True/False options (pre-populated, not editable). */
export function defaultTrueFalseOptions() {
  return [
    { content: 'True', is_correct: false },
    { content: 'False', is_correct: false },
  ]
}

/**
 * Format seconds into a human-readable duration string.
 * @param {number|null} seconds
 */
export function fmtDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

/**
 * Get CSS classes for score percentage display.
 */
export function scoreColorClass(pct) {
  if (pct == null) return 'text-slate-700'
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

/**
 * Get CSS classes for letter grade display.
 */
export function gradeColorClass(grade) {
  if (!grade || grade === '—') return 'text-slate-700'
  if (grade === 'A') return 'text-emerald-600'
  if (grade === 'B') return 'text-blue-600'
  if (grade === 'C') return 'text-amber-600'
  if (grade === 'D') return 'text-orange-600'
  return 'text-rose-600'
}

/**
 * Get background CSS classes for score percentage display.
 */
export function scoreBgClass(pct) {
  if (pct == null) return 'bg-slate-100'
  if (pct >= 70) return 'bg-emerald-100'
  if (pct >= 50) return 'bg-amber-100'
  return 'bg-rose-100'
}
