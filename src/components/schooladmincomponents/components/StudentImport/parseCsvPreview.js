export function parseCsvPreview(file, { onBatch, batchSize = 500, columns = [] } = {}) {
  const worker = new Worker(new URL('./csvPreview.worker.js', import.meta.url), { type: 'module' })
  let resolve
  let reject
  let settled = false

  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  const settleError = (error) => {
    if (settled) return
    settled = true
    cleanup()
    reject(error)
  }

  const cleanup = () => {
    worker.terminate()
    worker.onmessage = null
    worker.onerror = null
  }

  worker.onmessage = ({ data }) => {
    if (data.type === 'batch') {
      try {
        onBatch?.(data.rows)
        worker.postMessage({ type: 'ack' })
      } catch (error) {
        settleError(error)
      }
    } else if (data.type === 'done') {
      settled = true
      cleanup()
      resolve(data.totalRows)
    } else if (data.type === 'error') {
      settleError(new Error(data.message))
    }
  }

  worker.onerror = (event) => {
    settleError(new Error(event.message || 'Unable to parse the uploaded CSV file.'))
  }

  try {
    worker.postMessage({ type: 'parse', file, batchSize, columns })
  } catch (error) {
    settleError(error)
  }

  return {
    promise,
    cancel() {
      if (settled) return
      settled = true
      cleanup()
      reject(new DOMException('CSV preview parsing was cancelled.', 'AbortError'))
    },
  }
}
