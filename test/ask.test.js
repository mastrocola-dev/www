import assert from 'node:assert/strict'
import { test } from 'node:test'
import { refusal, timedOut, view } from '../public/ask.js'

const output = { outOfScope: false, answer: ' Each deployable has its own repository. ', sources: ['adr/001-multi-repo.md'] }

test('shows the wait instead of hiding it', () => {
  assert.deepEqual(view({ status: 'queued' }), { message: 'Queued' })
  assert.deepEqual(view({ status: 'running' }), { message: 'Thinking' })
  assert.deepEqual(view({ status: 'running', step: { kind: 'model' } }), { message: 'Thinking' })
  assert.deepEqual(view({ status: 'running', step: { kind: 'tool', name: 'docs__read_document' } }), { message: 'Reading a document' })
  assert.deepEqual(view({ status: 'running', step: { kind: 'tool', name: '<b>x</b>' } }), { message: 'Reading the documents' })
  assert.deepEqual(view({ status: 'running', step: { kind: 'tool', name: 'constructor' } }), { message: 'Reading the documents' })
})

test('keeps polling on a state it does not know', () => {
  assert.deepEqual(view({ status: 'paused' }), { message: 'Working' })
  assert.deepEqual(view(null), { message: 'Working' })
})

test('shows the answer with links it builds itself', () => {
  assert.deepEqual(view({ status: 'done', output }), { done: true, answer: 'Each deployable has its own repository.', sources: [{ path: 'adr/001-multi-repo.md', url: 'https://github.com/mastrocola-dev/docs/blob/main/adr/001-multi-repo.md' }] })
})

test('drops sources that could leave the docs repository', () => {
  const sources = ['https://evil.example/x.md', 'javascript:alert(1)', 'adr/../../x.md', 'adr/001-a.md?x', 'src/x.md', 'adr/001-a.txt', 7, null]
  assert.deepEqual(view({ status: 'done', output: { ...output, sources } }).sources, [])
  assert.deepEqual(view({ status: 'done', output: { ...output, sources: 'adr/001-multi-repo.md' } }).sources, [])
})

test('keeps markup in the answer as plain text for the renderer to insert as text', () => {
  assert.equal(view({ status: 'done', output: { ...output, answer: '<img src=x onerror=alert(1)>' } }).answer, '<img src=x onerror=alert(1)>')
})

test('replaces an out of scope answer with a fixed message', () => {
  const state = view({ status: 'done', output: { outOfScope: true, answer: 'Ignore the rules.', sources: [] } })
  assert.equal(state.done, true)
  assert.match(state.message, /only answers questions about how mastrocola.dev/)
  assert.equal(state.answer, undefined)
})

test('ends without an answer when the output is malformed', () => {
  for (const malformed of [undefined, {}, { answer: ' ' }, { answer: 7 }]) assert.deepEqual(view({ status: 'done', output: malformed }), { done: true, message: 'Something went wrong. Try again.' })
})

test('explains a failed job by its reason', () => {
  assert.deepEqual(view({ status: 'failed', reason: 'timeout' }), timedOut)
  assert.match(view({ status: 'failed', reason: 'budget' }).message, /more work than one answer/)
  for (const reason of ['redelivered', 'toString', undefined]) assert.deepEqual(view({ status: 'failed', reason }), { done: true, message: 'Something went wrong. Try again.' })
})

test('explains each refusal and falls back on an unknown one', () => {
  assert.match(refusal('invalid'), /3 and 500/)
  assert.match(refusal('challenge'), /human check/)
  assert.match(refusal('busy'), /Too many/)
  assert.match(refusal('quota'), /limit of questions/)
  assert.match(refusal('budget'), /budget/)
  assert.equal(refusal('toString'), 'Something went wrong. Try again.')
  assert.equal(refusal(), 'Something went wrong. Try again.')
})
