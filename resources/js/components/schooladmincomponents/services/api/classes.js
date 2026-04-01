import { classes } from './mockData'

const wait = (duration = 450) => new Promise((resolve) => setTimeout(resolve, duration))
let records = [...classes]

export async function getClasses() {
  await wait()
  return [...records]
}

export async function saveClassArm(payload) {
  await wait()
  if (payload.id) {
    records = records.map((item) => (item.id === payload.id ? payload : item))
    return payload
  }

  const record = { ...payload, id: Date.now() }
  records = [record, ...records]
  return record
}
