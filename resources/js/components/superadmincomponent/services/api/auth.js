const wait = (duration = 600) => new Promise((resolve) => setTimeout(resolve, duration))

export async function loginSuperAdmin(payload) {
  await wait()

  if (!payload.email || !payload.password) {
    throw new Error('Email and password are required.')
  }

  return {
    user: {
      name: 'Olivia Admin',
      email: payload.email,
    },
    token: 'mock-super-admin-session',
  }
}
