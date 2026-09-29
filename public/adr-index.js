export const source = 'https://raw.githubusercontent.com/mastrocola-dev/docs/main/index/adrs.json'

const repository = 'https://github.com/mastrocola-dev/docs'
const statuses = ['proposed', 'accepted', 'deprecated', 'superseded']

const isText = (value) => typeof value === 'string' && value.trim() !== ''

const isAdr = (adr) => /^ADR-\d{3}$/.test(adr?.id) && /^adr\/\d{3}-[a-z0-9-]+\.md$/.test(adr.path) && statuses.includes(adr.status?.toLowerCase?.()) && isText(adr.title) && isText(adr.decision)

const toEntry = ({ id, title, status, decision, path }) => ({ id, title: title.trim(), status: status.toLowerCase(), decision: decision.trim(), url: `${repository}/blob/main/${path}` })

export const parseIndex = (index) => ({
  model: isText(index?.model) ? index.model : null,
  generatedAt: Number.isNaN(Date.parse(index?.generatedAt)) ? null : new Date(index.generatedAt),
  adrs: (Array.isArray(index?.adrs) ? index.adrs : []).filter(isAdr).map(toEntry),
})
