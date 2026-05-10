const sessions = [
  { id: 1, name: '2025/2026' },
  { id: 2, name: '2024/2025' },
  { id: 3, name: '2023/2024' },
]

const terms = [
  { id: 'first', label: 'First Term' },
  { id: 'second', label: 'Second Term' },
  { id: 'third', label: 'Third Term' },
]

const assessmentCategories = [
  { id: 'ca1', label: 'CA 1' },
  { id: 'ca2', label: 'CA 2' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'exam', label: 'Exam' },
]

const classLevels = [
  { id: 1, name: 'JSS 1' },
  { id: 2, name: 'JSS 2' },
  { id: 3, name: 'JSS 3' },
  { id: 4, name: 'SSS 1' },
  { id: 5, name: 'SSS 2' },
]

const classArms = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' },
]

const subjects = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'English Language' },
  { id: 3, name: 'Biology' },
  { id: 4, name: 'Chemistry' },
  { id: 5, name: 'Physics' },
  { id: 6, name: 'Economics' },
]

const teachers = [
  { id: 501, first_name: 'Grace', last_name: 'Adetola' },
  { id: 502, first_name: 'Samuel', last_name: 'Okoye' },
  { id: 503, first_name: 'Ruth', last_name: 'Akinwale' },
  { id: 504, first_name: 'Daniel', last_name: 'Mbanefo' },
]

const assessments = [
  {
    id: 101,
    category: 'ca1',
    title: 'JSS 1 CA 1',
    description: 'CA 1 assessment for JSS 1 students.',
    sessionId: 1,
    term: 'first',
    classLevelId: 1,
    classArmId: 1,
    subjectId: 2,
    teacherId: 502,
    dueDate: '2026-09-06',
    dueTime: '11:30',
    totalMarks: 20,
    status: 'active',
    createdAt: '2026-08-01',
  },
  {
    id: 102,
    category: 'ca2',
    title: 'SSS 1 CA 2',
    description: 'CA 2 assessment for SSS 1 students.',
    sessionId: 1,
    term: 'second',
    classLevelId: 4,
    classArmId: 2,
    subjectId: 2,
    teacherId: 502,
    dueDate: '2026-10-05',
    dueTime: '14:00',
    totalMarks: 20,
    status: 'active',
    createdAt: '2026-08-05',
  },
  {
    id: 103,
    category: 'attendance',
    title: 'JSS 1 Attendance',
    description: 'Attendance assessment for JSS 1.',
    sessionId: 1,
    term: 'first',
    classLevelId: 1,
    classArmId: 1,
    subjectId: 2,
    teacherId: 502,
    dueDate: '2026-09-12',
    dueTime: '09:00',
    totalMarks: 10,
    status: 'active',
    createdAt: '2026-08-08',
  },
  {
    id: 104,
    category: 'exam',
    title: 'SSS 1 Exam',
    description: 'Formal exam for SSS 1 students.',
    sessionId: 1,
    term: 'third',
    classLevelId: 4,
    classArmId: 2,
    subjectId: 2,
    teacherId: 502,
    dueDate: '2026-10-20',
    dueTime: '10:00',
    totalMarks: 60,
    status: 'active',
    createdAt: '2026-08-10',
  },
]

const submissions = [
  {
    id: 1001,
    assessmentId: 101,
    teacherId: 501,
    subjectId: 1,
    questions: [
      { number: 1, text: 'Solve 24 ÷ 3 + 6 × 2.', type: 'theory', marks: 10, difficulty: 'Medium', correctAnswer: '18', explanation: 'Order of operations gives 24 ÷ 3 + 12 = 20', options: [] },
      { number: 2, text: 'Which shape has 4 equal sides?', type: 'multiple_choice', marks: 10, difficulty: 'Easy', options: ['Triangle', 'Square', 'Rectangle', 'Circle'], correctAnswer: 'Square', explanation: 'A square has four equal sides.' },
    ],
    submissionDate: '2026-08-28T14:10:00Z',
    status: 'submitted',
  },
  {
    id: 1002,
    assessmentId: 101,
    teacherId: 503,
    subjectId: 2,
    questions: [
      { number: 1, text: 'Find the product of 12 and 7.', type: 'theory', marks: 10, difficulty: 'Easy', correctAnswer: '84', explanation: '', options: [] },
      { number: 2, text: 'Select the prime number.', type: 'multiple_choice', marks: 10, difficulty: 'Easy', options: ['15', '17', '21', '27'], correctAnswer: '17', explanation: '' },
    ],
    submissionDate: '2026-08-29T08:15:00Z',
    status: 'pending',
  },
  {
    id: 1003,
    assessmentId: 104,
    teacherId: 504,
    subjectId: 6,
    questions: [
      { number: 1, text: 'Start-up costs are classified as:', type: 'multiple_choice', marks: 60, difficulty: 'Medium', options: ['Fixed cost', 'Variable cost', 'Indirect cost', 'Sunk cost'], correctAnswer: 'Sunk cost', explanation: '' },
    ],
    submissionDate: '2026-08-31T12:55:00Z',
    status: 'submitted',
  },
]

const teacherAssignments = [
  {
    id: 2001,
    teacherId: 502,
    assessmentId: 101,
    subjectId: 2,
    title: 'JSS 1 English CA 1',
    description: 'Build a strong foundation for JSS 1 English CA 1.',
    questions: [
      { id: 1, number: 1, text: 'What is 8 × 7?', type: 'theory', marks: 10, difficulty: 'Easy', options: [], correctAnswer: '56', explanation: '' },
      { id: 2, number: 2, text: 'True or false: 0 is a prime number.', type: 'true_false', marks: 10, difficulty: 'Easy', options: ['True', 'False'], correctAnswer: 'False', explanation: 'Zero is neither prime nor composite.' },
    ],
  },
]

let nextAssessmentId = 105
let nextSubmissionId = 1004
let nextAssignmentId = 2002
let nextQuestionId = 3

const findSessionName = (id) => sessions.find((item) => item.id === id)?.name || 'Unknown session'
const findTermLabel = (key) => terms.find((item) => item.id === key)?.label || key
const findLevelName = (id) => classLevels.find((item) => item.id === id)?.name || 'Unknown level'
const findArmName = (id) => classArms.find((item) => item.id === id)?.name || 'All arms'
const findSubjectName = (id) => subjects.find((item) => item.id === id)?.name || 'Unknown subject'
const findTeacherName = (id) => {
  const teacher = teachers.find((item) => item.id === id)
  return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown teacher'
}

const buildAssessmentTitle = ({ category, subjectId, classLevelId, classArmId }) => {
  const categoryLabel = assessmentCategories.find((item) => item.id === category)?.label || category
  const className = findLevelName(classLevelId)
  const armLabel = classArmId ? ` ${findArmName(classArmId)}` : ''
  const subjectName = findSubjectName(subjectId)
  return `${className}${armLabel} ${subjectName} ${categoryLabel}`
}

export const getAllAssessments = () => assessments.map((assessment) => ({ ...assessment }))
export const getActiveAssessments = () => assessments.filter((assessment) => assessment.status === 'active').map((assessment) => ({ ...assessment }))
export const getTeacherAssessments = (teacherId) => assessments.filter((assessment) => assessment.teacherId === Number(teacherId) && assessment.status === 'active').map((assessment) => ({ ...assessment }))
export const getAssessmentById = (id) => assessments.find((assessment) => assessment.id === Number(id)) || null
export const getAssessmentLabel = (assessment) => {
  if (!assessment) return 'Unknown assessment'
  return `${assessment.title} • ${findSessionName(assessment.sessionId)} • ${findLevelName(assessment.classLevelId)}${assessment.classArmId ? ` ${findArmName(assessment.classArmId)}` : ''}`
}
export const saveAssessment = (payload) => {
  if (payload.id) {
    const index = assessments.findIndex((assessment) => assessment.id === payload.id)
    if (index !== -1) {
      assessments[index] = { ...assessments[index], ...payload }
      return assessments[index]
    }
  }
  const newAssessment = {
    ...payload,
    id: nextAssessmentId++,
    title: payload.title?.trim() || buildAssessmentTitle(payload),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  assessments.unshift(newAssessment)
  return newAssessment
}
export const deleteAssessment = (id) => {
  const index = assessments.findIndex((assessment) => assessment.id === Number(id))
  if (index !== -1) assessments.splice(index, 1)
  return index !== -1
}
export const duplicateAssessment = (id) => {
  const source = getAssessmentById(id)
  if (!source) return null
  const duplicate = {
    ...source,
    id: nextAssessmentId++,
    title: `${source.title} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  assessments.unshift(duplicate)
  return duplicate
}
export const toggleAssessmentStatus = (id) => {
  const assessment = getAssessmentById(id)
  if (!assessment) return null
  assessment.status = assessment.status === 'active' ? 'closed' : 'active'
  return assessment
}
export const getSubmissionsByAssessment = (assessmentId) => submissions.filter((item) => item.assessmentId === Number(assessmentId))
export const getSubmissionById = (assessmentId, submissionId) => submissions.find((item) => item.assessmentId === Number(assessmentId) && item.id === Number(submissionId)) || null
export const getTeacherAssignmentsForTeacher = (teacherId) => teacherAssignments.filter((item) => item.teacherId === Number(teacherId))
export const getTeacherAssignmentByAssessment = (assessmentId) => teacherAssignments.filter((item) => item.assessmentId === Number(assessmentId))
export const getTeacherAssignmentByAssessmentForTeacher = (assessmentId, teacherId) => teacherAssignments.filter((item) => item.assessmentId === Number(assessmentId) && item.teacherId === Number(teacherId))
export const createTeacherAssignment = ({ assessmentId, subjectId, title, description, teacherId }) => {
  const assignment = {
    id: nextAssignmentId++,
    teacherId: Number(teacherId),
    assessmentId: Number(assessmentId),
    subjectId: Number(subjectId),
    title: title || findSubjectName(subjectId),
    description,
    questions: [],
  }
  teacherAssignments.push(assignment)
  return assignment
}
export const addQuestionToAssignment = ({ assignmentId, payload }) => {
  const assignment = teacherAssignments.find((item) => item.id === Number(assignmentId))
  if (!assignment) return null
  const question = {
    id: nextQuestionId++,
    number: assignment.questions.length + 1,
    type: payload.type,
    text: payload.text,
    marks: Number(payload.marks),
    difficulty: payload.difficulty,
    options: payload.options || [],
    correctAnswer: payload.correctAnswer,
    explanation: payload.explanation || '',
  }
  assignment.questions.push(question)
  return question
}
export const updateQuestionOnAssignment = ({ assignmentId, questionId, payload }) => {
  const assignment = teacherAssignments.find((item) => item.id === Number(assignmentId))
  if (!assignment) return null
  const index = assignment.questions.findIndex((q) => q.id === Number(questionId))
  if (index === -1) return null
  assignment.questions[index] = {
    ...assignment.questions[index],
    ...payload,
    marks: Number(payload.marks),
  }
  return assignment.questions[index]
}
export const deleteQuestionFromAssignment = ({ assignmentId, questionId }) => {
  const assignment = teacherAssignments.find((item) => item.id === Number(assignmentId))
  if (!assignment) return false
  const index = assignment.questions.findIndex((q) => q.id === Number(questionId))
  if (index === -1) return false
  assignment.questions.splice(index, 1)
  assignment.questions.forEach((q, idx) => { q.number = idx + 1 })
  return true
}
export const duplicateQuestionInAssignment = ({ assignmentId, questionId }) => {
  const assignment = teacherAssignments.find((item) => item.id === Number(assignmentId))
  if (!assignment) return null
  const source = assignment.questions.find((q) => q.id === Number(questionId))
  if (!source) return null
  const duplicate = {
    ...source,
    id: nextQuestionId++,
    number: assignment.questions.length + 1,
    text: `${source.text} (Copy)`,
  }
  assignment.questions.push(duplicate)
  return duplicate
}
export const reorderQuestionInAssignment = ({ assignmentId, questionId, direction }) => {
  const assignment = teacherAssignments.find((item) => item.id === Number(assignmentId))
  if (!assignment) return false
  const index = assignment.questions.findIndex((q) => q.id === Number(questionId))
  if (index === -1) return false
  const target = index + direction
  if (target < 0 || target >= assignment.questions.length) return false
  const [moved] = assignment.questions.splice(index, 1)
  assignment.questions.splice(target, 0, moved)
  assignment.questions.forEach((q, idx) => { q.number = idx + 1 })
  return true
}
export const getSessionOptions = () => sessions.map((item) => ({ label: item.name, value: item.id }))
export const getTermOptions = () => terms.map((item) => ({ label: item.label, value: item.id }))
export const getClassLevelOptions = () => classLevels.map((item) => ({ label: item.name, value: item.id }))
export const getClassArmOptions = () => [{ label: 'All arms', value: '' }, ...classArms.map((item) => ({ label: item.name, value: item.id }))]
export const getSubjectOptions = () => subjects.map((item) => ({ label: item.name, value: item.id }))
export const getTeacherOptions = () => teachers.map((item) => ({ label: `${item.first_name} ${item.last_name}`, value: item.id }))
export const getCategoryOptions = () => assessmentCategories.map((item) => ({ label: item.label, value: item.id }))
export const getDifficultyOptions = () => [
  { label: 'Easy', value: 'Easy' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Hard', value: 'Hard' },
]
export const currentTeacherId = 502
export const getTeacherById = (id) => teachers.find((item) => item.id === Number(id)) || null
export const getSubmissionStatusLabel = (status) => {
  if (status === 'submitted') return 'Submitted'
  if (status === 'pending') return 'Pending'
  if (status === 'reviewed') return 'Reviewed'
  return 'Unknown'
}
export const getStatusVariant = (status) => {
  if (status === 'draft') return 'warning'
  if (status === 'active') return 'success'
  if (status === 'closed') return 'danger'
  return 'default'
}
export const getQuestionTypes = () => [
  { label: 'Multiple Choice', value: 'multiple_choice' },
  { label: 'Theory', value: 'theory' },
  { label: 'True / False', value: 'true_false' },
]
export const getSubjectName = findSubjectName
export const getSessionName = findSessionName
export const getTermLabel = findTermLabel
export const getClassLevelName = findLevelName
export const getClassArmName = findArmName
export const getTeacherName = findTeacherName
