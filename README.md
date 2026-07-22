# Innovative Future Solutions — Application Security at the Edge

An interactive slide deck and live application-security demonstration deployed to Cloudflare Workers at [innovativefuturesolutions.com](https://innovativefuturesolutions.com).

The walkthrough covers:

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

## Architecture

- `public/` contains the responsive, keyboard- and touch-navigable slide deck.
- `src/index.ts` serves public-safe API and discovery routes and performs Turnstile validation.
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
