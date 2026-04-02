import { mockPlans } from './mockData'

const wait = (duration = 500) => new Promise((resolve) => setTimeout(resolve, duration))

let plans = [...mockPlans]

export async function getPlans() {
  await wait()
  return [...plans]
}

export async function createPlan() {
  await wait()
  const plan = {
    id: Date.now(),
    name: 'New Plan',
    price: '$0/mo',
    duration: 'Monthly',
    features: ['Feature placeholder', 'Connect billing rules', 'Adjust limits'],
  }

  plans = [plan, ...plans]
  return plan
}

export async function deletePlan(id) {
  await wait(300)
  plans = plans.filter((plan) => plan.id !== id)
}
