import { apiFetch, extractErrorMessage } from '../../../../js/lib/api'

export async function getBroadsheet(params) {
  try {
    return await apiFetch('/api/broadsheet', { params })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to fetch broadsheet.'))
  }
}

export async function downloadBroadsheetPdf(params) {
  try {
    return await apiFetch('/api/broadsheet/pdf', {
      params,
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to download broadsheet PDF.'))
  }
}