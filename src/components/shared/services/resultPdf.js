import { apiFetch } from '../../../js/lib/api'

export async function downloadAttemptResultPdf(attemptId) {
  if (!attemptId) throw new Error('This result does not have a valid attempt.')

  return await apiFetch(`/api/exams/results/${attemptId}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })
}

export function saveBlobAsPdf(blob, filename = 'student-result.pdf') {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}