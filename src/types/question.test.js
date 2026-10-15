import test from 'node:test'
import assert from 'node:assert/strict'
import { detectContentFormat } from './question.js'

test('detectContentFormat returns latex when content contains math delimiters', () => {
  assert.equal(detectContentFormat('What is $x+1$?'), 'latex')
  assert.equal(detectContentFormat('Solve $$a^2+b^2=c^2$$'), 'latex')
})

test('detectContentFormat returns text for plain content', () => {
  assert.equal(detectContentFormat('What is the capital of Nigeria?'), 'text')
})
