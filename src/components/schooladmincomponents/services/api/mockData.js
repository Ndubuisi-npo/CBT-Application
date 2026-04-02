export const schoolProfile = {
  schoolName: 'Greenfield International School',
  domain: 'greenfield.educbt.app',
  logo: '',
  address: '12 Admiralty Way, Lekki, Lagos',
  email: 'hello@greenfield.edu',
  phone: '+234 800 000 0000',
}

export const sessions = [
  { id: 1, name: '2025/2026', status: 'Active', startDate: '2025-09-09', endDate: '2026-07-24' },
  { id: 2, name: '2024/2025', status: 'Inactive', startDate: '2024-09-09', endDate: '2025-07-25' },
]

export const terms = [
  { id: 1, name: '1st Term', session: '2025/2026', status: 'Active', startDate: '2025-09-09', endDate: '2025-12-12' },
  { id: 2, name: '2nd Term', session: '2025/2026', status: 'Inactive', startDate: '2026-01-12', endDate: '2026-03-27' },
]

export const classes = [
  { id: 1, name: 'JSS1A', level: 'JSS1', teacher: 'Mrs. Ada Nwosu' },
  { id: 2, name: 'SS2B', level: 'SS2', teacher: 'Mr. David Musa' },
]

export const subjects = [
  { id: 1, name: 'Mathematics', classes: ['JSS1A', 'SS2B'], teachers: ['Mrs. Ada Nwosu', 'Mr. David Musa'] },
  { id: 2, name: 'English Language', classes: ['JSS1A'], teachers: ['Mrs. Ada Nwosu'] },
]

export const teachers = [
  { id: 1, name: 'Mrs. Ada Nwosu', email: 'ada.nwosu@greenfield.edu', phone: '+234 801 111 2233', department: 'Sciences', assignedClasses: ['JSS1A'], assignedSubjects: ['English Language'] },
  { id: 2, name: 'Mr. David Musa', email: 'david.musa@greenfield.edu', phone: '+234 802 444 5566', department: 'Mathematics', assignedClasses: ['SS2B'], assignedSubjects: ['Mathematics'] },
  { id: 3, name: 'Mrs. Ifeoma Obi', email: 'ifeoma.obi@greenfield.edu', phone: '+234 803 777 8899', department: 'Humanities', assignedClasses: [], assignedSubjects: [] },
]

export const settings = {
  gradingScale: [
    { grade: 'A', min: 70, max: 100 },
    { grade: 'B', min: 60, max: 69 },
    { grade: 'C', min: 50, max: 59 },
    { grade: 'D', min: 45, max: 49 },
    { grade: 'F', min: 0, max: 44 },
  ],
  caWeight: 40,
  examWeight: 60,
}
