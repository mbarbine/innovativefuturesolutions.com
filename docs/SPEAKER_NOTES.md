# Application Security at the Edge

## Solutions Engineer Roleplay Runbook — Private Presenter Edition

**Production deck:** https://innovativefuturesolutions.com
**Target duration:** 30-minute customer conversation followed by 15-minute Q&A
**Stage clock:** 5 minutes discovery · 5 minutes business case · 17 minutes technical proof · 3 minutes POC close
**Core thesis:** Cloudflare moves security, performance, and control to the first request-processing layer, reducing application exposure while simplifying how teams operate the path to their applications.

These private notes are intentionally separate from the audience-facing deck. The Innovative Future Solutions application remains the driving visual; this document supplies the discovery, qualification, business framing, customer-language branches, live actions, proof points, portal navigation, POC close, and Q&A depth behind it.

## Before the interview

- Open the production deck and run **Present → Run preflight**. Confirm all eight cards are green.
- Open Cloudflare **Security → Analytics → Events** in a separate authenticated tab, filtered to the last 30 minutes.
- Open **Security → WAF → Rate limiting rules** in another tab, with the isolated burst-control rule visible.
- Confirm the Turnstile widget reaches its ready state.
- Keep this document open on a second screen or printed. Do not expose it while screen sharing.
- Use the built-in presenter timer. Start it only when the customer conversation begins; use the stage gates below to recover time.
- Test the safe API request before testing the WAF rule. This proves the Worker is available before the blocked request.
- Test the controlled burst only after its previous 10-second mitigation window has expired.
- Never show API tokens, Turnstile secrets, visitor IPs, cookies, authorization headers, or raw request bodies.
- If the Cloudflare dashboard is slow, keep moving: the browser already preserves the Ray ID and timestamp needed to find the event later.
- Keep the current plan boundary explicit: Bot Fight Mode, Endpoint Management, and the custom rate-limit rule are live; Enterprise Bot Management scores and API Discovery are described as the POC extension, not claimed as active.

## Run of show

1. **00:00–01:00 — Lead the call.** Introduce yourself, acknowledge the AE’s unexpected absence, frame the customer outcome, and ask permission to begin with discovery.
2. **01:00–05:00 — Discover and qualify.** Ask three open questions, listen, reflect the answer, and choose one primary business outcome.
3. **05:00–10:00 — Build the business case.** Translate the discovered pain into availability, loss avoidance, engineering velocity, consolidation, and evidence—not a feature list.
4. **10:00–27:00 — Prove the architecture.** Use the live deck: Worker, hostname, TLS, WAF, 200→403, Security Event, bot control, Turnstile, Endpoint Management, and 200→429 burst control.
5. **27:00–30:00 — Earn the next step.** Recap in the customer’s words, propose a tightly scoped POC with measurable success criteria, confirm stakeholders, and ask for the design session.
6. **30:00–45:00 — Q&A.** Answer directly, distinguish live evidence from Enterprise extensions, then bridge each answer back to the customer’s stated outcome.

---

# Stage 1 — Lead the call and run discovery

**Clock:** 00:00–05:00
**Screen:** Keep Slide 01 visible. Do not advance while the customer is speaking.
**Goal:** Establish executive presence, uncover one costly problem, identify a technical constraint, and define a measurable next step.

## Exact opening

“Thank you for making the time. I’m Michael, the Solutions Engineer supporting this conversation. Our AE is unexpectedly unavailable, so I’ll make sure we still use the time well. I can cover enough of the business context to keep us moving, and I’ll capture anything commercial that needs a precise follow-up.”

“My proposal is to spend five minutes understanding how you expose and protect applications today, five minutes aligning on the business outcome, and then use this live Innovative Future Solutions application to prove the request path. I’ll leave the last few minutes to agree on whether a focused proof of concept is warranted. Does that work for you?”

## Ask these three questions

1. **Current state:** “Walk me through what happens today when a new public application or API goes live—from DNS and onboarding through security policy, observability, and incident response.”
2. **Pain and impact:** “Where is the cost showing up most: customer-impacting attacks, origin instability, release friction, false positives, tool sprawl, or lack of API visibility—and what happens to the business when that problem occurs?”
3. **Decision and success:** “If we ran a proof of concept, what would have to be measurably better in 30 days for you to call it successful, and who else would need confidence in the result?”

After each answer, pause. Do not rescue the silence. Reflect one sentence before the next question: “What I heard is ___, and the consequence is ___; have I got that right?”

## Qualification notes to capture

- **Pain:** What is broken, expensive, slow, risky, or politically difficult?
- **Impact:** Revenue, availability, customer trust, response time, staffing, audit exposure, or delivery velocity.
- **Urgency:** What event, renewal, launch, incident, audit, or architecture change creates a clock?
- **Current controls:** CDN, DNS, WAF, bot tooling, API gateway, SIEM, origin allowlisting, identity, and ownership boundaries.
- **Decision process:** Technical owner, security approver, economic buyer, procurement, and implementation team.
- **Success metric:** One or two measures that can be observed during a POC.
- **Constraint:** Change window, DNS authority, compliance, data residency, origin topology, or fear of false positives.

## Persona branches

### If the CISO leads

Ask: “Which application-security risk is least visible today?” Then probe false positives, shadow APIs, incident evidence, control consistency, auditability, and business interruption. Frame value as reduced exposure, faster decisions, provable enforcement, and fewer disconnected control planes.

### If the Head of Infrastructure leads

Ask: “What does the origin have to absorb today that you wish it never saw?” Then probe DDoS, TLS operations, latency, multi-cloud routing, egress, capacity planning, origin bypass, and rollback. Frame value as a globally distributed first hop, origin preservation, simpler routing, and staged migration.

### If the DevOps or application lead leads

Ask: “Where does security create deployment friction for your team?” Then probe policy ownership, CI/CD, rule tuning, exception handling, debugging, schema drift, login abuse, and observability. Frame value as security outside application code, programmable integration, safer defaults, and shared evidence.

## What a strong discovery sounds like

“You’ve told me the immediate problem is credential abuse against login, but the larger cost is that three teams use different controls and no one can correlate a block to an application release. I’ll prioritize three things in the demo: stopping abuse before code, preserving a traceable decision, and showing how the same edge layer can cover the API surface. I’ll leave advanced platform services for Q&A unless they help that outcome.”

## Time recovery

If answers consume the full five minutes, that is a successful discovery—not a failure. Compress the business case to three minutes and skip Slides 12–14. Never speed through the customer’s answer to protect slide count.

---

# Stage 2 — Business case and strategic vision

**Clock:** 05:00–10:00
**Screen:** Remain on Slide 01; use the live status ribbon as the visual proof that one platform is already serving and protecting the application.
**Goal:** Make the “why” explicit before demonstrating the “what.”

## Reflect before presenting

“Based on what you shared, I’m going to anchor this around **[their outcome]**. The technical symptoms are **[their symptoms]**, but the business issue is **[impact]**. The architecture I want to test is whether placing one programmable enforcement layer before the application can reduce that impact without making delivery slower.”

## Five business-value moves

1. **Protect revenue and trust.** Stop abusive or malicious traffic before it consumes application capacity or reaches fragile code paths.
2. **Reduce operational drag.** Apply DNS, TLS, DDoS, WAF, bot, API, and edge-compute controls on the same request path instead of stitching together serial appliances.
3. **Increase engineering velocity.** Keep common controls outside each codebase while preserving application-specific policy and programmable escape hatches.
4. **Improve evidence.** Correlate the decision, action, timestamp, path, and Ray ID so security and application teams investigate the same event.
5. **Migrate incrementally.** Put Cloudflare in front first; move stateless logic or selected workloads only where the economics and architecture support it.

## Strategic framing

“This is not a WAF replacement exercise in isolation. It is a request-path decision. Cloudflare’s network becomes the first place where the organization can encrypt, absorb, classify, enforce, observe, and—when useful—execute code. The business value comes from consolidating those decisions on one globally distributed platform while reducing what the origin must handle.”

“The proof I’m about to show is intentionally small and deterministic. The customer version of this would start in log or challenge mode, use your normal traffic to establish a baseline, and move to block only after the application owner accepts the false-positive rate.”

## Map the story to the discovered priority

- **If availability is primary:** Emphasize DDoS, edge termination, rate limiting, and less origin work.
- **If account abuse is primary:** Emphasize bot signals, Turnstile, login-specific rate limiting, and step-up friction.
- **If API risk is primary:** Emphasize Endpoint Management, intended schema, discovery gap, and per-endpoint policy.
- **If tool sprawl is primary:** Emphasize one request path, shared policy, shared evidence, and fewer handoffs.
- **If delivery speed is primary:** Emphasize Workers, Web APIs, bindings, staged migration, and policy outside the app.

## Transition into proof

“Rather than ask you to accept that architecture as a diagram, I built the presentation as the application. Every control in the core path acts on the same hostname you’re looking at. Let’s start with onboarding and then prove two decisions at the edge: a 403 for an attack and a 429 for abusive request volume.”

---

# Stage 3 — Technical demo clock and decision points

**Clock:** 10:00–27:00
**Goal:** Prove the request path. Use the detailed slide notes that follow for exact language, questions, and recovery.

## Core timing map

1. **Slide 01 / Preflight — 45 seconds:** Run eight checks; set the evidence standard.
2. **Slide 02 / Worker — 75 seconds:** Explain onboarding choice and prove runtime execution.
3. **Slide 03 / Custom domain — 60 seconds:** Explain DNS, proxying, custom domain, and rollback.
4. **Slide 04 / HTTPS — 45 seconds:** Show TLS and security headers.
5. **Slide 05 / WAF rule — 75 seconds:** Explain the narrow expression and rollout method.
6. **Slide 06 / 200→403 — 90 seconds:** Run baseline then attack; capture Ray ID.
7. **Slide 07 / Security Event — 90 seconds:** Correlate the decision in the dashboard.
8. **Slide 08 / Bots — 75 seconds:** Show the real Free-plan control; explain the Enterprise score extension.
9. **Slide 09 / Turnstile — 90 seconds:** Complete widget and server-side Siteverify.
10. **Slide 10 / API + 200→429 — 120 seconds:** Run a normal operation, then the bounded burst.
11. **Slide 11 / Edge architecture — 60 seconds:** Synthesize the path using the customer’s priority.

Slides 12–14 are optional technical depth. Use them only if a stakeholder asks about state, asynchronous work, AI, AWS coexistence, or migration. Skipping them demonstrates control of time.

## Onboarding story—what was actually done

1. Added the zone to Cloudflare and activated Cloudflare as authoritative DNS.
2. Built a TypeScript Worker that serves the deck, API endpoints, security headers, and Turnstile verification.
3. Attached Worker Custom Domains for the apex and `www`; Cloudflare coordinates DNS routing and certificate issuance.
4. Added a narrow zone-level WAF custom rule for the lab path.
5. Enabled Bot Fight Mode, the control available on this Free-plan zone.
6. Created a Turnstile widget and stored the secret only as a Worker secret; the browser receives only the site key.
7. Added the declared API operations to API Shield Endpoint Management and published OpenAPI 3.1 documentation.
8. Added one zone-level rate-limiting rule scoped only to `/api/demo/burst-control`: five requests per 10 seconds, 10-second block.

## Why this method

“The Worker is the origin for this demo because it makes every proof deterministic: if a request receives the Worker’s JSON, code ran; if it receives the WAF 403 or rate-limit 429, the edge acted first. For a customer with an existing origin, I would usually start by proxying the current application, preserve the system of record, and introduce controls in observe-first stages.”

## The evidence hierarchy

1. **Browser outcome:** User-visible 200, 403, or 429.
2. **Response metadata:** Ray ID, request ID, TLS, colo, and security headers.
3. **Worker output:** Proves application code executed.
4. **Cloudflare event:** Proves which edge rule acted and why.
5. **Control configuration:** Proves the intended policy exists and is enabled.

Never present a configuration screenshot as proof of enforcement. Pair policy with an actual request and event.

---

# Stage 4 — POC close and next-step ask

**Clock:** 27:00–30:00
**Screen:** Slide 11. If needed, return to Slide 01 for the live status ribbon.
**Goal:** Convert technical interest into a qualified, mutual next step.

## Recap in the customer’s words

“You started by telling me **[pain]** is creating **[impact]**. In this demo we put the control before the application, proved a content-based block, preserved the event evidence, verified a human at login without creating a session, inventoried the API surface, and stopped abusive request volume before Worker code. The question is whether that same pattern can improve **[their success metric]** on one of your applications.”

## Proposed POC scope

- One representative production-like hostname and two to five high-value API or login endpoints.
- Their current origin remains in place; Cloudflare is introduced with an agreed rollback method.
- Baseline traffic and false-positive review before terminating actions.
- DDoS/TLS, one managed or custom WAF use case, bot or Turnstile protection, API inventory, and one endpoint-specific rate limit.
- Log and Security Event access for both security and application owners.
- Optional Enterprise extensions only if entitled: Bot Management scores, API Discovery, schema validation enforcement, mTLS, advanced rate limiting, Logpush, or SIEM integration.

## Measurable success criteria

- Selected traffic is correctly proxied through Cloudflare with no critical functional regressions.
- A safe baseline remains available while an agreed malicious request is blocked before origin.
- False positives remain within the customer-agreed threshold and exceptions are auditable.
- Login abuse is reduced without unacceptable challenge rates for legitimate users.
- The intended API inventory is reconciled against observed traffic; unknown endpoints are triaged.
- A defined burst condition produces a controlled edge response without origin saturation.
- Security and application teams can correlate a request, action, timestamp, path, and Ray ID.
- Latency, error rate, origin request volume, and operational ownership are measured before and after.

## Exact ask

“If those outcomes match what you need, can we schedule a 45-minute POC design session with the application owner, security, networking or DNS, and the executive sponsor? I’ll bring a one-page test plan with the traffic scope, rollback, success metrics, data requirements, and Enterprise entitlements. Our AE can then align the commercial path to the technical scope we agree.”

Then stop. Let the customer answer.

## If they are not ready

Ask: “What uncertainty would we have to remove before a POC is worth your team’s time?” Classify the response as technical fit, risk, priority, process, cost, or sponsorship. Do not argue; turn it into a testable next step.

---

# Portal navigation drill

Use the authenticated dashboard only after the deck has produced a request worth investigating. This preserves narrative momentum and demonstrates portal comfort in context.

## Navigation sequence

1. **Workers & Pages → innovative-future-solutions-security-demo:** Show the current deployment, routes/custom domains, observability, and secrets names only. Never reveal secret values.
2. **Web Assets / innovativefuturesolutions.com → Security → Analytics → Events:** Filter by hostname, path `/attack-lab`, action Block, and the recent time window. Match the Ray ID when available.
3. **Security → WAF → Custom rules:** Show the narrow XSS lab expression, enabled state, and action.
4. **Security → WAF → Rate limiting rules:** Show the isolated `/api/demo/burst-control` rule, threshold, period, and mitigation timeout.
5. **Security → Bots:** Show Bot Fight Mode and explain what changes with Enterprise Bot Management.
6. **Turnstile at account level:** Show the widget hostname configuration and analytics; do not expose the secret key.
7. **Security → API Shield / Web Assets → Endpoints:** Show the eight saved operations and explain why Worker-backed origin metrics may not populate.

## Portal narration formula

For every screen say: **where we are, what problem the product solves, what is configured here, what evidence it produces, and what plan boundary applies.** Avoid a dashboard tour disconnected from the customer’s problem.

---

# Enterprise boundary and honesty matrix

## Live on this zone

- Cloudflare Worker and custom domains.
- Managed HTTPS, HSTS, CSP, and response security headers.
- One narrow WAF custom rule.
- Bot Fight Mode, explicitly identified as the Free-plan bot control.
- Turnstile with server-side Siteverify.
- API Shield Endpoint Management with eight saved operations and OpenAPI documentation.
- One path-scoped rate-limiting rule with a 10-second period.
- Security Events and Ray ID correlation in the authenticated dashboard.

## Enterprise extensions to describe, not claim

- Bot Management per-request scores from 1–99, score-based rules, and deeper bot analytics.
- API Discovery from machine-learning and session-identifier signals.
- Advanced API protections such as production schema validation, mTLS, JWT validation, sequence analytics or mitigation, and sensitive-data detection where licensed.
- Advanced Rate Limiting characteristics, longer windows, complexity-based budgets, and broader account-level patterns where entitled.
- Logpush or security integrations for SIEM, long-term analytics, and customer workflows.
- Enterprise support, contract-specific SLAs, and account-level policy design.

## Phrases to avoid

- Do not say “all bots are blocked.” Say “the configured control detects and challenges malicious automation; legitimate automation and false positives require policy design.”
- Do not say “API Discovery is running” on this Free-plan zone. Say “Endpoint Management is live; Enterprise API Discovery is the next extension.”
- Do not say “rate limiting allows exactly five requests.” Counters are distributed and enforcement may lag by a few seconds.
- Do not say “the origin can never be reached.” Explain origin locking, authenticated origin pulls, tunnels, IP allowlisting, or network design as a separate control.
- Do not say “zero latency.” Say “the edge can reduce network distance and offload origin work; measure the customer path.”
- Do not claim a cost percentage without the customer’s traffic, egress, support, and tool-spend baseline.
- Do not say “Cloudflare replaces AWS.” Say “move the first-hop controls and latency-sensitive logic; keep or migrate state deliberately.”

---

# Slide 01 — Secure the app, one layer at a time

**Timing:** 45–60 seconds
**Objective:** Establish that this is a working application and a structured security demonstration, not a static product overview.

## Say

“I’m going to secure one small application in layers. The application is this presentation itself: a TypeScript Worker, a custom domain, public-safe APIs, and a Turnstile-protected login demonstration. I’ll prove HTTPS, block an obvious XSS probe at the WAF, correlate the block with a Security Event, add bot and human-verification controls, inspect the API surface, stop a bounded burst with rate limiting, and finish by explaining why the edge changes the application’s risk boundary.”

“The green status ribbon is live. It is populated from the Worker and a deployment-control snapshot. When I use an architecture simulation later, I will label it as a simulation rather than pretend that every Cloudflare product is provisioned here.”

## Do

1. Open **Present**.
2. Start the timer.
3. Select **Run preflight**.
4. Pause until the eight evidence cards finish animating.

## Proof to point at

- Current Worker version and edge colo.
- Custom hostname observed by the Worker.
- Negotiated TLS version.
- WAF, Bot Fight Mode, Turnstile, API inventory, and rate-limit configuration status.

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

**Timing:** 90–120 seconds
**Objective:** Show intended API inventory, live endpoint behavior, redaction, a highlighted Cloudflare control graph, plan boundaries, and a real 200→429 edge enforcement loop.

## Say

“You cannot secure an API surface you cannot see. Enterprise API Discovery observes traffic and normalizes similar paths. Endpoint Management, which is live here, stores the operations the team chooses to manage. The OpenAPI contract represents intended behavior; an Enterprise POC would compare that contract to observed traffic to reveal undocumented or shadow APIs.”

“This inventory has eight declared operations. I can execute each public GET operation from the slide and see the HTTP status, Ray ID, and public-safe JSON. The request-inspection endpoint proves the Worker saw the hostname, path, protocol, TLS, and colo while intentionally excluding IP addresses, cookies, credentials, and bodies.”

“The canary link sends the live `/api/security-controls` response into PlatPhorm JSON on Cloudflare. It opens directly in Graph view and highlights WAF, bot controls, managed API endpoints, and rate limiting as distinct paths. The graph is fetched from this Worker at presentation time; it is not a fabricated screenshot.”

“The burst-control route is deliberately isolated. A normal response returns 200 from the Worker. The rate-limiting rule counts requests by data-center location and client IP; after the threshold, the edge returns 429 for ten seconds. The exact number of 200s can vary because distributed counters may update with a short delay—the security proof is the transition from Worker JSON to an edge 429.”

“One current limitation is important: Endpoint Management is available on all plans, but performance metrics may not populate for Worker-handled routes because there is no conventional origin timing to measure.”

## Do

Run these operations in order:

1. `/api/health`
2. `/api/security-controls`
3. Select **Open the highlighted control graph** and point out the four color-coded control paths.
4. Return to the deck, then run `/api/demo/preflight` and `/api/demo/request-inspection`.
5. Select **Run controlled burst** and narrate the allowed count, wait state, and first 429.
6. Open **Security → WAF → Rate limiting rules** only if the panel wants the configuration detail.

## Proof to point at

- Live status and Ray/request ID for each request.
- Eight declared operations.
- Redacted inspection response.
- OpenAPI document linked from the slide.
- Live PlatPhorm JSON canary graph sourced from `/api/security-controls`, with WAF, bot, API, and rate-limit highlighting.
- Bounded burst transitions from Worker 200 to edge 429 on the isolated path.
- Active rate-limit rule: five requests per 10 seconds with a 10-second mitigation timeout.

## Likely question

**Why not rate-limit the real login route?**

The demo isolates burst traffic so repeated interview tests cannot interfere with Turnstile validation or legitimate browsing. In production the threshold, characteristics, action, and scope would be derived from real traffic and the abuse model. A sensitive API would also add strong authentication such as JWT validation or mTLS where appropriate, application authorization, schema validation, sequence and abuse detection, consistent error envelopes, and correlated logs without credentials or personal data.

## Transition

“The individual controls now form one request pipeline. I’ll summarize that pipeline before discussing broader platform architecture.”

## Recovery

If an explorer call fails, open the endpoint directly. If the burst remains 200, say: “Cloudflare documents that distributed counters can take a few seconds to update; I will not manufacture a 429.” Move on and use the active rule configuration as control evidence, not request evidence. If API Shield metrics are empty, explain the documented Worker limitation rather than describing the endpoint as undiscovered.

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

# 15-minute Q&A operating plan

## How to answer

Use a three-part pattern: **answer directly in one sentence, support it with an architectural reason or live evidence, then bridge to the customer’s environment.** Aim for 20 seconds before adding depth. If the question is ambiguous, ask which dimension matters—security, operations, cost, migration, or developer experience.

At 42:00, reserve the final three minutes: “I want to make sure we convert the useful questions into a next step. Let me summarize the two uncertainties I heard and propose how the POC would test them.”

## Why Cloudflare instead of a cloud-provider WAF?

**Short answer:** “The differentiator is the independent, globally distributed request path and the breadth of controls on it, not that another WAF cannot match signatures.”

Cloudflare can front multiple clouds and on-premises origins consistently. The evaluation should compare security efficacy, propagation, false-positive operations, latency, observability, origin offload, and the cost of operating multiple point products—not logo counts. Ask which applications span providers and where policy drift occurs today.

## What prevents direct-to-origin bypass?

Cloudflare only protects traffic that traverses Cloudflare. In production, restrict origin access with Cloudflare IP allowlists, Authenticated Origin Pulls, Cloudflare Tunnel, private connectivity, origin firewall policy, or application-level authentication as appropriate. Validate that the origin address is not exposed through DNS history, certificates, emails, or adjacent services.

## How do you avoid WAF false positives?

Start with narrow scope and observation. Establish a traffic baseline, use managed-rule overrides only with evidence, stage from log or challenge to block, identify owners and rollback, test critical journeys, and monitor Security Events after every change. A POC success criterion should explicitly cap false positives on agreed business transactions.

## How does Cloudflare absorb DDoS attacks?

Cloudflare’s network advertises and serves applications across many locations, detects attack traffic, and applies mitigations before the origin. Keep the answer at the architecture level unless contract-specific capacity or SLA terms are available. Tie the value to origin preservation and continuity, not an unsupported numerical promise.

## Where does TLS terminate, and how is the origin protected?

The browser’s TLS connection terminates at Cloudflare. In a proxied-origin design, Cloudflare creates a separate connection to the origin; use Full (strict), a valid origin certificate, and origin authentication. This Worker-origin demo has no second web-origin hop for the deck and APIs.

## What is the difference between WAF, bot protection, Turnstile, and rate limiting?

WAF evaluates request properties and attack patterns. Bot products classify automation and, at Enterprise, provide per-request scores. Turnstile gives an application a privacy-preserving human-verification token. Rate limiting controls request volume for a chosen scope and set of characteristics. They complement one another because intent, identity confidence, content, and volume are different signals.

## Why Turnstile if Bot Management already scores requests?

Bot signals help the edge classify traffic continuously. Turnstile is an explicit, application-initiated proof at a sensitive step such as login or checkout. It can be used only when risk warrants step-up friction, and the token must always be verified server-side.

## What changes with Enterprise Bot Management?

Enterprise Bot Management adds a 1–99 bot score, score-based WAF or Worker logic, detailed analytics, and more granular per-endpoint policy. The current zone demonstrates Bot Fight Mode and names that boundary. In a POC, tune scores and actions by endpoint rather than applying a blanket block.

## Is API Discovery actually running here?

No. Endpoint Management is live with eight saved operations; Enterprise API Discovery is not claimed on this Free-plan zone. API Discovery would add observed traffic and path normalization so the team can compare intended OpenAPI operations with unknown or shadow endpoints.

## Why are Endpoint Management metrics empty?

Cloudflare documents that certain origin performance metrics may not populate when a Worker handles the path, because there is no conventional origin timing to observe. The saved operation still demonstrates inventory. Use Worker observability and request evidence for this architecture, and avoid calling empty metrics a discovery failure.

## Can rate limiting guarantee exactly five requests reach the origin?

No. Cloudflare documents that counters are distributed by data-center location and enforcement can lag by a few seconds. The rule expresses a policy boundary, not a transactional semaphore. If exactly-once or globally coordinated quotas are required, combine edge rate limiting with an authoritative application or Durable Object control designed for that invariant.

## How would you choose a production rate limit?

Measure normal and abusive request distributions, segment by endpoint and client identity, include peak behavior, choose characteristics that match the abuse model, and begin with a non-destructive action. Validate legitimate bursts, NAT effects, verified bots, fail-open or fail-closed behavior, and rollback before blocking.

## How does logging integrate with a SIEM?

Enterprise designs commonly use Logpush or supported integrations to deliver security and request logs to customer storage or SIEM workflows. Define fields, redaction, retention, sampling, data residency, alert ownership, and correlation IDs before turning on volume. Never route credentials, cookies, or unnecessary personal data into the logging pipeline.

## What about data residency and compliance?

Do not answer with a blanket certification claim. Identify the exact data, geography, product, and regulatory requirement, then validate it against the current Cloudflare service documentation and contract. Separate control-plane data, request metadata, logs, content, and customer origin data; each may have a different handling path.

## What is the rollback plan for onboarding?

Document the DNS and routing state before change, reduce TTLs when appropriate, preserve the origin path, stage one hostname or route, define health checks, and name the person authorized to revert. For Worker logic, use versioned deployments and small changes. For security policy, retain the prior rule and disable the smallest new control first.

## How do you migrate without replacing AWS?

Move the first-hop security, routing, and latency-sensitive stateless logic first. Keep the existing regional system of record, connect deliberately, and measure. Migrate state only when the target consistency, compliance, operational, and cost model is better. The appendix decision labs support this discussion, but they are not required for the AppSec proof.

## Who owns security after Cloudflare is deployed?

Cloudflare can enforce TLS, DDoS, WAF, bot, rate, API, and routing controls at the edge. The customer still owns identity and authorization, secure code, secrets, data protection, dependency risk, origin configuration, incident response, and policy decisions. Capture this shared-responsibility boundary in the POC runbook.

## How would you quantify ROI?

Build the model from the customer baseline: current CDN/WAF/bot/API tools, support and operational labor, origin compute and egress, outage impact, fraud or abuse loss, deployment lead time, and incident response effort. Compare like-for-like contract scope and include migration work. Avoid generic percentage claims.

## What if Cloudflare has an outage?

Discuss architecture and contract scope, not absolutes. Identify dependency criticality, fail-open or fail-closed requirements, cached or static fallbacks, origin reachability, DNS strategy, status communications, and recovery objectives. Multi-provider designs add resilience but also routing, certificate, policy, observability, and testing complexity; prove the trade-off for the application.

## What would you test first in the POC?

Test the highest-value, lowest-ambiguity flow: a production-like hostname, one safe baseline journey, one agreed attack, one login abuse case, and one critical API. Measure functional success, false positives, latency, origin volume, event correlation, operational ownership, and rollback. Add products only when each addresses a discovered requirement.

## Why is the Worker useful beyond hosting the demo?

It demonstrates a programmable policy and integration layer on the same request path: normalize requests, validate tokens, add headers, route by context, perform lightweight authentication or transformation, call bindings, and preserve correlation. The business value is controlled customization without standing up a separate regional proxy tier.

# Fast technical reference

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
- Rate limiting rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
- Rate limiting counters: https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/
- Bot Management: https://developers.cloudflare.com/bots/get-started/bot-management/
- Turnstile server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
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
