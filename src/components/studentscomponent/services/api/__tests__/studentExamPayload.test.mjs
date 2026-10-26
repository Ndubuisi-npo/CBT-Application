import test from 'node:test'
import assert from 'node:assert/strict'
import { extractStudentExamList } from '../studentExamPayload.js'

test('extracts exams from direct and wrapped API list responses', () => {
  const exams = [{ id: 'live-1', assessment_status: 'completed' }]

  assert.deepEqual(extractStudentExamList(exams), exams)
  assert.deepEqual(extractStudentExamList({ data: exams }), exams)
  assert.deepEqual(extractStudentExamList({ exams }), exams)
  assert.deepEqual(extractStudentExamList({ data: { exams } }), exams)
  assert.deepEqual(extractStudentExamList({ success: true, data: { data: exams } }), exams)
})

test('does not drop exams based on client lifecycle fields', () => {
  const exams = [
    { id: 'live-1', status: 'Live', assessment_status: 'published' },
    { id: 'live-2', status: 'active', assessment_status: 'completed' },
  ]

  assert.deepEqual(extractStudentExamList({ data: exams }), exams)
})

test('returns an empty list for an unsupported payload shape', () => {
  assert.deepEqual(extractStudentExamList({ success: true, message: 'No exams' }), [])
})
