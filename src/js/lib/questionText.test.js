import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeQuestionText } from './questionText.js'

test('strips inline styling and preserves readable spacing', () => {
  const input = '<p style="color:red;font-family:Arial;">What<span style="color:blue;"> is</span> your name?</p>'
  assert.equal(normalizeQuestionText(input), 'What is your name?')
})

test('preserves line breaks for paragraph content', () => {
  const input = 'First line<br><br>Second line'
  assert.equal(normalizeQuestionText(input), 'First line\n\nSecond line')
})
