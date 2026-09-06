# www

Content of [mastrocola.dev](https://mastrocola.dev), served by Azure Static Web Apps. Everything under `public/` ships to the edge on every push to `main`; pull requests get preview environments.

Hosting, DNS and rationale: [infra](https://github.com/mastrocola-dev/infra) and [ADR-002](https://github.com/mastrocola-dev/docs/blob/main/adr/002-public-site-hosting.md). This repo holds no cloud credentials — only the Static Web Apps deployment token, which can publish static content and nothing else.
