/**
 * Marks Distributor
 *
 * Client-side port of the server marks-distribution algorithm.
 * Reference: FE-MD-100 Rev A, section 03-00-00 "MARKS DISTRIBUTION ALGORITHM (PORT)".
 *
 * CAUTION: Copy this code exactly. Do not change the code. Do not add
 * features to the code. A change to this code will break the match with
 * the server preview.
 */
export function distribute(totalMarks, count) {
  if (totalMarks < 0) throw new Error('Total marks cannot be negative.')
  if (count <= 0) throw new Error('Count must be greater than 0.')
  const totalHundredths = Math.round(totalMarks * 100)
  const base = Math.floor(totalHundredths / count)
  const remainder = totalHundredths % count
  const hundredths = new Array(count).fill(base)
  for (let i = 0; i < remainder; i++) hundredths[i]++
  return hundredths.map(h => Math.round(h) / 100)
}
