import { subjects } from './mockData'

const wait = (duration = 450) => new Promise((resolve) => setTimeout(resolve, duration))
let records = [...subjects]

export async function getSubjects() {
  await wait()
  return [...records]
}

export async function saveSubject(payload) {
  await wait()
  if (payload.id) {
    records = records.map((item) => (item.id === payload.id ? payload : item))
    return payload
  }

  const record = { ...payload, id: Date.now() }
  records = [record, ...records]
  return record
}
