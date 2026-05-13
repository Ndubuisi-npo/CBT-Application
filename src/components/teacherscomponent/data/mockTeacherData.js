const isoNow = '2026-05-12T08:30:00+01:00'

export const teacherProfile = {
  id: 'TCH-042',
  name: 'Mrs. Kemi Adeyemi',
  role: 'Senior Mathematics Teacher',
  avatar: 'KA',
  staffId: 'LGS/EDU/TCH/042',
  email: 'kemi.adeyemi@educbt.ng',
  phone: '+234 803 555 0198',
  school: 'EduCBT Demonstration College',
  campus: 'Ikeja Senior Campus',
  location: 'Ikeja, Lagos',
  bio: 'Coordinates senior secondary mathematics assessments and supports WAEC preparation across SS2 to SS2 .',
  completionRate: 96,
  lastLogin: '2026-05-12T07:42:00+01:00',
  classTeacher: 'SS2 Gold',
  assignedClasses: ['SS2 Gold'],
  assignedSubjects: ['Mathematics', 'Further Mathematics'],
}

export const teacherStats = [
  { label: 'Total Students', value: 186, change: '+12 this term', tone: 'blue' },
  { label: 'Active Exams', value: 3, change: '1 live now', tone: 'emerald' },
  { label: 'Question Bank Count', value: 248, change: '18 new this month', tone: 'amber' },
  { label: 'Pending Auto-Graded Scripts', value: 27, change: 'Awaiting review', tone: 'rose' },
  { label: 'Attendance Completion', value: '92%', change: '8 classes pending', tone: 'indigo' },
]

export const assignedSubjects = [
  { name: 'Mathematics', classes: ['SS2 Gold'], weeklyPeriods: 18, questionCount: 142, upcomingExam: 'SS2 Mid-Term CBT' },
  { name: 'Further Mathematics', classes: ['SS2 Gold'], weeklyPeriods: 8, questionCount: 58, upcomingExam: 'Further Maths Drill Test' },
]

export const classOverview = [
  {
    id: 'CLS-SS2-GOLD',
    name: 'SS2 Gold',
    level: 'Senior Secondary 1',
    arm: 'Gold',
    homeroom: 'Block C, Room 4',
    studentCount: 42,
    attendanceToday: 39,
    classTeacher: 'Mr. Ayo Falade',
    prefect: 'Temiloluwa Bakare',
    averageScore: 68,
    subjects: ['Mathematics', 'English Language', 'Biology', 'Economics'],
  },
  {
    id: 'CLS-SS2-GOLD',
    name: 'SS2 Gold',
    level: 'Senior Secondary 2',
    arm: 'Gold',
    homeroom: 'Block B, Room 2',
    studentCount: 47,
    attendanceToday: 45,
    classTeacher: 'Mrs. Bisi Ogunleye',
    prefect: 'Maryann Eze',
    averageScore: 72,
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Economics'],
  },
  {
    id: 'CLS-SS2-GOL',
    name: 'SS2 Gold',
    level: 'Senior Secondary 3',
    arm: 'Gold',
    homeroom: 'Block A, Room 1',
    studentCount: 51,
    attendanceToday: 49,
    classTeacher: 'Mr. David Olatunji',
    prefect: 'Ifeanyi Nwosu',
    averageScore: 76,
    subjects: ['Mathematics', 'Further Mathematics', 'Physics', 'Chemistry'],
  },
  {
    id: 'CLS-SS2-GOL',
    name: 'SS2 Gold',
    level: 'Senior Secondary 2',
    arm: 'Gold',
    homeroom: 'Block B, Room 5',
    studentCount: 46,
    attendanceToday: 43,
    classTeacher: 'Mrs. Damilola Yusuf',
    prefect: 'Rita Okoye',
    averageScore: 70,
    subjects: ['Further Mathematics', 'Physics', 'Chemistry', 'Biology'],
  },
]

export const upcomingExams = [
  {
    id: 'EX-101',
    title: 'SS2 Mid-Term Mathematics CBT',
    subject: 'Mathematics',
    className: 'SS2 Gold',
    type: 'Multiple Choice',
    status: 'Scheduled',
    date: '2026-05-15T09:00:00+01:00',
    duration: 60,
    questions: 40,
    candidates: 47,
  },
  {
    id: 'EX-102',
    title: 'Further Mathematics Drill Test',
    subject: 'Further Mathematics',
    className: 'SS2  Gold',
    type: 'Multiple Choice',
    status: 'Draft',
    date: '2026-05-18T11:30:00+01:00',
    duration: 45,
    questions: 25,
    candidates: 51,
  },
  {
    id: 'EX-103',
    title: 'SS2 Algebra Mastery Quiz',
    subject: 'Mathematics',
    className: 'SS2 Gold',
    type: 'Quiz',
    status: 'Published',
    date: '2026-05-13T08:15:00+01:00',
    duration: 30,
    questions: 20,
    candidates: 42,
  },
]

export const recentActivities = [
  { id: 1, time: '08:10 AM', title: 'Attendance submitted', description: 'SS2 Gold attendance saved with 45 present students.' },
  { id: 2, time: 'Yesterday', title: 'Results auto-graded', description: 'SS2  Gold revision exam answers were compared and scored automatically.' },
  { id: 3, time: 'Yesterday', title: 'Question published', description: 'Published a new quadratic equations multiple choice set for SS2 Gold.' },
  { id: 4, time: 'Monday', title: 'Exam scheduled', description: 'SS2 Mid-Term Mathematics CBT scheduled for Thursday, 15 May 2026.' },
]

export const notifications = [
  { id: 1, title: 'Objective results ready', body: '27 recently submitted scripts have been auto-graded and are ready for review.', priority: 'high', action: 'Open Grading' },
  { id: 2, title: 'Live exam alert', body: '2 students in SS2  Gold triggered repeated tab-switch warnings.', priority: 'medium', action: 'Monitor Exam' },
  { id: 3, title: 'Attendance reminder', body: 'SS2 Gold attendance has not been captured for Wednesday, 14 May 2026.', priority: 'low', action: 'Take Attendance' },
]

export const questionBank = [
  {
    id: 'Q-001',
    type: 'Multiple Choice',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    className: 'SS2 Gold',
    status: 'Published',
    usageCount: 8,
    marks: 2,
    updatedAt: '2026-05-10T10:00:00+01:00',
    content: 'If x^2 - 7x + 10 = 0, what are the values of x?',
    options: ['2 and 5', '1 and 10', '3 and 4', '5 and 7'],
    correctAnswer: '2 and 5',
    explanation: 'Factorize to (x - 5)(x - 2) = 0.',
  },
  {
    id: 'Q-002',
    type: 'Multiple Choice',
    subject: 'Mathematics',
    topic: 'Indices',
    className: 'SS2 Gold',
    status: 'Draft',
    usageCount: 0,
    marks: 1,
    updatedAt: '2026-05-09T13:25:00+01:00',
    content: 'Evaluate 2^3 x 2^4.',
    options: ['2^7', '2^12', '2^1', '16'],
    correctAnswer: '2^7',
    explanation: 'Indices with the same base are added during multiplication.',
  },
  {
    id: 'Q-003',
    type: 'Multiple Choice',
    subject: 'Further Mathematics',
    topic: 'Matrices',
    className: 'SS2  Gold',
    status: 'Published',
    usageCount: 3,
    marks: 2,
    updatedAt: '2026-05-08T08:10:00+01:00',
    content: 'What is the determinant of the matrix [[2, 1], [4, 3]]?',
    options: ['2', '4', '6', '8'],
    correctAnswer: '2',
    explanation: '(2 x 3) - (1 x 4) = 2.',
  },
  {
    id: 'Q-004',
    type: 'Multiple Choice',
    subject: 'Mathematics',
    topic: 'Statistics',
    className: 'SS2 Gold',
    status: 'Published',
    usageCount: 2,
    marks: 3,
    updatedAt: '2026-05-07T15:00:00+01:00',
    content: 'The mean of 6, 8, 10 and 12 is?',
    options: ['8', '9', '10', '11'],
    correctAnswer: '9',
    explanation: 'The sum is 36 and 36 / 4 = 9.',
  },
  {
    id: 'Q-005',
    type: 'Multiple Choice',
    subject: 'Mathematics',
    topic: 'Set Theory',
    className: 'SS2 Gold',
    status: 'Published',
    usageCount: 6,
    marks: 3,
    updatedAt: '2026-05-05T11:45:00+01:00',
    content: 'Which symbol represents the intersection of sets A and B?',
    options: ['A∪B', 'A∩B', 'n(A)', 'A-B'],
    correctAnswer: 'A∩B',
    explanation: 'A∩B denotes common elements in both sets.',
  },
  {
    id: 'Q-006',
    type: 'Multiple Choice',
    subject: 'Further Mathematics',
    topic: 'Probability',
    className: 'SS2 Gold',
    status: 'Draft',
    usageCount: 1,
    marks: 4,
    updatedAt: '2026-05-04T16:15:00+01:00',
    content: 'A fair coin is tossed once. What is the probability of getting heads?',
    options: ['1/4', '1/3', '1/2', '1'],
    correctAnswer: '1/2',
    explanation: 'A fair coin has two equally likely outcomes.',
  },
]

export const questionTopics = [
  'Quadratic Equations',
  'Indices',
  'Matrices',
  'Statistics',
  'Set Theory',
  'Probability',
  'Trigonometry',
]

export const teacherStudents = [
  { id: 'STD-1001', name: 'Temiloluwa Bakare', admissionNo: 'NDC/2024/011', className: 'SS2 Gold', gender: 'Female', guardian: 'Mrs. Bukola Bakare', phone: '+234 814 220 3110', attendance: 96, average: 74, status: 'On Track', email: 'temiloluwa.bakare@student.educbt.ng' },
  { id: 'STD-1002', name: 'Daniel Musa', admissionNo: 'NDC/2024/019', className: 'SS2 Gold', gender: 'Male', guardian: 'Mr. Musa Daniel', phone: '+234 806 220 1149', attendance: 81, average: 59, status: 'Needs Support', email: 'daniel.musa@student.educbt.ng' },
  { id: 'STD-2001', name: 'Maryann Eze', admissionNo: 'NDC/2023/221', className: 'SS2 Gold', gender: 'Female', guardian: 'Mrs. Chioma Eze', phone: '+234 813 117 7720', attendance: 98, average: 88, status: 'Excellent', email: 'maryann.eze@student.educbt.ng' },
  { id: 'STD-2002', name: 'Ayomide Lawal', admissionNo: 'NDC/2023/205', className: 'SS2 Gold', gender: 'Male', guardian: 'Mr. Taofeek Lawal', phone: '+234 809 411 0933', attendance: 90, average: 71, status: 'On Track', email: 'ayomide.lawal@student.educbt.ng' },
  { id: 'STD-3001', name: 'Ifeanyi Nwosu', admissionNo: 'NDC/2022/087', className: 'SS2 Gold', gender: 'Male', guardian: 'Mrs. Amarachi Nwosu', phone: '+234 812 639 0021', attendance: 97, average: 91, status: 'Excellent', email: 'ifeanyi.nwosu@student.educbt.ng' },
  { id: 'STD-3002', name: 'Rita Okoye', admissionNo: 'NDC/2023/144', className: 'SS2 Gold', gender: 'Female', guardian: 'Mr. Emeka Okoye', phone: '+234 817 552 8871', attendance: 84, average: 64, status: 'Needs Support', email: 'rita.okoye@student.educbt.ng' },
  { id: 'STD-3003', name: 'Mubarak Bello', admissionNo: 'NDC/2022/098', className: 'SS2 Gold', gender: 'Male', guardian: 'Mrs. Fatima Bello', phone: '+234 703 889 0043', attendance: 92, average: 77, status: 'On Track', email: 'mubarak.bello@student.educbt.ng' },
]

export const attendanceRecords = teacherStudents.map((student, index) => ({
  studentId: student.id,
  studentName: student.name,
  className: student.className,
  admissionNo: student.admissionNo,
  present: !(index % 5 === 0),
}))

export const examLibrary = [
  {
    id: 'EX-201',
    title: 'SS2 Mid-Term Mathematics CBT',
    subject: 'Mathematics',
    className: 'SS2 Gold',
    type: 'Multiple Choice',
    status: 'Scheduled',
    scheduleLabel: 'Thu 15 May, 9:00 AM',
    duration: 60,
    passMark: 50,
    questions: ['Q-001', 'Q-002', 'Q-005'],
    totalMarks: 60,
    candidates: 47,
    submitted: 0,
    suspiciousCount: 0,
  },
  {
    id: 'EX-202',
    title: 'Further Mathematics Drill Test',
    subject: 'Further Mathematics',
    className: 'SS2  Gold',
    type: 'Multiple Choice',
    status: 'Draft',
    scheduleLabel: 'Not scheduled',
    duration: 45,
    passMark: 55,
    questions: ['Q-003', 'Q-004', 'Q-006'],
    totalMarks: 40,
    candidates: 51,
    submitted: 0,
    suspiciousCount: 0,
  },
  {
    id: 'EX-203',
    title: 'Live WAEC Revision CBT',
    subject: 'Mathematics',
    className: 'SS2  Gold',
    type: 'Multiple Choice',
    status: 'Live',
    scheduleLabel: 'In progress now',
    duration: 75,
    passMark: 50,
    questions: ['Q-001', 'Q-003', 'Q-004'],
    totalMarks: 70,
    candidates: 51,
    submitted: 29,
    suspiciousCount: 2,
  },
  {
    id: 'EX-204',
    title: 'SS2 Algebra Mastery Quiz',
    subject: 'Mathematics',
    className: 'SS2 Gold',
    type: 'Multiple Choice',
    status: 'Completed',
    scheduleLabel: 'Completed on Mon 11 May',
    duration: 30,
    passMark: 45,
    questions: ['Q-001', 'Q-002'],
    totalMarks: 20,
    candidates: 42,
    submitted: 42,
    suspiciousCount: 0,
  },
]

export const liveMonitoring = {
  examId: 'EX-203',
  summary: {
    activeStudents: 22,
    submitted: 29,
    disconnected: 1,
    warnings: 4,
    refreshLabel: 'Auto-refresh every 15s',
    timeRemaining: '24 mins left',
  },
  students: [
    { id: 'MON-1', name: 'Ifeanyi Nwosu', className: 'SS2  Gold', progress: 88, remaining: '11 mins', connection: 'Stable', attendance: 'Present', flag: null },
    { id: 'MON-2', name: 'Mubarak Bello', className: 'SS2  Gold', progress: 72, remaining: '18 mins', connection: 'Unstable', attendance: 'Present', flag: 'Weak connection' },
    { id: 'MON-3', name: 'Chinonso Eke', className: 'SS2  Gold', progress: 65, remaining: '20 mins', connection: 'Stable', attendance: 'Present', flag: 'Tab switch x2' },
    { id: 'MON-4', name: 'Aisha Sani', className: 'SS2  Gold', progress: 43, remaining: '24 mins', connection: 'Disconnected', attendance: 'Present', flag: 'Offline 3 mins' },
  ],
}

export const gradingQueue = [
  { id: 'GR-001', studentName: 'Maryann Eze', className: 'SS2 Gold', examTitle: 'SS2 Mid-Term Mathematics CBT', submittedAt: '2026-05-11T14:00:00+01:00', score: 16, totalQuestions: 20, correctCount: 16, status: 'Auto-Graded' },
  { id: 'GR-002', studentName: 'Rita Okoye', className: 'SS2 Gold', examTitle: 'Probability Drill CBT', submittedAt: '2026-05-11T15:15:00+01:00', score: 11, totalQuestions: 20, correctCount: 11, status: 'Auto-Graded' },
  { id: 'GR-003', studentName: 'Mubarak Bello', className: 'SS2  Gold', examTitle: 'Live WAEC Revision CBT', submittedAt: '2026-05-10T10:40:00+01:00', score: 18, totalQuestions: 25, correctCount: 18, status: 'Flagged Review' },
]

export const gradingDetail = {
  scriptId: 'GR-001',
  studentName: 'Maryann Eze',
  className: 'SS2 Gold',
  examTitle: 'SS2 Mid-Term Mathematics CBT',
  progress: '27 of 42 submitted scripts reviewed',
  autosave: 'Compared automatically 12 seconds ago',
  score: 16,
  totalQuestions: 20,
  comparisons: [
    { id: 'CMP-001', question: 'If x^2 - 7x + 10 = 0, what are the values of x?', correctAnswer: '2 and 5', studentAnswer: '2 and 5', status: 'Correct' },
    { id: 'CMP-002', question: 'Evaluate 2^3 x 2^4.', correctAnswer: '2^7', studentAnswer: '2^12', status: 'Incorrect' },
    { id: 'CMP-003', question: 'What is the determinant of the matrix [[2, 1], [4, 3]]?', correctAnswer: '2', studentAnswer: '2', status: 'Correct' },
    { id: 'CMP-004', question: 'The mean of 6, 8, 10 and 12 is?', correctAnswer: '9', studentAnswer: '9', status: 'Correct' },
  ],
  flaggedReason: 'Two incorrect responses on indices and set theory items. Teacher may review flagged responses if needed.',
}

export const resultsAnalytics = {
  averageScore: 71,
  passRate: 84,
  distinctionRate: 22,
  weakTopics: [
    { topic: 'Indices', score: 48 },
    { topic: 'Probability', score: 52 },
    { topic: 'Set Theory', score: 58 },
  ],
  topStudents: [
    { name: 'Ifeanyi Nwosu', className: 'SS2  Gold', score: 94 },
    { name: 'Maryann Eze', className: 'SS2 Gold', score: 91 },
    { name: 'Temiloluwa Bakare', className: 'SS2 Gold', score: 89 },
  ],
  gradeDistribution: [
    { grade: 'A', count: 26 },
    { grade: 'B', count: 42 },
    { grade: 'C', count: 39 },
    { grade: 'D', count: 15 },
    { grade: 'F', count: 9 },
  ],
  subjectComparison: [
    { subject: 'Mathematics', average: 71, completion: 94 },
    { subject: 'Further Mathematics', average: 68, completion: 88 },
    { subject: 'Physics Support Class', average: 64, completion: 81 },
  ],
  trend: [
    { period: 'Week 1', score: 62 },
    { period: 'Week 2', score: 66 },
    { period: 'Week 3', score: 69 },
    { period: 'Week 4', score: 71 },
    { period: 'Week 5', score: 74 },
  ],
}

export const resultRecords = [
  { id: 'RS-1', examTitle: 'SS2 Algebra Mastery Quiz', className: 'SS2 Gold', submitted: 42, average: 73, highest: 96, lowest: 41, passRate: 86, publishedAt: '2026-05-11T13:45:00+01:00' },
  { id: 'RS-2', examTitle: 'SS2 Mid-Term Mathematics CBT', className: 'SS2 Gold', submitted: 47, average: 68, highest: 91, lowest: 33, passRate: 78, publishedAt: '2026-05-10T16:20:00+01:00' },
  { id: 'RS-3', examTitle: 'Probability Drill CBT', className: 'SS2 Gold', submitted: 46, average: 64, highest: 88, lowest: 29, passRate: 72, publishedAt: '2026-05-08T11:00:00+01:00' },
]

export const timetable = {
  weekly: [
    { day: 'Monday', entries: [{ time: '8:00 - 8:40', subject: 'Mathematics', className: 'SS2 Gold', room: 'Block C4' }, { time: '10:20 - 11:00', subject: 'Further Mathematics', className: 'SS2  Gold', room: 'Block A1' }] },
    { day: 'Tuesday', entries: [{ time: '9:40 - 10:20', subject: 'Mathematics', className: 'SS2 Gold', room: 'Block B2' }, { time: '12:00 - 12:40', subject: 'Mathematics', className: 'SS2  Gold', room: 'Block A1' }] },
    { day: 'Wednesday', entries: [{ time: '8:40 - 9:20', subject: 'Mathematics', className: 'SS2 Gold', room: 'Block C4' }, { time: '1:20 - 2:00', subject: 'Further Mathematics', className: 'SS2 Gold', room: 'Block B5' }] },
    { day: 'Thursday', entries: [{ time: '9:00 - 10:00', subject: 'Exam Invigilation', className: 'SS2 Gold', room: 'CBT Lab 1' }, { time: '12:40 - 1:20', subject: 'Mathematics Clinic', className: 'SS2  Gold', room: 'Maths Lab' }] },
    { day: 'Friday', entries: [{ time: '8:00 - 8:40', subject: 'Mathematics', className: 'SS2 Gold', room: 'Block B2' }, { time: '11:00 - 11:40', subject: 'Remedial Session', className: 'SS2 Gold', room: 'Maths Lab' }] },
  ],
  calendar: [
    { date: '2026-05-13', label: 'SS2 Algebra Quiz', tone: 'blue' },
    { date: '2026-05-15', label: 'SS2 Mid-Term CBT', tone: 'emerald' },
    { date: '2026-05-16', label: 'Parent feedback follow-up', tone: 'amber' },
    { date: '2026-05-19', label: 'Theory grading moderation', tone: 'rose' },
  ],
  conflicts: [
    { id: 1, message: 'Thursday 9:00 AM overlaps with SS2 Gold exam invigilation and department briefing.', severity: 'warning' },
  ],
}

export const loadingMoments = {
  dashboard: 500,
  questionBank: 700,
  exams: 650,
  results: 750,
}

export const teacherNavigationGroups = [
  { label: 'Dashboard', to: '/teachers/dashboard' },
  { label: 'Question Bank', to: '/teachers/questions' },
  { label: 'Exams', to: '/teachers/exams' },
  { label: 'Students', to: '/teachers/students' },
  { label: 'Attendance', to: '/teachers/attendance' },
  { label: 'Grading', to: '/teachers/grading' },
  { label: 'Results', to: '/teachers/results' },
  { label: 'Timetable', to: '/teachers/timetable' },
  { label: 'Profile', to: '/teachers/profile' },
  { label: 'Settings', to: '/teachers/settings' },
]

export const cloneMock = (value) => JSON.parse(JSON.stringify(value))

export const findQuestionById = (questionId) =>
  questionBank.find((question) => question.id === questionId)

export const getQuestionBankForExam = (questionIds = []) =>
  questionIds.map(findQuestionById).filter(Boolean)

export const formatHumanDate = (value, options = {}) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })

export const nowLabel = isoNow
