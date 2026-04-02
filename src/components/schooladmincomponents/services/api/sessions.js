import { sessions } from './mockData'

const wait = (duration = 450) => new Promise((resolve) => setTimeout(resolve, duration))
let records = [...sessions]

export async function getSessions() {
  await wait()
  return [...records]
}

export async function saveSession(payload) {
  await wait()
  if (payload.id) {
    records = records.map((item) => (item.id === payload.id ? payload : item))
    return payload
  }

  const record = { ...payload, id: Date.now() }
  records = [record, ...records]
  return record
}

export async function activateSession(id) {
  await wait(300)
  records = records.map((item) => ({ ...item, status: item.id === id ? 'Active' : 'Inactive' }))
  return [...records]
}
