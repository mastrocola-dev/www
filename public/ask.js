export const endpoint = 'https://api.mastrocola.dev'
export const siteKey = '0x4AAAAAAFMcCLaUJQP9gJym'
export const pollMs = 1500
export const giveUpMs = 180_000

const repository = 'https://github.com/mastrocola-dev/docs'

const refusals = {
  invalid: 'Questions take between 3 and 500 characters.',
  challenge: 'The human check did not pass. Try again.',
  busy: 'Too many questions are running right now. Try again in a minute.',
  quota: 'You have reached the limit of questions for today.',
  budget: 'The budget for answers is spent for today. Come back tomorrow.',
}

const failures = {
  timeout: 'The answer took too long. Try again.',
  budget: 'The question needed more work than one answer is allowed.',
}

const tools = {
  docs__list_documents: 'Listing the documents',
  docs__search_documents: 'Searching the documents',
  docs__read_document: 'Reading a document',
}

const unexpected = 'Something went wrong. Try again.'
const outOfScope = 'This box only answers questions about how mastrocola.dev is built and run.'

const pick = (table, key, fallback) => (Object.hasOwn(table, key) ? table[key] : fallback)

const isText = (value) => typeof value === 'string' && value.trim() !== ''

const isSource = (path) => typeof path === 'string' && /^(adr|architecture|runbooks)(\/[a-z0-9][a-z0-9-]*)+\.md$/.test(path)

const step = (value) => (value?.kind === 'tool' ? pick(tools, value.name, 'Reading the documents') : 'Thinking')

const answered = ({ answer, sources }) => (isText(answer) ? { done: true, answer: answer.trim(), sources: (Array.isArray(sources) ? sources : []).filter(isSource).map((path) => ({ path, url: `${repository}/blob/main/${path}` })) } : { done: true, message: unexpected })

export const refusal = (error) => pick(refusals, error, unexpected)

export const timedOut = { done: true, message: failures.timeout }

export function view(job) {
  if (job?.status === 'queued') return { message: 'Queued' }
  if (job?.status === 'running') return { message: step(job.step) }
  if (job?.status === 'failed') return { done: true, message: pick(failures, job.reason, unexpected) }
  if (job?.status !== 'done') return { message: 'Working' }
  return job.output?.outOfScope === true ? { done: true, message: outOfScope } : answered(job.output ?? {})
}
