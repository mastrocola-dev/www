# www

Content of [mastrocola.dev](https://mastrocola.dev), served by Azure Static Web Apps. Everything under `public/` ships to the edge on every push to `main`; pull requests get preview environments.

Hosting, DNS and rationale: [infra](https://github.com/mastrocola-dev/infra) and [ADR-002](https://github.com/mastrocola-dev/docs/blob/main/adr/002-public-site-hosting.md). This repo holds no secrets: the pipeline authenticates as `id-www` via OIDC and fetches the Static Web Apps deployment token at deploy time ([ADR-006](https://github.com/mastrocola-dev/docs/blob/main/adr/006-identity-and-secrets.md)). Required repository variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `STATIC_WEB_APP_NAME`.

## ADR index

The "How this site runs" section is not part of the deploy. At page load, `public/main.js` fetches [`index/adrs.json`](https://github.com/mastrocola-dev/docs/blob/main/index/adrs.json) from `docs`, where the [`adr-index`](https://github.com/mastrocola-dev/service-agent/tree/main/agents/adr-index) agent writes it on every pull request that changes an ADR ([ADR-005](https://github.com/mastrocola-dev/docs/blob/main/adr/005-agent-generated-content.md)). A merged ADR shows up on reload, within the five-minute cache of `raw.githubusercontent.com`.

- The index is model output, treated as untrusted: `public/adr-index.js` accepts only known statuses, `ADR-NNN` ids and `adr/NNN-slug.md` paths, and `main.js` inserts text as text, never as markup
- The Content Security Policy in `staticwebapp.config.json` allows no inline scripts and, for this section, `connect-src` to `raw.githubusercontent.com` only
- If the fetch fails or the index is empty, the section stays hidden and the page remains the static landing page

## Question box

"Ask how it works" sends a visitor's question to the agent runtime of [ADR-007](https://github.com/mastrocola-dev/docs/blob/main/adr/007-agent-runtime.md) through [`service-api`](https://github.com/mastrocola-dev/service-api): `POST /jobs`, then `GET /jobs/{id}` every 1.5 seconds until the job ends or three minutes pass. `public/ask.js` turns each reply into what the page shows and is the only part with logic; `public/ask-form.js` wires it to the page.

- Nothing third-party loads until the field gains focus. That first focus loads Turnstile, which solves its challenge while the visitor types and shows nothing unless it needs interaction, and calls `POST /warm` so the idle queue path wakes up meanwhile. A token is spent by one question; the widget is reset after each
- The answer is model output, treated as untrusted like the index: inserted as text, never as markup. Source links are built here, only for `adr/`, `architecture/` and `runbooks/` paths ending in `.md`; anything else is dropped. An answer flagged out of scope is replaced by a fixed message
- The wait is shown, not hidden: queued, then the agent's latest step, mapped from tool names to fixed phrases — a name the page does not know never reaches the screen
- Each refusal of the api has its own message: invalid question, failed challenge, busy, daily quota, daily budget
- Reloading the page abandons the question; nothing is kept in the browser
- The Content Security Policy adds exactly three origins: `challenges.cloudflare.com` for the Turnstile script and its frame, and `api.mastrocola.dev` for `connect-src`
- The Turnstile site key in `ask.js` is public by design; the secret lives in Key Vault and only `service-api` reads it. The widget accepts `mastrocola.dev` and `www.mastrocola.dev`, and the api answers browsers from those origins only, so the box does not work in pull request previews

## Develop

```sh
npm ci
npm test
npm run fix
```

Plain JavaScript modules, served as they are: the browser runs `public/` directly, so there is no build and no TypeScript. Biome and `node:test` follow the conventions of [ADR-004](https://github.com/mastrocola-dev/docs/blob/main/adr/004-typescript-without-build.md).
