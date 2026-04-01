import { settings } from './mockData'

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration))
let record = { ...settings }

export async function getSettings() {
  await wait()
  return JSON.parse(JSON.stringify(record))
}

export async function saveSettings(payload) {
  await wait()
  record = JSON.parse(JSON.stringify(payload))
  return record
}
