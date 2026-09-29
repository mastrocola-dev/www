import { parseIndex, source } from './adr-index.js'

const section = document.getElementById('adrs')

const element = (tag, properties, ...children) => {
  const node = Object.assign(document.createElement(tag), properties)
  node.append(...children)
  return node
}

const item = (adr) => element('li', {}, element('p', { className: 'label' }, element('a', { href: adr.url }, adr.id), element('span', { className: 'status' }, adr.status)), element('h3', {}, adr.title), element('p', {}, adr.decision))

const provenance = ({ model, generatedAt }) => [model, generatedAt?.toLocaleDateString('en', { dateStyle: 'medium' })].filter(Boolean).join(' · ')

const load = async () => {
  const response = await fetch(source, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`ADR index unavailable: ${response.status}`)
  const index = parseIndex(await response.json())
  if (index.adrs.length === 0) return
  section.querySelector('ol').replaceChildren(...index.adrs.map(item))
  section.querySelector('.generated').textContent = provenance(index)
  section.hidden = false
}

load().catch(console.warn)
