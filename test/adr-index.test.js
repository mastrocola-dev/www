import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseIndex } from '../public/adr-index.js'

const adr = { id: 'ADR-001', title: ' Multi-repo ', status: 'Accepted', decision: 'Split by deployable. ', path: 'adr/001-multi-repo.md' }

test('keeps valid entries, normalized, with a link to the record', () => {
  assert.deepEqual(parseIndex({ adrs: [adr] }).adrs, [{ id: 'ADR-001', title: 'Multi-repo', status: 'accepted', decision: 'Split by deployable.', url: 'https://github.com/mastrocola-dev/docs/blob/main/adr/001-multi-repo.md' }])
})

test('drops entries whose path could escape the docs repository', () => {
  const paths = ['https://evil.example/x.md', 'javascript:alert(1)', 'adr/../../x.md', 'adr/001-a.md?x', 'runbooks/x.md']
  assert.deepEqual(parseIndex({ adrs: paths.map((path) => ({ ...adr, path })) }).adrs, [])
})

test('drops entries with unknown status, malformed id or missing text', () => {
  const invalid = [{ ...adr, status: 'Rejected' }, { ...adr, status: 1 }, { ...adr, id: 'ADR-1' }, { ...adr, title: ' ' }, { ...adr, decision: null }, null, 'ADR-001']
  assert.deepEqual(parseIndex({ adrs: invalid }).adrs, [])
})

test('keeps markup as plain text for the renderer to insert as text', () => {
  assert.equal(parseIndex({ adrs: [{ ...adr, title: '<img src=x onerror=alert(1)>' }] }).adrs[0].title, '<img src=x onerror=alert(1)>')
})

test('reads provenance and tolerates its absence', () => {
  assert.deepEqual(parseIndex({ model: 'claude-haiku-4-5', generatedAt: '2026-09-29T12:00:00Z', adrs: [] }), { model: 'claude-haiku-4-5', generatedAt: new Date('2026-09-29T12:00:00Z'), adrs: [] })
  assert.deepEqual(parseIndex({ generatedAt: 'yesterday' }), { model: null, generatedAt: null, adrs: [] })
  assert.deepEqual(parseIndex(null), { model: null, generatedAt: null, adrs: [] })
})
