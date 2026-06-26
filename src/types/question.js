/**
 * EduCBT Polymorphic Question Type System
 *
 * Three question types exist keyed on the `type` discriminant field:
 *   - 'mcq'           → Multiple-Choice Question
 *   - 'true_false'    → True / False Question
 *   - 'fill_in_blank' → Fill-in-the-Blank (FITB)
 *
 * Never access options/acceptable_answers/text_answer on a generic question.
 * Always narrow through the type field first.
 *
 * API type strings and their display labels:
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

/**
 * Returns true if the question type uses option-based selection (MCQ or T/F).
 * @param {string} type
 */
export function isChoiceBased(type) {
  return type === QUESTION_TYPES.MCQ || type === QUESTION_TYPES.TRUE_FALSE
}

/**
 * Returns true if the question type uses free-text input (FITB).
 * @param {string} type
 */
export function isFillInBlank(type) {
  return type === QUESTION_TYPES.FILL_IN_BLANK
}

/**
 * Build the correct answer-submit payload for a single question.
 * Per the PDF contract:
 *   - MCQ/TrueFalse → { selected_option_ids, time_spent_seconds }
 *   - FITB          → { text_answer, time_spent_seconds }
 * Never include both keys; the server returns HTTP 422 if you do.
 *
 * @param {string} type
 * @param {string|string[]|null} answer  option id(s) for choice-based, text string for FITB
 * @param {number|null} timeSpentSeconds
 * @returns {object}
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
 * Per the PDF:
 *   - MCQ/TrueFalse: include is_correct on each option
 *   - FITB: NEVER include is_correct; use match_pair for case-sensitivity metadata
 *
 * @param {string} type
 * @param {Array<{content: string, is_correct?: boolean, match_pair?: string}>} rawOptions
 * @returns {Array}
 */
export function buildOptionPayload(type, rawOptions = []) {
  if (isFillInBlank(type)) {
    // Strip is_correct entirely — server returns 422 if present
    return rawOptions.map(({ content, match_pair }) => ({
      content,
      ...(match_pair !== undefined ? { match_pair } : {}),
    }))
  }

  // MCQ / TrueFalse — is_correct is required
  return rawOptions.map(({ content, is_correct, label, order }) => ({
    content,
    is_correct: !!is_correct,
    ...(label !== undefined ? { label } : {}),
    ...(order !== undefined ? { order } : {}),
  }))
}

/**
 * Get the display label for a question type value.
 * @param {string} type
 * @returns {string}
 */
export function getTypeLabel(type) {
  return QUESTION_TYPE_LABELS[type] || type || 'Unknown'
}

/**
 * Default blank acceptable-answer entry for FITB questions.
 */
export function defaultFitbAnswer() {
  return { content: '', case_sensitive: false }
}

/**
 * Default blank MCQ option.
 */
export function defaultMcqOption() {
  return { content: '', label: '', order: 0, is_correct: false }
}

/**
 * Default True/False options (pre-populated, not editable).
 */
export function defaultTrueFalseOptions() {
  return [
    { content: 'True', is_correct: false },
    { content: 'False', is_correct: false },
  ]
}
