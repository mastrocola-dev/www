# www

Content of [mastrocola.dev](https://mastrocola.dev), served by Azure Static Web Apps. Everything under `public/` ships to the edge on every push to `main`; pull requests get preview environments.

Hosting, DNS and rationale: [infra](https://github.com/mastrocola-dev/infra) and [ADR-002](https://github.com/mastrocola-dev/docs/blob/main/adr/002-public-site-hosting.md). This repo holds no secrets: the pipeline authenticates as `id-www` via OIDC and fetches the Static Web Apps deployment token at deploy time ([ADR-006](https://github.com/mastrocola-dev/docs/blob/main/adr/006-identity-and-secrets.md)). Required repository variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `STATIC_WEB_APP_NAME`.

## ADR index

The "How this site runs" section is not part of the deploy. At page load, `public/main.js` fetches [`index/adrs.json`](https://github.com/mastrocola-dev/docs/blob/main/index/adrs.json) from `docs`, where the [`adr-index`](https://github.com/mastrocola-dev/service-agent/tree/main/agents/adr-index) agent writes it on every pull request that changes an ADR ([ADR-005](https://github.com/mastrocola-dev/docs/blob/main/adr/005-agent-generated-content.md)). A merged ADR shows up on reload, within the five-minute cache of `raw.githubusercontent.com`.

- The index is model output, treated as untrusted: `public/adr-index.js` accepts only known statuses, `ADR-NNN` ids and `adr/NNN-slug.md` paths, and `main.js` inserts text as text, never as markup
- The Content Security Policy in `staticwebapp.config.json` limits `connect-src` to `raw.githubusercontent.com` and allows no inline scripts
- If the fetch fails or the index is empty, the section stays hidden and the page remains the static landing page

## Develop

```sh
npm ci
npm test
npm run fix
```

Plain JavaScript modules, served as they are: the browser runs `public/` directly, so there is no build and no TypeScript. Biome and `node:test` follow the conventions of [ADR-004](https://github.com/mastrocola-dev/docs/blob/main/adr/004-typescript-without-build.md).
