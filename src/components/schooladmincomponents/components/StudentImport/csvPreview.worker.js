function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

let resolveBatch

self.onmessage = ({ data }) => {
  if (data.type === 'ack') {
    resolveBatch?.()
    resolveBatch = null
    return
  }

  if (data.type === 'parse') void parseCsv(data.file, data.batchSize, data.columns)
}

async function parseCsv(file, batchSize = 500, columns = []) {
  try {
    const reader = file.stream().getReader()
    const decoder = new TextDecoder()
    const selectedColumns = new Set(columns)
    let buffer = ''
    let headers = null
    let values = []
    let cell = ''
    let inQuotes = false
    let totalRows = 0
    let batch = []

    const flushBatch = async () => {
      if (!batch.length) return
      self.postMessage({ type: 'batch', rows: batch })
      batch = []
      await new Promise((resolve) => {
        resolveBatch = resolve
      })
    }

    const finishRow = () => {
      values.push(cell)
      cell = ''
      if (!values.some((value) => value.trim())) {
        values = []
        return
      }

      if (headers === null) {
        if (values[0]?.charCodeAt(0) === 0xfeff) {
          values[0] = values[0].slice(1)
        }
        headers = values.map(normalizeHeader)
      } else {
        const record = Object.fromEntries(
          headers
            .map((header, index) => [header, values[index] ?? ''])
            .filter(([header]) => selectedColumns.has(header)),
        )
        if (!Object.prototype.hasOwnProperty.call(record, 'row')) record.row = totalRows + 2
        batch.push(record)
        totalRows += 1
        const shouldFlushBatch = batch.length >= batchSize
        values = []
        if (shouldFlushBatch) return flushBatch()
      }
      values = []
    }

    const parseBuffer = async (isFinal = false) => {
      let index = 0
      while (index < buffer.length) {
        const character = buffer[index]

        if (inQuotes) {
          if (character === '"') {
            if (index + 1 >= buffer.length && !isFinal) break
            if (buffer[index + 1] === '"') {
              cell += '"'
              index += 2
              continue
            }
            inQuotes = false
          } else {
            cell += character
          }
          index += 1
          continue
        }

        if (character === '"' && cell.length === 0) {
          inQuotes = true
        } else if (character === ',') {
          values.push(cell)
          cell = ''
        } else if (character === '\n' || character === '\r') {
          const batchFlush = finishRow()
          if (batchFlush) await batchFlush
        } else {
          cell += character
        }
        index += 1
      }

      buffer = buffer.slice(index)
    }

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      await parseBuffer()
    }

    buffer += decoder.decode()
    await parseBuffer(true)
    if (cell.length > 0 || values.length > 0) await finishRow()
    await flushBatch()
    self.postMessage({ type: 'done', totalRows })
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error?.message || 'Unable to parse the uploaded CSV file.',
    })
  }
}
