export async function parseCsvPreview(file, limit = Infinity) {
  const text = (await file.text()).replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        inQuotes = false
      } else {
        cell += character
      }
    } else if (character === '"' && cell.length === 0) {
      inQuotes = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
      if (character === '\r' && text[index + 1] === '\n') index += 1
    } else {
      cell += character
    }
  }

  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)

  const [headerRow, ...dataRows] = rows
  if (!headerRow?.length) return []

  const headers = headerRow.map((header) => header.trim().toLowerCase().replace(/[\s-]+/g, '_'))
  return dataRows.slice(0, limit).map((values, index) => {
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] ?? '']))
    if (!Object.prototype.hasOwnProperty.call(record, 'row')) record.row = index + 2
    return record
  })
}
