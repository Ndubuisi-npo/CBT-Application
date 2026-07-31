const MARKS_PRECISION = 100
const TOLERANCE = 0.01

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const roundToTwo = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100

export function normalizeDraftQuestion(question, order = 1) {
  const baseMarks = toNumber(question?.default_marks ?? question?.marks ?? 0)
  const currentMarks = toNumber(question?.marks ?? question?.default_marks ?? 0)

  return {
    question_id: question?.question_id ?? question?.id,
    default_marks: roundToTwo(baseMarks),
    marks: roundToTwo(currentMarks),
    is_marks_locked: Boolean(question?.is_marks_locked),
    order: toNumber(question?.order, order),
  }
}

export function distributeMarks(totalMarks, draftQuestions = []) {
  const total = toNumber(totalMarks)
  const questions = draftQuestions.map((question, index) => normalizeDraftQuestion(question, index + 1))
  const lockedQuestions = questions.filter((question) => question.is_marks_locked)
  const unlockedQuestions = questions.filter((question) => !question.is_marks_locked)
  const lockedSum = roundToTwo(lockedQuestions.reduce((sum, question) => sum + toNumber(question.marks), 0))
  const remaining = roundToTwo(total - lockedSum)

  if (remaining < -TOLERANCE) {
    return {
      questions,
      lockedSum,
      remaining,
      total: roundToTwo(total),
      isValid: false,
      error: 'Locked marks exceed the exam total.',
    }
  }

  if (!unlockedQuestions.length) {
    const totalUsed = roundToTwo(lockedSum)
    return {
      questions,
      lockedSum,
      remaining,
      total: roundToTwo(total),
      isValid: Math.abs(totalUsed - total) <= TOLERANCE,
      error: Math.abs(totalUsed - total) <= TOLERANCE ? null : 'Locked marks must equal the exam total.',
    }
  }

  const remainingHundredths = Math.round(remaining * MARKS_PRECISION)
  const baseShare = Math.floor(remainingHundredths / unlockedQuestions.length)
  const remainder = remainingHundredths % unlockedQuestions.length

  const unlockedAllocations = unlockedQuestions.map((_, index) => {
    const hundredths = baseShare + (index < remainder ? 1 : 0)
    return roundToTwo(hundredths / MARKS_PRECISION)
  })

  const resolvedQuestions = questions.map((question) => {
    if (question.is_marks_locked) {
      return { ...question, marks: roundToTwo(question.marks) }
    }

    const nextMarks = unlockedAllocations.shift() ?? 0
    return { ...question, marks: nextMarks }
  })

  const recalculatedTotal = roundToTwo(resolvedQuestions.reduce((sum, question) => sum + toNumber(question.marks), 0))

  return {
    questions: resolvedQuestions,
    lockedSum,
    remaining,
    total: roundToTwo(total),
    isValid: Math.abs(recalculatedTotal - total) <= TOLERANCE,
    error: Math.abs(recalculatedTotal - total) <= TOLERANCE ? null : 'Allocated marks do not match the exam total.',
  }
}

export function validateMarksDraft(totalMarks, draftQuestions = []) {
  const result = distributeMarks(totalMarks, draftQuestions)
  const normalizedQuestions = result.questions
  const sum = roundToTwo(normalizedQuestions.reduce((acc, question) => acc + toNumber(question.marks), 0))
  const total = roundToTwo(totalMarks)

  return {
    ...result,
    sum,
    total,
    difference: roundToTwo(total - sum),
    isValid: Math.abs(sum - total) <= TOLERANCE && result.isValid,
  }
}

export const marksDistributionConfig = {
  MARKS_PRECISION,
  TOLERANCE,
}
