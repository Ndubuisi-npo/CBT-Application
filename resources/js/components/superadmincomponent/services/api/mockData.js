export const mockTenants = [
  { id: 1, name: 'Greenfield International School', domain: 'greenfield.educbt.app', status: 'Active', plan: 'Growth', createdAt: 'Mar 02, 2026', adminEmail: 'principal@greenfield.edu' },
  { id: 2, name: 'Hillcrest College', domain: 'hillcrest.educbt.app', status: 'Active', plan: 'Starter', createdAt: 'Feb 27, 2026', adminEmail: 'admin@hillcrest.edu' },
  { id: 3, name: 'Riverdale Academy', domain: 'riverdale.educbt.app', status: 'Suspended', plan: 'Growth', createdAt: 'Feb 18, 2026', adminEmail: 'office@riverdale.edu' },
  { id: 4, name: 'Maple Grove School', domain: 'maplegrove.educbt.app', status: 'Active', plan: 'Premium', createdAt: 'Feb 05, 2026', adminEmail: 'registrar@maplegrove.edu' },
  { id: 5, name: 'Sunrise Preparatory', domain: 'sunrise.educbt.app', status: 'Active', plan: 'Starter', createdAt: 'Jan 24, 2026', adminEmail: 'it@sunrise.edu' },
  { id: 6, name: 'Blue Ridge High', domain: 'blueridge.educbt.app', status: 'Suspended', plan: 'Premium', createdAt: 'Jan 11, 2026', adminEmail: 'ops@blueridge.edu' },
]

export const mockPlans = [
  { id: 1, 
    name: 'Starter', 
    price: '$239/mo',
    duration: 'Monthly', 
    features: 
      [
        'Basic student management',
        'Attendance tracking',
        'Parent portal access',
        'Standard reporting',
        'Email support',
      ] 
  },
  { id: 2,
    name: 'Growth',
    price: '$479/mo', 
    duration: 'Monthly', 
    features: 
      [
        'Everything in Starter',
        'Advanced curriculum planning',
        'Teacher evaluation tools',
        'Custom report cards',
        'Priority support',
      ] 
  },
  { id: 3, 
    name: 'Premium', 
    price: '$799/mo', 
    duration: 'Monthly', 
    features: 
      [
        'Everything in Growth',
        'Multi-campus support',
        'API access & integrations',
        'Dedicated account manager',
        'Custom onboarding',
      ] 
  },
]
