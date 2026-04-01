import { schoolProfile } from './mockData'

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration))
let profile = { ...schoolProfile }

export async function getProfile() {
  await wait()
  return { ...profile }
}

export async function saveProfile(payload) {
  await wait()
  profile = { ...profile, ...payload }
  return { ...profile }
}
