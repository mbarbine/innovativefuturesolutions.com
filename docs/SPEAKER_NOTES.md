# Application Security at the Edge

## Speaker Notes — Candidate-Neutral Interview Edition

**Production deck:** https://innovativefuturesolutions.com  
**Target duration:** 12–15 minutes for the core story; 5–8 minutes for selected architecture discussion  
**Core thesis:** Cloudflare changes application security by making the first enforcement point the network edge, before application code executes.

These notes are intentionally separate from the audience-facing deck. They provide an exact talk track, live action, proof point, likely follow-up, concise answer, transition, and recovery path for every slide.

## Before the interview

- Open the production deck and run **Present → Run preflight**. Confirm all seven cards are green.
- Open Cloudflare Security Analytics → Events in a separate authenticated tab, filtered to the last 30 minutes.
- Confirm the Turnstile widget reaches its ready state.
- Keep this document open on a second screen or printed. Do not expose it while screen sharing.
- Use the built-in presenter timer. The core path should land between 12 and 15 minutes.
- Test the safe API request before testing the WAF rule. This proves the Worker is available before the blocked request.
- Never show API tokens, Turnstile secrets, visitor IPs, cookies, authorization headers, or raw request bodies.
- If the Cloudflare dashboard is slow, keep moving: the browser already preserves the Ray ID and timestamp needed to find the event later.

## Run of show

1. Establish the edge-security thesis.
2. Prove the application is a live Worker on the custom domain.
3. Show managed HTTPS.
4. Explain the exact WAF expression.
5. Send a safe request, then a real blocked request.
6. Correlate the Ray ID with Security Events.
7. Explain the actual Free-plan bot control without claiming Enterprise features.
8. Complete Turnstile and show the server verdict.
9. Explore the API inventory and redacted request evidence.
10. Summarize why enforcement before application code matters.
11. Use architecture notes only when the interviewer wants deeper platform discussion.

---

# Slide 01 — Secure the app, one layer at a time

**Timing:** 30–40 seconds  
**Objective:** Establish that this is a working application and a structured security demonstration, not a static product overview.

## Say

“I’m going to secure one small application in layers. The application is this presentation itself: a TypeScript Worker, a custom domain, public-safe APIs, and a Turnstile-protected login demonstration. I’ll deploy it, prove HTTPS, block an obvious XSS probe at the WAF, correlate the block with a Security Event, add bot and human-verification controls, inspect the API surface, and finish by explaining why the edge changes the application’s risk boundary.”

“The green status ribbon is live. It is populated from the Worker and a deployment-control snapshot. When I use an architecture simulation later, I will label it as a simulation rather than pretend that every Cloudflare product is provisioned here.”

## Do

1. Open **Present**.
2. Start the timer.
3. Select **Run preflight**.
4. Pause until the seven evidence cards finish animating.

## Proof to point at

- Current Worker version and edge colo.
- Custom hostname observed by the Worker.
- Negotiated TLS version.
- WAF, Bot Fight Mode, Turnstile, and API inventory configuration status.

## Likely question

**How do I know this is not hardcoded?**

The preflight is returned by `/api/demo/preflight` on the live Worker. It combines request-specific Cloudflare properties—such as hostname, colo, protocol, and TLS—with control metadata stored as Worker secrets during deployment. The safe API and WAF steps then exercise the live request path independently.

## Transition

“First, the compute layer: what actually runs when this domain receives a request?”

## Recovery

If preflight fails, say: “The readiness call is unavailable, so I’ll validate each layer independently as we proceed.” Continue to the live Worker response on the next slide.

---

# Slide 02 — Deploy an application

**Timing:** 45–60 seconds  
**Objective:** Explain Workers accurately and prove this Worker is executing.

## Say

“Cloudflare Workers executes code in V8 isolates rather than assigning a virtual machine or language runtime process to every function. An isolate is a lightweight, isolated JavaScript context inside an already-running V8 runtime. That model reduces per-application startup and memory overhead.”

“Workers execute across Cloudflare’s global network and expose Web Standard APIs such as `Request`, `Response`, `URL`, `fetch`, streams, and Web Crypto. The design implication is important: code should treat memory as ephemeral. A Worker instance can be reused, but mutable global state is not the system of record.”

“This response is live. The service name, version, colo, TLS version, and protocol all came from the request being handled now.”

## Do

Select **Refresh live status** and point to the response card.

## Proof to point at

- `status: healthy`
- Worker service name and version
- The responding Cloudflare colo
- TLS and HTTP protocol

## Likely question

**Why V8 isolates instead of containers?**

An isolate is much lighter than a dedicated process or VM. Many isolated applications can share the V8 runtime while keeping their memory separate. That supports rapid startup and high density. The trade-off is a more constrained runtime and a stronger need to use supported Web APIs, bindings, and external state primitives deliberately.

## Transition

“Now I need the application to own a real hostname, not just a generated deployment URL.”

## Recovery

If the health card is unavailable, open `/api/health` directly. If that also fails, use the already-loaded static asset as evidence that the custom domain is resolving, but clearly state that live Worker health is degraded.

---

# Slide 03 — Configure the custom domain

**Timing:** 35–45 seconds  
**Objective:** Show how DNS, the custom hostname, and Worker routing combine.

## Say

“The apex and `www` hostnames are Worker Custom Domains. Cloudflare coordinates the DNS and certificate lifecycle and routes the hostname directly to the Worker. For this application, the Worker is the origin; there is no separate web server behind it.”

“This is more than a vanity URL. Putting the hostname on Cloudflare’s network makes the edge the first processing layer for TLS, DDoS protection, WAF policy, bot signals, API visibility, and Worker routing.”

## Do

Point from Public DNS to Nearest Cloudflare Location to Application. Mention that preflight verified the actual request host.

## Proof to point at

- Browser address bar uses `innovativefuturesolutions.com`.
- Preflight custom-domain card reports the same host.
- Both apex and `www` are configured as custom domains in Worker routing.

## Likely question

**What happens if there is also an existing origin?**

Workers can sit in front of an existing origin and selectively proxy, transform, authenticate, or cache requests. Migration does not require moving all state immediately. A common first step is moving stateless request logic and security policy to the edge while retaining the current system of record.

## Transition

“Before any application logic, the browser and Cloudflare establish an encrypted connection.”

## Recovery

If `www` is not being demonstrated, avoid claiming both hostnames from browser evidence alone. State that the apex is the active demonstration hostname and the configured control plane also includes `www`.

---

# Slide 04 — Enable HTTPS

**Timing:** 35–45 seconds  
**Objective:** Explain where TLS terminates and prove the negotiated connection.

## Say

“Cloudflare terminates TLS close to the user, presents the managed certificate, and applies request policy before Worker execution. The live request negotiated the TLS version shown here.”

“I also return HSTS, a restrictive Content Security Policy, `X-Content-Type-Options`, frame protections, a Permissions Policy, and a strict referrer policy. TLS protects the connection; the response headers reduce browser-side attack surface.”

## Do

Point to HTTPS, the live TLS value, and HSTS. If asked, open DevTools or the response headers after the main flow rather than breaking the presentation.

## Proof to point at

- HTTPS scheme and browser lock state.
- Live TLS value from `request.cf`.
- HSTS and CSP present on production responses.

## Likely question

**Does TLS at the edge mean origin traffic is unencrypted?**

Not inherently. In a conventional proxied architecture, Cloudflare can establish a separate encrypted connection to the origin. In this demo the Worker serves the application directly, so there is no second web-origin hop for the deck and APIs.

## Transition

“The transport is protected. Now I’ll stop a request based on its application-layer content.”

## Recovery

If the live TLS value is `unknown`, rely on the HTTPS connection and response headers, and state that the runtime did not expose negotiation metadata for that request.

---

# Slide 05 — Add a WAF rule

**Timing:** 50–60 seconds  
**Objective:** Explain a narrow, auditable custom rule and where it runs.

## Say

“The custom rule is intentionally narrow. It matches only `/attack-lab` when the query contains `attack=xss`, then takes the terminating Block action.”

“Custom rules run in Cloudflare’s firewall custom-rule phase. A terminating action stops the request before later application processing. That is the key architectural point: the malicious request does not have to reach application code for the application to reject it.”

“In production I would start with logging when a rule might affect legitimate traffic, examine events and false positives, then move to blocking. Here the path and signal are purpose-built for a deterministic interview demonstration.”

## Do

Point to the readable IF/AND/BLOCK expression and the truncated rule identifier.

## Proof to point at

- Control snapshot says WAF status is active.
- Public output reveals only a truncated rule ID.
- The exact demonstration target is documented by the Worker.

## Likely question

**Why not use a broad rule that blocks all script tags?**

Broad signatures create false positives and are harder to reason about. A good control has an explicit threat model, a narrow scope, observable outcomes, and a rollback path. Managed rules cover broad known attack classes; custom rules should encode application-specific intent.

## Transition

“Configuration is not proof. I’ll send two requests through the same edge.”

## Recovery

If the control snapshot is unavailable, show the WAF expression, but state that the next live 403 is the decisive proof.

---

# Slide 06 — Show the request being blocked

**Timing:** 75–90 seconds  
**Objective:** Produce the strongest live proof: same application, safe request allowed, attack request blocked before Worker execution.

## Say

“First I establish a baseline. This safe API request should return 200 and identify the Worker as the execution layer.”

“Now I send the XSS probe. The payload remains URL-encoded and is never rendered or executed. The WAF recognizes the demonstration signal and returns 403.”

“Notice the difference in the evidence console. The safe request says Worker executed. The blocked request says Cloudflare WAF custom rule and Worker not invoked. The Ray ID is the correlation handle for the next step.”

## Do

1. Select **Run safe API request**; wait for `200` and Baseline complete.
2. Select **Send XSS probe**; wait for `BLOCKED`, `403`, and a Ray ID.
3. Optionally select **Copy cURL** if the interviewer wants the exact reproducible request.
4. Open the event record.

## Proof to point at

- Baseline: HTTP 200, JSON content, Ray/request ID, Worker executed.
- Attack: HTTP 403, WAF layer, Ray ID, Worker not invoked.
- The browser preserves the Ray ID and observation time in session storage only.

## Likely question

**How can you prove the Worker was not invoked for the blocked request?**

The response is Cloudflare’s WAF block page rather than the Worker’s standard JSON envelope and security headers. The request also appears as a WAF Custom rules event. The Worker route has no handler for `/attack-lab`; an allowed request would fall through to a static-asset 404 instead of producing this WAF 403.

## Transition

“A block without investigation evidence is operationally incomplete, so I’ll follow the Ray ID.”

## Recovery

If the attack returns anything other than 403, do not call it blocked. Verify the exact encoded query, refresh the control snapshot, and say the rule needs investigation. If the safe request fails, diagnose application availability before interpreting the WAF result.

---

# Slide 07 — Show the Security Event

**Timing:** 50–60 seconds  
**Objective:** Connect enforcement with incident investigation and operational evidence.

## Say

“The Ray ID connects the browser-visible block to Cloudflare Security Events. The event records the action, source security feature, host, path, query, time, and rule.”

“I keep sensitive event fields inside the authenticated dashboard. This public deck does not expose the visitor IP or account details. The copy-evidence action produces only the host, path, action, Ray ID, and timestamp.”

## Do

1. Point to the Ray ID carried forward from the previous slide.
2. Open Cloudflare Security Events in the prepared tab.
3. Filter or search using the Ray ID without the colo suffix if necessary.
4. Expand the event and show Block → Custom rules, host, path, and rule.

## Proof to point at

- Exact Ray ID correlation.
- Timestamp alignment.
- Action is Block.
- Source is Custom rules.
- Path is `/attack-lab`.

## Likely question

**How would you operationalize this beyond the dashboard?**

Export security events to the organization’s logging or SIEM workflow, preserve correlation identifiers across application logs, create alerts for meaningful thresholds, and attach a clear owner and response playbook. Sampling and plan availability matter, so the design should state what evidence is guaranteed versus sampled.

## Transition

“The WAF handled an obvious payload. Automated traffic needs a different class of signals.”

## Recovery

If the event has not appeared yet, keep the Ray ID on screen and continue. Say: “The enforcement proof is the live 403; dashboard indexing is asynchronous, and the Ray ID lets me retrieve the event when it arrives.”

---

# Slide 08 — Add bot protection

**Timing:** 40–50 seconds  
**Objective:** Explain the configured control and distinguish it from higher-plan capabilities.

## Say

“This zone is on the Free plan, so the real configured control is Bot Fight Mode. It is an on/off control that challenges traffic matching patterns of known bots. It is not the same as Enterprise Bot Management.”

“Enterprise Bot Management produces a score from 1 to 99 and supports rules based on that score. Super Bot Fight Mode adds more configurable categories on eligible plans. I am naming those distinctions because security demonstrations lose credibility when they claim controls the account does not actually have.”

## Do

Point to the live mode and the plan-aware note. Let the radar animation support the explanation, but call it a visualization—not a live per-request bot score.

## Proof to point at

- Control snapshot reports `bot-fight-mode`.
- Preflight confirms the mode is configured.
- The slide explicitly states that Enterprise score rules are unavailable here.

## Likely question

**When would you use Turnstile instead of bot scoring?**

Bot controls evaluate automated traffic broadly at the edge. Turnstile is useful at a sensitive interaction—login, signup, password reset, checkout, or form submission—where the application needs a server-verifiable proof before accepting the action. They are complementary layers.

## Transition

“For the login interaction, I want proof tied to one specific action.”

## Recovery

Do not infer a bot decision from the radar. If the control snapshot is unavailable, describe the configured intent but mark live status as unknown.

---

# Slide 09 — Add Turnstile to login

**Timing:** 60–75 seconds  
**Objective:** Demonstrate human verification with mandatory server-side validation and an honest no-session boundary.

## Say

“Turnstile is not complete when the browser widget turns green. The widget gives the browser a short-lived token. The Worker must send that token to Cloudflare Siteverify and accept the action only when the server response says it is valid.”

“The site key is public by design. The secret remains a Worker secret and never enters browser JavaScript or this repository. This endpoint deliberately creates no account, password, cookie, or session; it demonstrates verification without pretending to be a complete identity system.”

## Do

1. Complete the Turnstile interaction.
2. Submit the demo username.
3. Wait for: “Human verification succeeded.”
4. Emphasize the no-account/no-session result.

## Proof to point at

- Widget reaches success state.
- Worker calls Siteverify server-side.
- API returns `verified: true` only after Cloudflare accepts the token.
- Token is reset after submission.

## Likely question

**What else would a production login need?**

Credential or identity-provider verification, secure session issuance, CSRF protection where cookies are used, rate limiting, account lockout and recovery controls, audit logging, secure cookie attributes, and risk-based monitoring. Turnstile reduces automated abuse; it does not replace authentication or authorization.

## Transition

“The login is one API operation. Next I’ll show how I make the whole API surface visible and testable.”

## Recovery

If the widget cannot load, show `/api/config` to prove the public site key is configured and explain the server-side route. Do not claim a successful verification unless Siteverify actually returns success.

---

# Slide 10 — API Discovery and API Gateway

**Timing:** 60–75 seconds  
**Objective:** Show intended API inventory, live endpoint behavior, redaction, and Cloudflare API Shield boundaries.

## Say

“You cannot secure an API surface you cannot see. API Discovery observes traffic and normalizes similar paths. Endpoint Management stores the operations the team chooses to manage. The OpenAPI contract represents intended behavior; observed traffic can reveal undocumented or shadow APIs.”

“This inventory has seven declared operations. I can execute each public GET operation from the slide and see the HTTP status, Ray ID, and public-safe JSON. The request-inspection endpoint proves the Worker saw the hostname, path, protocol, TLS, and colo while intentionally excluding IP addresses, cookies, credentials, and bodies.”

“One current limitation is important: Endpoint Management is available on all plans, but performance metrics may not populate for Worker-handled routes because there is no conventional origin timing to measure.”

## Do

Run these operations in order:

1. `/api/health`
2. `/api/demo/preflight`
3. `/api/demo/request-inspection`
4. `/api/security-controls` if time permits

## Proof to point at

- Live status and Ray/request ID for each request.
- Seven declared operations.
- Redacted inspection response.
- OpenAPI document linked from the slide.

## Likely question

**What would you add for a sensitive production API?**

Schema validation, rate limiting, strong authentication such as JWT validation or mTLS where appropriate, authorization inside the application, sequence and abuse detection, sensitive-data controls, consistent error envelopes, and logs that preserve correlation without leaking credentials or personal data.

## Transition

“The individual controls now form one request pipeline. I’ll summarize that pipeline before discussing broader platform architecture.”

## Recovery

If an explorer call fails, open the endpoint directly. If API Shield metrics are empty, explain the documented Worker limitation rather than describing the endpoint as undiscovered.

---

# Slide 11 — How Cloudflare protects the application

**Timing:** 50–60 seconds  
**Objective:** Synthesize the demonstration into one edge-enforcement model.

## Say

“The visitor reaches Cloudflare before reaching application code. Cloudflare terminates TLS, applies DDoS protections, evaluates WAF policy, applies bot controls, validates Turnstile where the application requests it, and builds API visibility. Only allowed requests invoke the Worker.”

“That changes both security and performance. Rejected traffic consumes edge capacity rather than application capacity. Allowed traffic carries Cloudflare context into code executing near the user. The application still owns authorization, validation, business logic, data protection, and safe failure behavior; the edge is a powerful enforcement layer, not an excuse to remove application security.”

## Do

Trace the diagram left to right and end on “Blocked traffic never reaches application code.”

## Proof to point at

- Safe request reached Worker and returned 200.
- WAF request stopped with 403 before Worker.
- Turnstile required a server verdict.
- API requests exposed Ray IDs and redacted edge context.

## Likely question

**What is the biggest operational risk in moving logic to the edge?**

Distributed execution changes assumptions about state, observability, testing, and rollbacks. Code must not depend on process-local mutable state. Logs and traces need correlation. Deployments need staged validation and fast rollback. Data placement and consistency must be chosen explicitly.

## Transition

“That leads to the first architecture question: where should state live?”

## Recovery

This slide is the fallback conclusion. If time is short, stop here after restating the core thesis. The next three slides are optional depth.

---

# Slide 12 — Choose state by consistency

**Timing:** 60–90 seconds  
**Objective:** Demonstrate reasoning through Cloudflare data services instead of reciting a product list.

## Say

“The first question is not ‘Which database is fastest?’ It is ‘What invariant must the system preserve?’ The decision lab maps workloads to the property that matters.”

“KV optimizes globally distributed reads and accepts eventual consistency. Durable Objects provide one authoritative, strongly consistent coordination point per object identity. D1 provides serverless relational data with SQLite semantics. R2 stores object bytes through an S3-compatible API without egress fees. Hyperdrive accelerates connections to an existing PostgreSQL or MySQL database and can reduce migration risk.”

## Do

Select two contrasting scenarios:

1. **Feature flags** → KV.
2. **Multiplayer room** → Durable Objects.

If asked, also demonstrate customer records → D1, media → R2, and existing PostgreSQL → Hyperdrive.

## Proof to point at

This is explicitly an architecture decision simulation. The highlighted recommendation comes from the selected workload; it is not a claim that these services are provisioned in this demo.

## Likely question

**When would you use Durable Objects instead of KV?**

Use KV when read speed and global distribution matter more than immediate consistency. Use a Durable Object when concurrent requests must coordinate around one authoritative state—for example, a room, lock, limiter, collaborative document, or leader. A balance or inventory decrement should not rely on eventually consistent KV.

## Transition

“After choosing state, I keep expensive or failure-prone work off the latency-sensitive request path.”

## Recovery

If the decision lab does not animate, explain the same invariant manually: read distribution, coordination, relational queries, object bytes, or existing data gravity.

---

# Slide 13 — Async, AI, retrieval, and browser work

**Timing:** 60–90 seconds  
**Objective:** Explain how bindings and asynchronous design turn the edge into an application platform.

## Say

“The request path should do the minimum work needed to return a trustworthy response. If a task is expensive, slow, or failure-prone, acknowledge it and move it behind a queue.”

“Queues provides at-least-once delivery, so consumers must be idempotent. Workers AI provides managed inference. Vectorize stores and queries embeddings for semantic search and retrieval-augmented generation. Browser Run provides managed headless browser execution for screenshots, PDFs, testing, scraping, and agent workflows.”

“Bindings are the connective tissue. The Worker receives a capability through its environment rather than sending platform credentials to browser code.”

## Do

Select **Animate request path**. Narrate each highlighted step. Explicitly state that this is a platform architecture simulation and these services are not all provisioned by this demo.

## Proof to point at

- The simulation label prevents a false deployment claim.
- Each step explains its contract and failure model.
- The live application itself demonstrates the Worker and Turnstile bindings pattern.

## Likely question

**Why put AI behind a queue?**

Not every inference belongs behind a queue. Interactive inference may remain on the request path when latency and limits are acceptable. Batch enrichment, document processing, retries, fan-out, and long-running generation benefit from asynchronous delivery, idempotency, backpressure, and explicit job status.

## Transition

“Finally, I would not pitch this as ‘replace every regional service.’ I would migrate from the dominant constraint.”

## Recovery

If the animation is interrupted, select it again. Reduced-motion preferences intentionally compress the timing while preserving the sequence.

---

# Slide 14 — Edge first, not edge only

**Timing:** 60–90 seconds  
**Objective:** Give a nuanced Workers-versus-regional-serverless answer and an incremental migration plan.

## Say

“Workers and AWS Lambda solve overlapping but not identical problems. Workers uses V8 isolates and global edge placement for latency-sensitive request logic. Lambda is region-oriented and fits deeply AWS-native backends, broader managed runtimes, and workloads coupled to regional services.”

“I would not begin with a brand-level replacement plan. I would identify the dominant constraint. For latency, move routing, authentication, transformation, and security policy to Workers. For coordinated shared state, choose Durable Objects or another strongly consistent system. For AWS data gravity, keep the system of record and move the request path first. For long jobs, return quickly and use a queue.”

“The migration sequence is: establish observability, move stateless edge logic, preserve the system of record, select new state primitives only where their consistency model fits, move slow work behind queues, and compare real latency, reliability, cost, and operational load.”

## Do

Choose the constraint that best matches the interviewer’s question. Let the decision output produce the concise migration recommendation.

## Proof to point at

The comparison names runtime, placement, routing, and best fit without claiming that one platform universally replaces the other.

## Likely question

**How would you troubleshoot a distributed application during migration?**

Start with one user-visible failure and preserve a correlation ID across edge and regional services. Check whether the request was blocked, allowed, routed, retried, or queued. Compare timestamps and deployment versions, validate state and cache assumptions, inspect dependency latency, reproduce with a minimal request, and roll back the smallest recent change when evidence points to it. Keep browser, edge, application, queue, and data-store evidence distinct.

## Close

“The through-line is deliberate boundaries. Enforce what the network knows at the edge, keep application authorization and business invariants in code, choose data services from consistency requirements, move unreliable work off the request path, and preserve evidence across every layer.”

## Recovery

If time is over, skip the decision buttons and use the close verbatim.

---

# Fast Q&A reference

## Workers versus Lambda

Workers emphasizes V8 isolates, Web APIs, and global edge execution. Lambda emphasizes regional execution, multiple managed runtimes and container packaging options, and deep integration with AWS regional services. Choose from latency, runtime requirements, data gravity, operational model, compliance, and failure modes.

## KV versus Durable Objects

KV is read-optimized and eventually consistent. Durable Objects provide a single coordination point with strongly consistent storage for an object identity.

## D1 versus an existing PostgreSQL database

D1 fits serverless relational application data with SQLite semantics. Keep PostgreSQL when it is the established system of record or requires features and operational patterns the application already depends on; use Hyperdrive where it improves connection behavior and latency.

## R2 value proposition

R2 is S3-compatible object storage without egress fees. It fits uploads, media, backups, build artifacts, datasets, and browser-rendering output.

## Queue delivery guarantee

Design consumers for at-least-once delivery. Make processing idempotent, define retry and dead-letter behavior, and expose job state rather than assuming exactly-once side effects.

## Security ownership boundary

Cloudflare can enforce TLS, DDoS, WAF, bot, rate, API, and request-routing policy at the edge. The application still owns authorization, input handling, business invariants, secrets, data protection, dependency safety, and secure failure behavior.

## Evidence boundary

Never convert a configured snapshot into a claim about a specific request. Use request-specific evidence for request claims: status, Ray ID, server verdict, and Security Event. Use configuration evidence for control-presence claims. Label architecture diagrams as simulations unless the services are truly provisioned.

# Official reference links

- Workers runtime: https://developers.cloudflare.com/workers/reference/how-workers-works/
- WAF Security Events: https://developers.cloudflare.com/waf/analytics/security-events/
- Security feature order: https://developers.cloudflare.com/waf/feature-interoperability/
- API Shield Endpoint Management: https://developers.cloudflare.com/api-shield/management-and-monitoring/endpoint-management/
- API Discovery: https://developers.cloudflare.com/api-shield/security/api-discovery/
- Durable Objects: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
- Workers KV: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/how-r2-works/
- Hyperdrive: https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/
- Queues: https://developers.cloudflare.com/queues/reference/how-queues-works/
- Workers AI: https://developers.cloudflare.com/workers-ai/
- Vectorize: https://developers.cloudflare.com/vectorize/
- Browser Run: https://developers.cloudflare.com/browser-run/get-started/
