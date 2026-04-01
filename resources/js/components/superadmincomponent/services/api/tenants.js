import { mockTenants } from './mockData'

const wait = (duration = 600) => new Promise((resolve) => setTimeout(resolve, duration))

let tenants = [...mockTenants]

export async function getTenants() {
  await wait()
  return [...tenants]
}

export async function createTenant(payload) {
  await wait()

  const record = {
    id: Date.now(),
    name: payload.name,
    domain: payload.domain,
    adminEmail: payload.adminEmail,
    plan: payload.plan,
    status: 'Active',
    createdAt: 'Mar 26, 2026',
  }

  tenants = [record, ...tenants]
  return record
}

export async function toggleTenantStatus(id) {
  await wait(350)
  tenants = tenants.map((tenant) =>
    tenant.id === id
      ? { ...tenant, status: tenant.status === 'Active' ? 'Suspended' : 'Active' }
      : tenant,
  )

  return tenants.find((tenant) => tenant.id === id)
}
