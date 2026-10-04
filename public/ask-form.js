import { endpoint, giveUpMs, pollMs, refusal, siteKey, timedOut, view } from './ask.js'
import { element } from './dom.js'

const section = document.getElementById('ask')
const form = section.querySelector('form')
const field = form.elements.question
const button = form.querySelector('button')
const thread = section.querySelector('.thread')

let widget
let token
let settle

const expect = () => {
  token = new Promise((resolve) => {
    settle = resolve
  })
}

const renew = () => {
  if (!widget) return
  expect()
  globalThis.turnstile.reset(widget)
}

const challenge = () => {
  widget = globalThis.turnstile.render(section.querySelector('.challenge'), {
    sitekey: siteKey,
    appearance: 'interaction-only',
    callback: (value) => settle(value),
    'error-callback': () => settle(''),
    'expired-callback': renew,
  })
}

const prepare = () => {
  expect()
  fetch(`${endpoint}/warm`, { method: 'POST' }).catch(console.warn)
  document.head.append(element('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', onload: challenge, onerror: () => settle('') }))
}

const show = (reply, { message = '', answer = '', sources = [] }) => {
  reply.replaceChildren(element('p', { className: 'progress' }, message), element('p', { className: 'answer' }, answer), element('ul', { className: 'sources' }, ...sources.map(({ path, url }) => element('li', {}, element('a', { href: url }, path)))))
  reply.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function follow(reply, jobId) {
  const deadline = Date.now() + giveUpMs
  while (Date.now() < deadline) {
    await pause(pollMs)
    const response = await fetch(`${endpoint}/jobs/${jobId}`)
    if (!response.ok) continue
    const state = view(await response.json())
    show(reply, state)
    if (state.done) return
  }
  show(reply, timedOut)
}

async function ask(reply, question) {
  show(reply, { message: 'Checking that you are human' })
  const value = await token
  if (!value) return show(reply, { message: refusal('challenge') })
  show(reply, { message: 'Sending' })
  const response = await fetch(`${endpoint}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, token: value }) })
  const body = await response.json().catch(() => ({}))
  if (response.status !== 202) return show(reply, { message: refusal(body.error) })
  show(reply, view({ status: 'queued' }))
  await follow(reply, body.jobId)
}

field.addEventListener('focus', prepare, { once: true })

field.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  form.requestSubmit()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (button.disabled) return
  const question = field.value
  const reply = element('li', { className: 'reply' })
  thread.append(element('li', { className: 'question' }, question), reply)
  field.value = ''
  button.disabled = true
  ask(reply, question)
    .catch(() => show(reply, { message: refusal() }))
    .finally(() => {
      button.disabled = false
      renew()
    })
})

section.hidden = false
