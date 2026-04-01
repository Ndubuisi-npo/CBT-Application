import { schoolProfile } from './mockData'

const wait = (duration = 500) => new Promise((resolve) => setTimeout(resolve, duration))

export async function loginSchoolAdmin(payload) {
  await wait()

  if (!payload.email || !payload.password) {
    throw new Error('Email and password are required.')
  }

  return {
    user: {
      name: 'Admin Imma',
      role: 'School Administrator',
      email: payload.email,
    },
    tenant: schoolProfile,
    token: 'mock-school-admin-token',
  }
}
