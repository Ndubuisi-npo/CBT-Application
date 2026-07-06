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
