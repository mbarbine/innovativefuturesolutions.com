# Cloudflare Application Security — Final Speaker Notes

**Aligned to the 15-slide main deck plus Slides 16–20 appendix at `https://innovativefuturesolutions.com`.**
**Flow:** discovery → Cloudflare network and adoption → zone/DNS/SSL → AppSec proof → focused POC.
**Operating rule:** answer directly, prove the claim, connect it to the customer, confirm adequacy, and never bluff.

## Preflight
### Shared-screen sequence
- Slide deck starts on Slide 1. Pre-open Cloudflare tabs in this exact order: Zone Overview, DNS Records, SSL/TLS Overview, Security Analytics, Security Events, Managed Rules, Custom Rules, Rate Limiting, then optional Bots/API Shield/Access.
- Use one browser window/profile with notifications disabled. Keep email, chat, billing, member, token, and personal tabs closed.
- The first live UI proof must be zone → proxied DNS → SSL/TLS. Do not begin with a feature maze.
### Evidence and safety
- Keep Invoke-CloudflareDemoTraffic.ps1 on the shared-screen laptop. Five to ten minutes before the call, run: .\Invoke-CloudflareDemoTraffic.ps1 -HostName innovativefuturesolutions.com -Mode All
- Record one 403 CF-Ray, one 429 result, and the exact timestamps. Leave filtered Events and rule tabs pre-opened.
- Generate the deterministic WAF and rate-limit evidence before the panel joins. Record a fresh Ray ID and timestamp.
- Never deploy a broad rule during the interview. Use only the dedicated demonstration path and prebuilt controls.
- Pair a configuration screen with a request outcome and, when available, a Security Event. Do not convert configuration into request-level proof.
### Audience involvement
- Use the planned checkpoint prompts after discovery, the Cloudflare overview, DNS/TLS, the 403/Event proof, and the POC recommendation.
- When interrupted, answer directly in one sentence, support with evidence, bridge to their environment, then ask whether the answer was adequate.
- Do not ask a question after every screen. The checkpoints are deliberate; silence and listening matter.
### Confidence discipline
- Never guess at limits, SLA terms, pricing, roadmap, contract terms, or a product entitlement.
- Use the “When unsure” scripts instead of workshopping an answer live.
- If a feature page is empty, state whether it is unconfigured, unpopulated, or unverified—only when the UI proves that distinction.
### Hard cut order
- 1. Optional Worker.
- 2. Deep Bot UI or deep API Shield UI—keep the one that matches discovery.
- 3. Live Zero Trust UI.
- 4. Extra charts in Security Analytics.
- Never cut discovery recap, DNS/TLS proof, WAF request + event evidence, or the POC ask.

## Live run

---

## Cue 1/27 — Slide 1 — 00:00–00:45
### Lead the call confidently—and set a customer outcome
**Shared screen:** Show Slide 1 on innovativefuturesolutions.com. Stay on the slide. Do not open Cloudflare yet.

### Say
Thanks for making the time today. I’m Michael, your Cloudflare Solutions Engineer for this deep dive.

Our Account Executive was unexpectedly pulled away, so I’ll cover the first-pass discovery and technical walkthrough. I’ll capture anything commercial that needs a precise follow-up.

I’ll use innovativefuturesolutions.com to test whether Cloudflare can improve one critical public request path, then briefly connect that to Zero Trust for private administrative surfaces. The goal is not to show everything; it is to earn—or disqualify—a focused proof of concept.

### Do now
- Camera first; slide second.
- Acknowledge the AE once and move on.
- End with a calm pause before advancing.

### Ask / check the room
“Does that outcome and scope work for everyone?”

**Transition:** “Let me show you how I’ll use the 30 minutes—and please interrupt when something matters to your environment.”

**Truth boundary:** Take ownership; do not apologize repeatedly or mention the interview.

**If it fails:** If interrupted immediately: “That is useful context. I’ll answer the part I can answer precisely, then use it to tune the rest of the walkthrough.”

**Official references:** [Cloudflare dashboard](https://dash.cloudflare.com/)

---

## Cue 2/27 — Slide 2 — 00:45–01:30
### Set expectations and invite interruption
**Shared screen:** Advance to Slide 2. Stay on the slide.

### Say
I’ll spend five minutes on your priorities, about five minutes on what makes Cloudflare different and how onboarding works, then move into the live portal.

The live sequence is deliberate: correct zone, proxied DNS, SSL/TLS, traffic visibility, and then enforcement. I’ll reserve the final minutes for POC scope, success metrics, rollback, owners, and the next meeting.

Please interrupt me. After each major proof, I’ll confirm that I answered the question at the depth you need.

### Do now
- Point briefly to the four stages.
- Do not read every bullet on the slide.

### Ask / check the room
“Is there anything you want me to make sure we cover before I begin discovery?”

**Transition:** “Before I show any product, I need three signals from you.”

**Truth boundary:** Questions are welcome, but protect the 27-minute close gate.

**If it fails:** If the panel says “just show us the product,” respond: “I will. I need three signals first so I show the controls that matter to your business.”

---

## Cue 3/27 — Slide 3 — 01:30–02:30
### Question 1 — critical business journey
**Shared screen:** Advance to Slide 3. Ask one question, then stop talking.

### Say
Which public application, API, or customer journey creates the greatest business risk if it becomes unavailable, abused, or slow?

And what is the business consequence when that happens — lost revenue, customer trust, an SLA impact, operational cost, or something else?

### Do now
- Pause. Let more than one stakeholder answer.
- Capture only 3–6 words in the Discovery drawer: the application or journey.
- Reflect one phrase back: “So the critical path is ___.”

### Ask / check the room
After the answer: “So the critical path is ___—have I got that right?”

**Transition:** “That gives me the business consequence. Now I want to understand where the current operating model breaks down.”

**Truth boundary:** Listen. Do not solve during discovery.

**If it fails:** If no one answers: “For today, I’ll assume the public web application and API are customer-facing revenue paths.”

---

## Cue 4/27 — Slide 3 — 02:30–03:35
### Question 2 — current pain and operating gap
**Shared screen:** Stay on Slide 3.

### Say
How are you protecting that path today, and where does the process break down?

Is the problem attack visibility, false positives, bot or credential abuse, response time, origin cost, release friction, tool sprawl — or something I have not named?

### Do now
- Pause again.
- Capture the pain in the Discovery drawer.
- Ask one follow-up only: “Who feels that pain most today — security, infrastructure, application teams, or the business?”

### Ask / check the room
After the answer: “Is that primarily a security-team pain, an application-team pain, or both?”

**Transition:** “Last question: what evidence would make a POC credible?”

**Truth boundary:** A feature request is not a business impact until you connect it to revenue, trust, cost, availability, staffing, audit, or velocity.

**If it fails:** If the answer is broad: “Which one of those creates the most expensive or frequent operational consequence?”

---

## Cue 5/27 — Slide 3 — 03:35–05:00
### Question 3 — success criteria and recap
**Shared screen:** Stay on Slide 3. End discovery with a concise recap.

### Say
Two weeks from now, what evidence would make you comfortable expanding the rollout?

Would it be fewer abusive requests reaching origin, faster investigation, zero critical false positives, lower infrastructure cost, fewer point tools, or another measurable result?

Let me reflect that back: the critical path is {{journey}}, the current pain is {{pain}}, and a credible win is {{success}}. Have I captured that correctly?

### Do now
- Capture the success metric.
- If they name a buying or approval gate, capture it as the POC gate.
- Do not solve the problem during discovery.

### Ask / check the room
“Have I captured the success standard correctly?”

**Transition:** “That is why this is a business problem before it is a WAF configuration problem.”

**Truth boundary:** Use the two-week POC shown on Slide 14. Do not say 30 days.

**If it fails:** Working assumptions: public web app + API; better attack visibility; controlled false positives; security changes cannot slow releases; admin paths should not remain public.

---

## Cue 6/27 — Slide 4 — 05:00–06:40
### Translate the security problem into business impact
**Shared screen:** Advance to Slide 4. Stay on the slide.

### Say
Based on what you said, the objective is not simply to block bad traffic. It is to protect {{journey}}, reduce {{pain}}, and prove {{success}}.

An attack becomes a business problem through downtime, fraud, customer friction, cloud cost, incident workload, or delayed releases. Security needs assurance, infrastructure needs resilience, and application teams need controls that do not become emergency code changes.

The control therefore has to be inline, observable, tunable, and safe to roll back.

### Do now
- Use the customer’s exact words once.
- Do not introduce product features until the last sentence.

**Transition:** “That makes the placement of the control strategically important.”

**Truth boundary:** No unsupported ROI percentages or universal cost-saving claims.

**If it fails:** If discovery was thin, use: “For this demo, I’ll optimize for availability, attack visibility, controlled false positives, and reduced origin load.”

**Official references:** [Cloudflare WAF overview](https://developers.cloudflare.com/waf/)

---

## Cue 7/27 — Slide 5 — 06:40–07:35
### Why Cloudflare — every service, every location, one pass
**Shared screen:** Advance to Slide 5. Stay on the slide.

### Say
Cloudflare’s differentiator starts with the network, not with one WAF feature. Cloudflare runs its service stack throughout the global network, and single-pass inspection lets security and performance decisions happen near the request source instead of backhauling traffic through a chain of separate products.

That same origin-independent request path can apply security, performance, visibility, and programmable logic before traffic reaches the origin. The operating model can stay consistent across AWS, Azure, Google Cloud, SaaS, and private infrastructure—valuable when extra hops, policy drift, and tool sprawl are the real problem.

### Do now
- Point to Security, Performance, Visibility, and Programmability.
- Use three anchors: every service in every data center; single-pass inspection; origin-independent control.
- Do not quote city, latency, traffic, or capacity numbers unless the panel asks; use the current official network page.

### Ask / check the room
“Which matters most here: multi-cloud consistency, origin protection, lower latency, or operational consolidation?”

**Transition:** “That architecture is useful only if a customer can start safely without a large replatforming project.”

**Truth boundary:** The network architecture does not mean every product is entitled or that every customer workload should move to Cloudflare.

**If it fails:** If challenged on differentiation: “Let me prove the operating model rather than debate a feature matrix: one onboarding path, one request path, and shared enforcement evidence.”

**Official references:** [Cloudflare global network](https://www.cloudflare.com/network/)

---

## Cue 8/27 — Slide 5 — 07:35–08:20
### Why Cloudflare — a low-friction path from foundation to Enterprise
**Shared screen:** Advance to Slide 5. Stay on the slide.

### Say
Cloudflare’s mission to help build a better Internet shows up in the starting point. A team can begin self-service—without installing an appliance or rewriting the application—and establish DNS, Universal SSL, CDN, automatic DDoS protection, and a managed WAF baseline before a major rearchitecture.

Enterprise adds deeper controls, policy flexibility, support, and contract-specific commitments, but the customer does not rebuild the front door to expand. Today I’ll show the live state rather than infer capabilities from the plan name.

Application Security protects the public customer path; Zero Trust is the complementary motion for private and administrative paths.

### Do now
- Separate the accessible foundation from Enterprise depth.
- Say “start small, become inline safely, measure, then expand.”
- Do not imply the plan name alone proves entitlement, configuration, or enforcement.

**Transition:** “Here is the exact onboarding method I used for this environment.”

**Truth boundary:** Foundational availability does not mean every Enterprise capability exists on every tier or is enabled in this account.

**If it fails:** If challenged on consolidation: “I am not assuming every existing tool disappears. The POC measures which controls and workflows Cloudflare can credibly consolidate in your environment.”

**Official references:** [Cloudflare plans](https://www.cloudflare.com/plans/) · [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/enable-universal-ssl/) · [DDoS protection](https://developers.cloudflare.com/ddos-protection/)

---

## Cue 9/27 — Slide 6 — 08:20–09:00
### Onboarding — establish the Cloudflare control point
**Shared screen:** Advance to Slide 6. Stay on the slide.

### Say
I used the standard full-zone reverse-proxy motion: add innovativefuturesolutions.com, review the imported DNS records, update authoritative nameservers, proxy the relevant web records, and validate SSL/TLS.

That can introduce DNS, TLS, DDoS protection, visibility, and edge policy without rewriting the application. A customer can begin with one hostname, observe normal traffic, and expand only after the application owner accepts the behavior.

### Do now
- Use the four numbered steps on Slide 6.
- Name full-zone onboarding as this demo’s method—not the only possible method.

**Transition:** “The adoption model also needs a safe rollback path.”

**Truth boundary:** Plan tier, product entitlement, configured state, and request evidence are four different facts.

**If it fails:** If asked about partial or CNAME onboarding: “The exact method depends on DNS ownership and change constraints. This environment uses a standard full-zone motion; the POC design session would select the supported model that fits your architecture.”

**Official references:** [Onboard a domain](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/) · [Proxy status](https://developers.cloudflare.com/dns/proxy-status/) · [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/)

---

## Cue 10/27 — Slide 6 — 09:00–09:30
### Onboarding — stage changes and roll back narrowly
**Shared screen:** Advance to Slide 6. Stay on the slide.

### Say
The rollback model is layered. A bad security rule is disabled first. A Worker version or route can be reverted independently. DNS or proxy changes are the broader contingency—not the first response to a tuning problem.

For private origins or admin-only services, the expansion is Tunnel plus Access rather than leaving those services directly exposed.

### Do now
- Emphasize smallest-change rollback.
- Mention Tunnel and Access only as the private-path expansion.

**Transition:** “That gives us two related paths: public Application Security and private Zero Trust.”

**Truth boundary:** Do not describe proxy-off as the routine rollback for a bad WAF rule.

**If it fails:** If asked about partial or CNAME onboarding: “The exact method depends on DNS ownership and change constraints. This environment uses a standard full-zone motion; the POC design session would select the supported model that fits your architecture.”

**Official references:** [Onboard a domain](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/) · [Proxy status](https://developers.cloudflare.com/dns/proxy-status/) · [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/)

---

## Cue 11/27 — Slide 7 — 09:30–10:20
### Architecture — protect and accelerate the public path
**Shared screen:** Advance to Slide 7. Stay on the slide until the final sentence.

### Say
On the public path, browsers, mobile clients, legitimate crawlers, and attackers reach Cloudflare first. The same edge path can absorb DDoS traffic, evaluate WAF and bot signals, enforce rate and API controls, accelerate allowed traffic, and invoke Worker logic when custom behavior is justified.

The value is not a longer product list. It is fewer serial control points before the application and shared evidence across security, infrastructure, and application teams.

### Do now
- Trace the public path left to right.
- Keep the explanation tied to the customer’s discovered priority.

**Transition:** “The private path solves a different exposure problem.”

**Truth boundary:** Cloudflare can front many origins; do not claim every workload should move to the edge.

**If it fails:** If the live portal is not ready, remain in the deck and use Appendix Slide 16 as the demo map.

**Official references:** [Access applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/) · [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)

---

## Cue 12/27 — Slide 7 — 10:20–11:00
### Architecture — remove unnecessary private exposure
**Shared screen:** Advance to Slide 7. Stay on the slide until the final sentence.

### Say
Administrators, developers, partners, and internal tools should be governed by identity and policy. Access makes the identity-aware decision, and Tunnel can connect the origin outbound so it does not require a public inbound service.

AppSec and Zero Trust are not competing stories. AppSec protects what must remain public; Zero Trust removes unnecessary exposure from private administrative surfaces.

I’ll prove the public path first, beginning with the basic requirements: zone context, proxied DNS, and SSL/TLS.

### Do now
- Advance to Slide 8.
- Switch to the prepared Cloudflare dashboard window.
- Do not add another architecture tangent.

### Ask / check the room
“Does that public AppSec / private Zero Trust split fit your environment?”

**Transition:** “First, I verify the control point before discussing enforcement.”

**Truth boundary:** Do not claim Access or Tunnel is live unless the UI proves it.

**If it fails:** If the live portal is not ready, remain in the deck and use Appendix Slide 16 as the demo map.

**Official references:** [Access applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/) · [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)

---

## Cue 13/27 — Slide 8 — 11:00–11:45
### Portal handoff — verify the correct zone
**Shared screen:** Show Slide 8 briefly, then Alt+Tab to Cloudflare. Use the pre-opened zone Overview tab.

### Say
I start with the object we are changing: the correct account, the correct zone, and the current service state.

Before I show a security feature, I want to prove that innovativefuturesolutions.com is the zone receiving the policy and distinguish three things clearly: the zone plan, the products entitled for the account, and the controls actually configured here.

### Do now
- Cloudflare dashboard → select innovativefuturesolutions.com → Overview.
- Point to the zone name, active status, plan or entitlement only when clearly visible, and recent request activity.
- Do not linger on generic dashboard cards.

**Dashboard search:** `innovativefuturesolutions.com` · `Overview`

**Evidence:** Correct zone name · Active zone · Traffic or request activity · Enterprise plan/feature status only if clearly visible

**Transition:** “Now I’ll show the point where Cloudflare becomes inline.”

**Truth boundary:** Show only what the dashboard proves. Menus do not prove entitlement.

**If it fails:** If navigation has moved, search for the zone name. If plan or entitlement details are not visible, say: “I do not want to infer entitlement from the menu; I’ll show only what this zone proves.”

**Official references:** [Open Cloudflare dashboard](https://dash.cloudflare.com/)

---

## Cue 14/27 — Slide 8 — 11:45–12:45
### DNS — prove the application is proxied
**Shared screen:** Stay in Cloudflare. Open the preloaded DNS tab or search for DNS.

### Say
This orange-cloud record is the key onboarding proof. DNS still answers for the hostname, but HTTP and HTTPS traffic now traverses Cloudflare before the origin or Worker.

That is what makes DDoS protection, WAF, bot controls, rate limiting, caching, analytics, and Workers available on the request path. A DNS-only record resolves directly and does not receive those HTTP-layer services.

Proxying does not by itself prevent origin bypass; production design must also restrict or authenticate origin access.

### Do now
- DNS → Records.
- Filter or search for the apex, www, or the actual app/API hostname.
- Point to Type, Name, Target, and Proxy status. Do not expose or edit unrelated records.

### Ask / check the room
“Does that answer how Cloudflare becomes inline, or should I go deeper on partial/CNAME onboarding?”

**Dashboard search:** `DNS` · `Records` · `Proxy status`

**Evidence:** A or CNAME record for the demonstrated hostname · Proxy status = Proxied / orange cloud

**Transition:** “The next validation is the encryption posture on both sides of that proxy.”

**Truth boundary:** Proxied DNS puts HTTP/S traffic on Cloudflare; it does not by itself prevent direct-origin access.

**If it fails:** If the relevant record is DNS only, say: “This is the exact POC change we would schedule and validate; I will not toggle production routing ad hoc.”

**Official references:** [Proxy status](https://developers.cloudflare.com/dns/proxy-status/) · [Onboard a domain](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/)

---

## Cue 15/27 — Slide 8 — 12:45–13:30
### TLS — verify edge and origin trust
**Shared screen:** Stay in Cloudflare. Open SSL/TLS → Overview.

### Say
Cloudflare terminates the browser’s TLS connection at the edge and presents the managed edge certificate.

For a conventional proxied origin, Cloudflare then creates a separate origin connection; my target posture is Full (strict), because it validates the origin certificate rather than merely encrypting the hop. I am checking the actual mode on screen, not assuming it.

This demonstration application is Worker-backed, so the deck itself has no conventional web-origin hop. The zone view still shows where I would validate certificate and origin-trust posture for customer origins.

### Do now
- SSL/TLS → Overview, then Edge Certificates only if it is already open.
- Point to the current encryption mode and active edge certificate.
- State that Full (strict) applies to proxied origin connections; do not imply the Worker route uses an origin certificate.

### Ask / check the room
“Does that cover the SSL requirement, or should I go deeper on origin-side trust?”

**Dashboard search:** `SSL/TLS` · `Overview` · `Edge Certificates`

**Evidence:** Current encryption mode · Active edge certificate · Any obvious posture finding

**Transition:** “The path is inline. Now I move from configuration to evidence.”

**Truth boundary:** State the displayed mode honestly and distinguish edge TLS from a conventional origin connection.

**If it fails:** If the mode is not Full (strict), say: “This is a concrete POC finding. I would validate the origin certificate and dependencies before changing the mode.”

**Official references:** [SSL/TLS overview](https://developers.cloudflare.com/ssl/) · [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/)

---

## Cue 16/27 — Slide 9 — 13:30–15:00
### Security Analytics — understand all incoming traffic
**Shared screen:** Alt+Tab to the deck, advance to Slide 9, say the headline, then Alt+Tab back to Cloudflare.

### Say
Security Analytics is where I establish the broad incoming HTTP traffic baseline before changing policy. I’m looking for hosts, paths, methods, response patterns, likely attack signals, and the difference between normal behavior and outliers.

This is the observe-first step. It supports rule design, false-positive analysis, and POC measurement. I do not start with a broad block and hope production traffic teaches me what broke.

### Do now
- Primary path: Security → Analytics → Traffic. Alternate: search for “Security Analytics.”
- Set a useful time range and filter by the demonstrated hostname when needed.
- Point to one meaningful distribution: path, action, country, status, bot grouping, or attack score when available.
- Use this baseline to explain how a production threshold or exception would be selected.

**Dashboard search:** `Security` · `Analytics` · `Traffic` · `Security Analytics`

**Evidence:** All incoming HTTP traffic · Useful filter controls · One normal-versus-suspicious pattern · Rate recommendation context if available

**Transition:** “That is the full traffic view. Security Events is the investigation view.”

**Truth boundary:** Analytics is the broad traffic baseline; do not describe it as only blocked events.

**If it fails:** Low-volume zone: “The data volume is intentionally small. In a customer POC, this page establishes the baseline on production traffic before enforcement.”

**Official references:** [Security Analytics docs](https://developers.cloudflare.com/waf/analytics/security-analytics/)

---

## Cue 17/27 — Slide 9 — 15:00–17:00
### Security Events — investigate what was flagged or acted on
**Shared screen:** Stay in Cloudflare. Open Security Events.

### Say
Security Events answers a narrower operational question: which requests were flagged or acted on, by which security feature, and why?

I use the recent time window and correlate the host, path, action, rule, timestamp, and Ray ID. The Ray ID connects the browser-visible result to the dashboard investigation.

If indexing is delayed, the live request outcome remains the enforcement proof; the Ray ID and timestamp preserve the investigation handle.

### Do now
- Primary path: Security → Analytics → Events. Alternate: search “Security Events.”
- Set Last 24 hours or a narrow time window and filter Path contains /cf-demo/.
- Open one event and point to Action, Service/Rule, Host/Path, timestamp, and Ray ID.
- Avoid exposing visitor IPs or unrelated request details while screen sharing.

### Ask / check the room
“Does this give your security and application teams the shared evidence they would need?”

**Dashboard search:** `Security` · `Analytics` · `Events` · `Security Events` · `/cf-demo/`

**Evidence:** An event triggered by WAF, rate limiting, DDoS, API Shield, or another control · Action · Matched service/rule · Ray ID

**Transition:** “Now that we have evidence, I’ll show how the policy is constructed.”

**Truth boundary:** Events explains flagged or acted-on requests; indexing may lag and sampling/retention vary by product and plan.

**If it fails:** If a fresh event is delayed: “The live request result is the enforcement proof. Dashboard indexing is asynchronous; the Ray ID and timestamp are the correlation handles. I will not spend the customer’s time waiting on a chart.”

**Official references:** [Security Events docs](https://developers.cloudflare.com/waf/analytics/security-events/)

---

## Cue 18/27 — Slide 10 — 17:00–18:15
### Managed Rules — start with maintained baseline coverage
**Shared screen:** Alt+Tab to the deck, advance to Slide 10, give the headline, then Alt+Tab back to Cloudflare.

### Say
Managed Rules mean the customer does not have to author protection for every common exploit or newly disclosed vulnerability from scratch.

I start with the Cloudflare Managed Ruleset and an OWASP baseline where appropriate, then scope, override, or create exceptions based on the application stack and the evidence in Security Events.

The value is maintained coverage with customer-specific tuning, not a one-time signature package that the team has to own alone.

### Do now
- New dashboard: Security → Security rules, then filter for Managed rules.
- Alternate/older path: Security → WAF → Managed rules.
- Show deployed rulesets, enabled state, action, and Browse rules/tags if convenient.
- Do not deploy or globally override a ruleset live.

**Dashboard search:** `Security rules` · `Managed rules` · `Cloudflare Managed Ruleset` · `OWASP Core`

**Evidence:** Deployed or available managed ruleset · Enabled state · Scope or override controls · Exceptions/skip controls if present

**Transition:** “Managed coverage handles common exploit classes. Custom rules add the customer’s context.”

**Truth boundary:** Managed rules are a maintained baseline, not a claim that the application is invulnerable.

**If it fails:** If the ruleset is unavailable or not deployed: “I do not want to workshop a deployment live. The POC step is to establish the managed baseline in log or challenge mode, review findings with the application owner, and then promote the accepted rules.”

**Official references:** [Managed Rules dashboard guide](https://developers.cloudflare.com/waf/managed-rules/deploy-zone-dashboard/)

---

## Cue 19/27 — Slide 10 — 18:15–19:45
### Custom Rules — prove narrow, deterministic enforcement
**Shared screen:** Stay in Cloudflare. Open the Custom/Security rules list, then use the prepared Security Events tab.

### Say
This custom rule must remain isolated to a non-production demonstration path. The release smoke test observed a 403 on the currently configured `/attack-lab` probe. The preferred `/cf-demo/attack` path reached Worker code with a 200, so I will not claim that path is WAF enforcement evidence until the dashboard scope and a fresh Security Event prove it.

The distinction matters. A configured rule proves intent; the request proves enforcement; the event explains why Cloudflare acted.

For customer policy, ambiguous conditions start in observation or challenge and move to block only after the application owner accepts the false-positive rate.

### Do now
- Open the existing rule and verify its actual hostname/path scope and Block action. Do not edit it during the interview.
- If the rule still targets `/attack-lab`, reproduce only with `curl.exe -i "https://innovativefuturesolutions.com/attack-lab?attack=xss&payload=%3Cscript%3Ealert(1)%3C%2Fscript%3E"`.
- Filter Security Events for the path actually shown in the rule, then correlate the timestamp and CF-Ray.
- Do not use the helper’s Block mode until `/cf-demo/attack` is explicitly aligned to the rule and independently verified.

### Ask / check the room
“Did that address the enforcement and false-positive-control question adequately?”

**Dashboard search:** `Security rules` · `Custom rules` · current rule path · `Action Block`

**Evidence:** Exact hostname/path scope · Action = Block · Fresh HTTP 403 · Matching Security Event and Ray ID

**Transition:** “A WAF rule evaluates request characteristics. The next control evaluates behavior over time.”

**Truth boundary:** Configuration is not enforcement proof. Pair request outcome with event evidence.

**If it fails:** If the result is not 403, say: “The configured rule did not produce the expected evidence, so I will not call it enforced. I’ll preserve the request and inspect scope, phase, order, and event data after the call.”

**Official references:** [Create a custom rule](https://developers.cloudflare.com/waf/custom-rules/create-dashboard/)

---

## Cue 20/27 — Slide 11 — 19:45–21:30
### Rate Limiting — control valid-looking abusive behavior
**Shared screen:** Alt+Tab to the deck, advance to Slide 11, give the headline, then Alt+Tab back to Cloudflare.

### Say
A WAF rule evaluates what a request looks like. Rate limiting evaluates how behavior accumulates even when each request is syntactically valid.

The rule has five choices: scope, counting characteristic, threshold, period, and action. The public deployment snapshot currently names `/api/demo/burst-control` as the configured target and `/cf-demo/rate-limit` as the preferred operator target. A single release request reached both paths with 200; I have not generated or verified a fresh 429 on the preferred path.

Production values come from Security Analytics, normal burst behavior, retry patterns, and the business cost of the endpoint—not from this intentionally low lab threshold.

### Do now
- Open the existing rate-limiting rule and narrate the scope, counting characteristic, threshold, period, and action actually shown.
- Show a prepared 429 only if the response and Security Event were captured after verifying the rule path.
- If the rule still targets `/api/demo/burst-control`, do not use the helper’s RateLimit mode, which targets `/cf-demo/rate-limit`.
- Run a bounded burst only after the dedicated path is aligned through an explicitly approved control-plane change.

### Ask / check the room
“Which endpoint in your environment is most expensive or most abused?”

**Dashboard search:** `Rate limiting rules` · current rule path · `Action Block` · `Status 429`

**Evidence:** Narrow hostname/path scope · Counting characteristic · Threshold and period · HTTP 200 before threshold · Edge HTTP 429 after threshold · Security Event when available

**Transition:** “Rate limits control volume. Bot signals help distinguish useful automation from abusive automation.”

**Truth boundary:** Distributed counters are not a transactional semaphore; do not promise an exact number always reaches origin.

**If it fails:** If no 429 appears, say: “Distributed counters can update with a short delay, and I will not manufacture a result. The configuration proves intent; a 429 is required before I claim request-level enforcement.”

**Official references:** [Rate Limiting dashboard guide](https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/)

---

## Cue 21/27 — Slide 11 — 21:30–22:30
### Bots — preserve useful automation, challenge abusive automation
**Shared screen:** Stay in Cloudflare. Show Bots only if the page is entitled and populated.

### Say
I do not want to treat all automation as malicious. Verified search crawlers can be valuable; credential stuffing, inventory scraping, and automated abuse are not.

Bot signals let policy vary by confidence and by path. On a sensitive endpoint, likely automated traffic might be challenged while high-confidence abuse is blocked. On a public content path, the response may be different.

That protects the customer journey without using a blanket rule that punishes legitimate users or partners.

### Do now
- Security → Bots.
- Show bot groupings or granular scores only if the account displays them.
- If granular Bot Management is available, explain lower scores as more likely automated; never invent a distribution.
- If API risk was the stronger discovery signal, keep this to 30 seconds and save time for Slide 12.

### Ask / check the room
“Is your automation problem primarily credential abuse, scraping, AI crawlers, or distinguishing useful bots?”

**Dashboard search:** `Bots` · `Bot Management` · `Bot Analytics`

**Evidence:** Verified bot grouping · Automated versus likely-human groupings · Path or action filters · Granular score only if entitled

**Transition:** “For APIs, behavior is only part of the problem. We also need a known-good contract.”

**Truth boundary:** Do not claim 1–99 scores unless Enterprise Bot Management is both entitled and visible.

**If it fails:** If unavailable or empty: “Bot Management is a POC workstream rather than a configured proof in this zone. Rate limiting already proved behavior control, so I’ll keep moving.”

**Official references:** [Bot score and grouping docs](https://developers.cloudflare.com/bots/concepts/bot-score/)

---

## Cue 22/27 — Slide 12 — 22:30–24:15
### API Shield — move from unknown endpoints to known-good requests
**Shared screen:** Alt+Tab to the deck, advance to Slide 12, give the API headline, then Alt+Tab back to Cloudflare.

### Say
API security starts with knowing what endpoints actually exist. Endpoint Management gives us the host, method, and path inventory; Schema Validation compares requests with a supplied or learned OpenAPI contract.

I start schema enforcement in Log, review the events, and then block non-compliant requests on high-value endpoints once the application owner confirms the contract.

That helps find undocumented or legacy endpoints, invalid request shapes, and gaps between what the application team believes is deployed and what traffic actually shows.

### Do now
- New dashboard: Web Assets → Endpoints or Schema validation.
- Alternate path: Security → API Shield → Endpoint Management / Schema validation.
- Show endpoint host, method, path, schema status, and current action only when populated.
- If bot abuse was the stronger discovery signal, keep API Shield to the intended-versus-observed contract story and move on.
- Mention JWT validation or mTLS only as an expansion when relevant.

### Ask / check the room
“Would intended-versus-observed API inventory be a meaningful POC outcome for you?”

**Dashboard search:** `Web Assets` · `Endpoints` · `Schema validation` · `API Shield`

**Evidence:** Endpoint inventory · Uploaded or learned schema · Log/Block action · Security Events integration

**Transition:** “Most of this should remain configuration. I use Workers only when the application needs custom edge behavior.”

**Truth boundary:** Endpoint Management is not the same as API Discovery; schema presence is not the same as blocking.

**If it fails:** If data or entitlement is absent: “I have not validated API Discovery or schema enforcement as live in this zone, so I will not present it that way. The POC step is to import or learn the contract, start in Log, and review Security Events before enforcement.”

**Official references:** [Schema Validation 2.0](https://developers.cloudflare.com/api-shield/security/schema-validation/) · [API Shield get started](https://developers.cloudflare.com/api-shield/get-started/)

---

## Cue 23/27 — Slide 12 — 24:15–24:45
### Optional Worker — show judgment, not code volume
**Shared screen:** Stay on Slide 12 or the Worker view only if already prepared. Skip this cue when behind time.

### Say
I would not write custom code where a native security product solves the problem.

I use a Worker when the customer needs application-specific behavior at the edge — for example, a correlation ID, consistent security headers, canary routing, request normalization, or lightweight pre-origin validation.

The business value is faster iteration without waiting for an origin application release.

### Do now
- Spend no more than 30 seconds.
- Do not live-edit or deploy code.
- CUT THIS FIRST if the clock is past 24:15 or the panel has already seen enough programmability.

**Dashboard search:** `Workers`

**Evidence:** A prepared Worker only

**Transition:** “That completes the public application path. The private path needs a different trust model.”

**Truth boundary:** Native product control first; custom code only for a real application-specific requirement.

**If it fails:** Skip it cleanly: “Workers are optional here; the core security outcome is delivered by the native controls I just showed.”

---

## Cue 24/27 — Slide 13 — 24:45–26:15
### Zero Trust — remove administrative and private exposure
**Shared screen:** Alt+Tab to the deck and advance to Slide 13. Show the live Zero Trust UI only if it is already configured.

### Say
The adjacent Zero Trust opportunity is to stop treating administrative reachability as authorization. Access evaluates user identity, device posture, group membership, and context before the application. Tunnel connects the origin outbound, reducing the need for a public inbound service.

The business value is smaller exposure, consistent access policy, and stronger audit evidence for admin, preview, partner, and internal applications.

I am keeping this brief because the discovery priority was the public application path. One private hostname can be a separate POC workstream.

### Do now
- Optional UI: Zero Trust → Access controls → Applications.
- Optional tunnel UI: Networking → Tunnels.
- Show an existing application, policy, or healthy tunnel only. Do not build Zero Trust from scratch during this AppSec demo.
- CUT THE LIVE UI if the clock is past 25:30; the slide and talk track are sufficient.

### Ask / check the room
“Which admin, preview, or partner surface would be the lowest-risk second workstream?”

**Dashboard search:** `Access controls` · `Applications` · `Policies` · `Networking` · `Tunnels`

**Evidence:** An Access application · Policy criteria · Tunnel health only if configured

**Transition:** “With both surfaces covered, here is the smallest POC that produces measurable business evidence.”

**Truth boundary:** Do not claim Access or Tunnel is live unless the UI proves it.

**If it fails:** “Zero Trust is the adjacent design motion, not the core live proof today. I have not shown a deployed Access policy or healthy Tunnel unless the dashboard proves it, so I would make one admin or preview hostname a separate POC workstream.”

**Official references:** [Access applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/) · [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) · [Create a Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)

---

## Cue 25/27 — Slide 14 — 26:15–27:20
### POC — one hostname, two weeks, staged enforcement
**Shared screen:** Advance to Slide 14. Stay on the slide. Leave the portal.

### Say
My recommendation is a two-week, one-hostname POC—not a broad migration.

Days zero through two: select {{journey}}, confirm owners and rollback, proxy the target hostname, validate TLS, and establish the baseline. Days three through five: use Security Analytics and Events to tune managed and custom controls.

Days six through eight: enforce high-confidence WAF and rate policies, then evaluate the bot or API motion that best matches {{pain}}. Days nine and ten: deliver the executive readout and expansion plan.

### Do now
- Point to Discover → Baseline → Enforce → Prove.
- Keep the scope to one hostname and a few critical endpoints.
- Do not reopen optional product demos.

**Transition:** “The POC is only credible if the success gates are explicit.”

**Truth boundary:** The customer defines acceptable false positives and business metrics before enforcement.

**If it fails:** If they resist two weeks: “The duration is adjustable. The non-negotiable is one scoped surface, agreed evidence, named owners, and a rollback plan.”

---

## Cue 26/27 — Slide 14 — 27:20–28:30
### POC — agree on evidence, owners, and expansion gate
**Shared screen:** Advance to Slide 14. Stay on the slide. Leave the portal.

### Say
We agree on success before the first terminating rule: traffic inspected, mitigations by category, reduction in abusive origin requests, investigation time, zero critical false positives, customer-experience impact, and a rollback model both security and application teams trust.

The executive readout answers three questions: did risk and origin load improve, did customer experience remain healthy, and can the operating teams own the controls?

Does that structure fit how your team validates a security platform, and is there an approval or data-handling gate I have not accounted for?

### Do now
- Pause after the question.
- Capture the approval or data-handling gate.
- Do not rush to Slide 15.

### Ask / check the room
Pause and listen. Their answer qualifies the next step.

**Transition:** “Let me close with the recommendation and the specific next meeting.”

**Truth boundary:** Do not change the public deck’s two-week POC to 30 days.

**If it fails:** If they resist two weeks: “The duration is adjustable. The non-negotiable is one scoped surface, agreed evidence, named owners, and a rollback plan.”

---

## Cue 27/27 — Slide 15 — 28:30–30:00
### Ask for the next meeting — then stop
**Shared screen:** Advance to Slide 15. Do not advance into the appendix unless Q&A requires it.

### Say
My recommendation is a focused rollout, not a rip-and-replace. Start with one critical application or API, put Cloudflare inline safely, prove visibility and mitigation, then expand from measured value.

For {{journey}}, the POC must reduce {{pain}} and prove {{success}}. Security Events gives security and application teams shared tuning evidence; Access and Tunnel extend the model to private administrative surfaces.

Can we schedule a POC design session with the application owner, CISO sponsor, and DevOps or infrastructure lead to agree on scope, metrics, owners, rollback, and rollout mechanics?

### Do now
- STOP TALKING after the question.
- Let the panel answer.
- Move into Q&A only after they respond.

### Ask / check the room
Ask the next-meeting question, then stop talking.

**Transition:** Q&A. Use the Q&A view; keep answers under 60 seconds, then bridge back to the POC.

**Truth boundary:** Do not weaken the ask. Stop after the question.

**If it fails:** If asked to summarize in one line: “Protect the public revenue path, remove private exposure, and prove both with one measured POC.”

---

## When unsure — exact language
### Exact limit, entitlement, SLA, or contract term
“I do not want to guess at the exact limit or contract term. What I can say confidently is ___. I’ll capture the precise entitlement and follow up with the authoritative answer.”

### Feature not proven in this zone
“I have not validated that capability as active in this zone, so I will not present it as live. Here is how I would test it in the POC.”

### Architecture known; product detail uncertain
“I can answer the architecture and trade-off now. I want to verify the current product-specific behavior before I give you a definitive implementation answer.”

### Live demo does not behave as expected
“The control did not produce the expected evidence, so I am not going to call it successful. I’ll preserve the request details, investigate after the call, and keep us on the customer outcome.”

### Confirm adequacy and move on
“Did that answer the question at the depth you wanted, or is there one dimension I should clarify before I move on?”


## Q&A bank
### What makes Cloudflare genuinely different?
Cloudflare runs the service stack throughout one global network and uses single-pass inspection near the request source. That creates an origin-independent control point where security, performance, analytics, Workers, and the Zero Trust expansion path share one operating model across clouds and data centers. I would still prove the value on one application rather than ask you to accept the platform story on faith.

### How easy is it to get started, and what is available before Enterprise?
The standard full-zone motion is add the domain, review DNS, update nameservers, proxy the application record, and validate SSL. A team can start self-service without installing an appliance or rewriting the application, with foundational DNS, Universal SSL, CDN, DDoS protection, and a managed WAF baseline. Enterprise adds depth, policy flexibility, support, and contract-specific commitments; exact entitlement must still be verified in the account.

### Can Cloudflare front applications in more than one cloud?
Yes. The proxy and security control point can sit in front of applications across public clouds, SaaS platforms, and private infrastructure. The POC should test routing, origin authentication, observability, and failure handling for the customer’s actual origin topology rather than treating multi-cloud as only a diagram.

### Why Cloudflare instead of our current WAF or cloud-native controls?
I would not assume the current controls are worthless. The POC compares operating outcomes. Cloudflare’s differentiation is that the enforcement point also provides DDoS protection, bot and API controls, analytics, performance, programmable edge logic, and a Zero Trust expansion path. The value to prove is fewer enforcement silos, faster policy changes, and less abusive traffic reaching origin.

### How do you prevent false positives?
Scope by hostname and path, start with visibility, use non-terminal actions for ambiguous traffic, inspect Security Events, create narrow exceptions, and promote only high-confidence policy to Block. “Zero critical false positives” is a POC gate; “zero false positives forever” would not be a credible promise.

### What is the rollback plan?
First disable or revert the specific rule that caused the issue. Keep changes versioned and owner-approved. Proxy or DNS rollback is an onboarding-level contingency, not the first response to a bad WAF rule, because it can remove the protection layer and expose the origin path.

### Can attackers bypass Cloudflare and hit the origin directly?
That risk must be addressed as part of onboarding. Common controls include restricting origin ingress to Cloudflare paths, using authenticated origin mechanisms where appropriate, removing leaked origin addresses, and using Tunnel when the origin should not accept inbound Internet connections. I would validate origin bypass explicitly in the POC.

### How is Security Analytics different from Security Events?
Security Analytics is the broader incoming HTTP traffic view, including traffic Cloudflare did not act on. Security Events is the investigation view for requests that security products flagged or acted on. Analytics establishes the baseline; Events explains mitigations and supports tuning.

### Why use Managed Challenge instead of Block?
When a signal is suspicious but not deterministic, challenge gives us a safer intermediate action. It reduces automated abuse while preserving a path for legitimate users. Deterministic demo paths or high-confidence exploit traffic can be blocked; ambiguous behavior should be staged.

### How do managed and custom rules work together?
Managed rules provide maintained baseline coverage for common exploit classes. Custom rules add the customer’s context — specific hosts, paths, headers, source networks, or business logic. Exceptions should be narrow and evidence-based rather than disabling a whole ruleset.

### How would you choose a production rate limit?
Use real traffic distributions in Security Analytics, separate users or API clients by an appropriate counting characteristic, account for bursts and retries, test in observation or challenge mode, and validate customer impact. A demo threshold proves mechanics; it is not a production recommendation.

### Will Bot Management block good bots?
The policy should distinguish verified or useful automation from abusive automation and should vary by path. The safer rollout is observe, allow known-good bots, challenge likely automation on sensitive endpoints, and block only high-confidence abuse. Bot policy is not “block everything automated.”

### What if we do not have a clean OpenAPI schema?
Start with endpoint discovery and observed traffic, export or build the initial contract with the application owner, and put validation in Log. The gap itself is useful evidence: undocumented endpoints and inconsistent request shapes are part of the API risk the POC should surface.

### Where does Zero Trust fit if this is an AppSec sale?
It solves the adjacent exposure problem. AppSec protects public customer-facing routes. Access and Tunnel protect admin, preview, partner, and internal routes that should not be public. I keep it as a focused expansion motion rather than diluting the main AppSec proof.

### How does this integrate with Terraform, APIs, and CI/CD?
The operating model should move from a validated portal POC to versioned configuration through Cloudflare APIs or Terraform, with review, testing, staged deployment, and rollback. I would not make long-term production policy dependent on manual clicks.

### How do events reach our SIEM?
Cloudflare supports dashboard investigation and programmatic data paths such as Logpush and analytics APIs, depending on the product and entitlement. In a POC, we define which fields, destinations, retention, and correlation workflow the SOC needs, then validate end-to-end delivery rather than only showing a dashboard.

### What happens if Cloudflare has an outage?
Any inline platform becomes part of the availability design. The responsible answer is to review the customer’s availability objectives, Cloudflare service architecture, origin dependencies, change controls, and recovery runbook. I would not claim any provider eliminates all failure modes; the POC should validate operational readiness as well as feature behavior.

### Does security at the edge add latency?
Security processing is performed on Cloudflare’s distributed network, and the same platform can provide caching and delivery optimizations. The business answer is measured, not assumed: benchmark the critical journey before and during the POC, including tail latency, origin requests, and user experience.

### What exactly would make the POC successful?
One scoped application or API is onboarded safely; the team can see and explain attack traffic; high-confidence controls mitigate it without critical false positives; abusive requests reaching origin are reduced; the operational owners understand policy and rollback; and there is a defensible expansion plan.

### What would you show an executive after the POC?
The original business risk, measured traffic and attack findings, mitigations by control, origin impact, false-positive results, operational effort, remaining gaps, and a phased rollout recommendation tied to cost and risk. The executive readout should answer whether to expand, not merely list features used.

### Why not deploy broad blocking immediately?
Because safe security operations require application context and evidence. Broad blocking can create business impact faster than it creates security value. We can use deterministic controls immediately, but ambiguous or application-sensitive policy should move through observe, tune, challenge, and then block.
