# Innovative Future Solutions — Application Security at the Edge

An interactive 20-slide application-security working session deployed to Cloudflare Workers at [innovativefuturesolutions.com](https://innovativefuturesolutions.com). Version 1.4.2 leads with qualification and Cloudflare's network differentiation, correlates each main-slide claim to a live action or exact dashboard destination, keeps plan/entitlement/configuration/evidence states separate, and closes with a two-week POC.

The guided walkthrough covers:

1. Introductions and quick qualification
2. Cloudflare's global network and single-pass control point
3. Three live applications sharing one Cloudflare edge operating model
4. Public AppSec plus private Access and Tunnel architecture
5. Security Analytics, Security Events, WAF, rate limiting, bots, API Shield, and optional Workers
6. A two-week POC and direct design-session ask
7. Five customer-safe appendix slides for evidence, TLS truth, product state, POC boundaries, and official sources

## Presenter workflow

- Select **Present** or press `P` to open the command center.
- Run preflight to check the Worker, hostname, HTTPS/TLS, WAF, bot control, Turnstile, and API inventory from public-safe live evidence.
- Use `T` for the talk timer, `F` for native fullscreen with a CSS presentation fallback, and the arrow keys to navigate.
- Use [tools/cloudflare-appsec-final-sidecar.html](tools/cloudflare-appsec-final-sidecar.html) on the presenter-only screen for slide-matched cues, dashboard filters, customer questions, checkpoints, a 30-minute timer, and locally saved discovery notes.
- Inspect public-safe Worker JSON at `/api/security-controls`; live WAF and rate actions are bounded to dedicated demo paths.
- The private sidecar and speaker notes are not included in the Worker's public asset directory.

The approved orange presentation is the default. The archived green visual treatment
is available behind the stateless `?theme=original` feature flag, for example
`https://innovativefuturesolutions.com/?theme=original#/10`. Both themes use the same
HTML, application logic, APIs, and security controls.

## Architecture

- `public/` contains the responsive, keyboard-, touch-, and numbered-rail-navigable slide deck.
- `src/index.ts` serves public-safe API and discovery routes and performs Turnstile validation.
- `docs/SPEAKER_NOTES.md` is the editable speaker-guide source; `scripts/build-speaker-notes.py` generates a local-only DOCX under `docs/`.
- Cloudflare WAF and bot controls execute before the Worker.
- Turnstile's secret and deployment control metadata are Worker secrets, never repository files.

## Local development

```sh
pnpm install
pnpm dev
```

Run all release checks:

```sh
pnpm typecheck
pnpm test
pnpm build
```

The public evidence API includes:

- `GET /api/health`
- `GET /api/security-controls`
- `GET /api/demo/preflight`
- `GET /api/demo/request-inspection`
- `GET /api/demo/profile`
- `GET /cf-demo/rate-limit`
- `POST /api/demo/login`
- `GET /api/docs`
- `GET|POST /api/mcp`
- `GET /.well-known/mcp.json`
- `GET /.well-known/agents.json`
- `GET /rss.xml`

The public deck also publishes a self-canonical URL, Open Graph and social-card metadata, linked Schema.org Organization/Person/WebSite/WebApplication entities, machine-readable freshness, explicit AI-crawler rules, and a dated XML sitemap. These surfaces are release-gated with the live AnswerReady rubric alongside the application tests.

## Deployment

Authenticate Wrangler using a scoped Cloudflare API token, then configure the required secrets without writing them to disk:

```sh
pnpm exec wrangler secret put TURNSTILE_SITE_KEY
pnpm exec wrangler secret put TURNSTILE_SECRET
pnpm exec wrangler secret put SECURITY_DEPLOYED_AT
pnpm exec wrangler secret put WAF_RULE_STATUS
pnpm exec wrangler secret put WAF_RULE_ID
pnpm exec wrangler secret put ZONE_PLAN
pnpm exec wrangler secret put BOT_POLICY_MODE
pnpm exec wrangler secret put BOT_PRODUCT_ENTITLEMENT
pnpm exec wrangler secret put BOT_SCORE_EVIDENCE
pnpm exec wrangler secret put API_DISCOVERY_STATUS
pnpm deploy
```

The zone-level WAF, bot, and API Shield controls are intentionally managed outside this repository because they belong to Cloudflare's security control plane.

## Security and demo boundaries

- The login is a verification demo. It does not create an account, credential, cookie, or session.
- `/api/demo/profile` returns explicitly synthetic public data.
- The XSS probe stays URL-encoded and is never rendered or executed.
- Public evidence truncates Cloudflare rule IDs and does not expose visitor IP addresses.
- Zone plan, product entitlement, configured control, and request-level evidence are reported separately.
- Bot scores are claimed only when the product entitlement and live score telemetry are both verified.

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.
