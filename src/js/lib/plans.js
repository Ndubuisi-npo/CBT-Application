const featureLabelMap = {
  cbt_exams: 'Auto-gradable CBT exams',
  api_access: 'API access & integrations',
  custom_branding: 'Custom branding',
  priority_support: 'Priority support',
  result_analytics: 'Result analytics',
  multi_campus: 'Multi-campus support',
}

const normalizeFeatureValue = (feature) => {
  if (typeof feature === 'string') {
    return feature.trim()
  }

  if (feature && typeof feature === 'object') {
    const candidate = feature.name || feature.title || feature.label || feature.value || feature.feature || feature.slug
    if (typeof candidate === 'string') {
      return candidate.trim()
    }
  }

  return ''
}

export function normalizePlanFeatures(features) {
  if (Array.isArray(features)) {
    return features
      .map(normalizeFeatureValue)
      .filter(Boolean)
  }

  if (features && typeof features === 'object') {
    return Object.entries(features)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => featureLabelMap[key] || key)
      .filter(Boolean)
  }

  if (typeof features === 'string') {
    return [features.trim()].filter(Boolean)
  }

  return []
}

export function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    return plan
  }

  return {
    ...plan,
    features: normalizePlanFeatures(plan.features),
  }
}

// --- Landing page -> Onboarding plan selection persistence ---
// When a user picks a plan on the landing page (before onboarding has even
// mounted), we stash a lightweight reference to it here so the "Choose Plan"
// onboarding step can preselect it once the full plan list has loaded.
const SELECTED_PLAN_STORAGE_KEY = 'educbt_selected_plan'

export function storeSelectedPlan(plan, billingCycle) {
  if (typeof window === 'undefined' || !plan) return
  try {
    const payload = {
      id: plan.id ?? null,
      slug: plan.slug ?? null,
      // 'monthly' | 'yearly' - the billing cycle the user had toggled to
      // when they picked this plan, so e.g. "Yearly Premium" is preserved
      // as distinct from "Monthly Premium" even though both share the same
      // underlying plan record.
      billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
    }
    window.sessionStorage.setItem(SELECTED_PLAN_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    // sessionStorage may be unavailable (e.g. private browsing); fail silently
    console.error('Unable to store selected plan:', err)
  }
}

export function getStoredSelectedPlan() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SELECTED_PLAN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || (!parsed.id && !parsed.slug)) return null
    return parsed
  } catch (err) {
    return null
  }
}

export function clearStoredSelectedPlan() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SELECTED_PLAN_STORAGE_KEY)
  } catch (err) {
    // no-op
  }
}

// Finds a plan within a list matching the previously stored selection
// (by id first, falling back to slug), and by the "?plan=" query param
// used when linking directly from the landing page pricing section.
export function findMatchingPlan(plans, { id, slug } = {}) {
  if (!Array.isArray(plans) || !plans.length) return null
  if (id != null) {
    const byId = plans.find((p) => String(p.id) === String(id))
    if (byId) return byId
  }
  if (slug) {
    const bySlug = plans.find((p) => p.slug && String(p.slug) === String(slug))
    if (bySlug) return bySlug
  }
  return null
}
