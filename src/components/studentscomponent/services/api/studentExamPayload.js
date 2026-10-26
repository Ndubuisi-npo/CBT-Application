const EXAM_LIST_KEYS = ['exams', 'items', 'results', 'data']

export const extractStudentExamList = (response) => {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []

  for (const key of EXAM_LIST_KEYS) {
    const value = response[key]
    if (Array.isArray(value)) return value
  }

  for (const key of EXAM_LIST_KEYS) {
    const value = response[key]
    if (value && typeof value === 'object') {
      const nested = extractStudentExamList(value)
      if (nested.length) return nested
    }
  }

  return []
}
