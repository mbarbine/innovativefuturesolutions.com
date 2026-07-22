# Innovative Future Solutions — Application Security at the Edge

An interactive slide deck and live application-security demonstration deployed to Cloudflare Workers at [innovativefuturesolutions.com](https://innovativefuturesolutions.com). Version 1.2.0 adds a presenter command center, live readiness preflight, an executable API inventory, architecture decision labs, and a separate interview speaker guide.

The guided walkthrough covers:

1. Worker deployment
2. Custom Domains
3. Managed HTTPS
4. A Cloudflare WAF custom rule
5. A live blocked XSS probe
6. Cloudflare Security Event evidence
7. Bot Fight Mode on the zone's current plan
8. Turnstile with mandatory server-side Siteverify validation
9. API Shield Endpoint Management and an OpenAPI contract
10. The request path through Cloudflare's edge

Three architecture notes follow the live demo:

- Choosing between Workers KV, Durable Objects, D1, R2, and Hyperdrive based on consistency and data shape
- Moving asynchronous, AI, retrieval, and browser work to Queues, Workers AI, Vectorize, and Browser Run
- Reasoning through Cloudflare Workers versus regional serverless and planning an incremental migration

## Presenter workflow

- Select **Present** or press `P` to open the command center.
- Run preflight to check the Worker, hostname, HTTPS/TLS, WAF, bot control, Turnstile, and API inventory from public-safe live evidence.
- Use `T` for the talk timer, `F` for fullscreen, and the arrow keys to navigate.
- Execute public GET operations directly from the API Discovery slide and inspect the status, Ray/request ID, and redacted JSON response.
- Download the generated [speaker notes](https://innovativefuturesolutions.com/downloads/cloudflare-application-security-speaker-notes.docx) from the command center.

The storage, async/AI, and migration interactions are labeled architecture simulations. They explain selection criteria and trade-offs without claiming that optional platform services are provisioned by this demo.

## Architecture

- `public/` contains the responsive, keyboard-, touch-, and numbered-rail-navigable slide deck.
- `src/index.ts` serves public-safe API and discovery routes and performs Turnstile validation.
- `docs/SPEAKER_NOTES.md` is the editable speaker-guide source; `scripts/build-speaker-notes.py` generates the downloadable DOCX.
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
- `POST /api/demo/login`
- `GET /api/docs`

## Deployment

Authenticate Wrangler using a scoped Cloudflare API token, then configure the required secrets without writing them to disk:

```sh
pnpm wrangler secret put TURNSTILE_SITE_KEY
pnpm wrangler secret put TURNSTILE_SECRET
pnpm wrangler secret put SECURITY_DEPLOYED_AT
pnpm wrangler secret put WAF_RULE_STATUS
pnpm wrangler secret put WAF_RULE_ID
pnpm wrangler secret put BOT_POLICY_MODE
pnpm wrangler secret put API_DISCOVERY_STATUS
pnpm deploy
```

The zone-level WAF, bot, and API Shield controls are intentionally managed outside this repository because they belong to Cloudflare's security control plane.

## Security and demo boundaries

- The login is a verification demo. It does not create an account, credential, cookie, or session.
- `/api/demo/profile` returns explicitly synthetic public data.
- The XSS probe stays URL-encoded and is never rendered or executed.
- Public evidence truncates Cloudflare rule IDs and does not expose visitor IP addresses.
- Enterprise Bot Management scoring is not claimed on the current Free zone; the live control is Bot Fight Mode.

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.
