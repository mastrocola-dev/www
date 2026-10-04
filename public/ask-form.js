import { endpoint, giveUpMs, pollMs, refusal, siteKey, timedOut, view } from './ask.js'
import { element } from './dom.js'

const section = document.getElementById('ask')
const form = section.querySelector('form')
const field = form.elements.question
const button = form.querySelector('button')
const status = section.querySelector('.progress')
const answer = section.querySelector('.answer')
const sources = section.querySelector('.sources')

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

const show = ({ message = '', answer: text = '', sources: links = [] }) => {
  status.textContent = message
  answer.textContent = text
  sources.replaceChildren(...links.map(({ path, url }) => element('li', {}, element('a', { href: url }, path))))
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function follow(jobId) {
  const deadline = Date.now() + giveUpMs
  while (Date.now() < deadline) {
    await pause(pollMs)
    const response = await fetch(`${endpoint}/jobs/${jobId}`)
    if (!response.ok) continue
    const state = view(await response.json())
    show(state)
    if (state.done) return
  }
  show(timedOut)
}

async function ask() {
  show({ message: 'Checking that you are human' })
  const value = await token
  if (!value) return show({ message: refusal('challenge') })
  show({ message: 'Sending' })
  const response = await fetch(`${endpoint}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: field.value, token: value }) })
  const body = await response.json().catch(() => ({}))
  if (response.status !== 202) return show({ message: refusal(body.error) })
  show(view({ status: 'queued' }))
  await follow(body.jobId)
}

field.addEventListener('focus', prepare, { once: true })

form.addEventListener('submit', (event) => {
  event.preventDefault()
  button.disabled = true
  ask()
    .catch(() => show({ message: refusal() }))
    .finally(() => {
      button.disabled = false
      renew()
    })
})

section.hidden = false
