import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";
import appJs from "../public/app.js?raw";
import indexHtml from "../public/index.html?raw";
import themeLoader from "../public/theme.js?raw";
import privateSidecar from "../tools/cloudflare-appsec-final-sidecar.html?raw";

function env(overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: {
      fetch: async () => new Response("asset", { status: 200 }),
      connect: () => {
        throw new Error("not implemented");
      },
    },
    ...overrides,
  } as Env;
}

describe("application security worker", () => {
  it("keeps static page dependencies and structured data compatible with the CSP", async () => {
    const structuredData = indexHtml.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];

    expect(indexHtml).not.toContain("fonts.googleapis.com");
    expect(indexHtml).not.toContain("fonts.gstatic.com");
    expect(indexHtml).toContain(
      '<link id="deck-theme" rel="stylesheet" href="/styles.css?v=20260730.5" />',
    );
    expect(indexHtml).toContain(
      '<link rel="stylesheet" href="/presentation-hotfix.css?v=20260730.5" />',
    );
    expect(indexHtml).toContain('<script src="/theme.js?v=20260730.5"></script>');
    expect(indexHtml).toContain(
      '<script src="/app.js?v=20260730.5" type="module"></script>',
    );
    expect(themeLoader).toContain('params.get("theme") === "original"');
    expect(themeLoader).toContain('? `/styles-modern.css${version}` : `/styles.css${version}`');
    expect(themeLoader).toContain('document.getElementById("deck-theme")');
    expect(themeLoader).toContain('`/styles-modern.css${version}`');
    expect(structuredData).toBeDefined();

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(structuredData),
    );
    const hash = `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/health"),
      env(),
    );

    expect(response.headers.get("content-security-policy")).toContain(`'${hash}'`);
  });

  it("returns a standard health envelope and security headers", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/health"),
      env({ WAF_RULE_STATUS: "active" }),
    );
    const body = await response.json() as { ok: boolean; data: { wafStatus: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.wafStatus).toBe("active");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("strict-transport-security")).toContain("includeSubDomains");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("content-security-policy")).toContain("https://static.cloudflareinsights.com");
    const csp = response.headers.get("content-security-policy") ?? "";
    const scriptSrc = csp.split(";").find((directive) => directive.trim().startsWith("script-src "));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("script-src-elem 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com 'unsafe-inline'");
  });

  it("tombstones the removed public speaker notes before stale assets can respond", async () => {
    const response = await handleRequest(
      new Request(
        "https://innovativefuturesolutions.com/downloads/cloudflare-application-security-speaker-notes.docx",
      ),
      env(),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("Not found");
  });

  it("prevents the versioned deck shell from being served stale", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/"),
      env(),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("asset");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects login attempts when Turnstile is not configured", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "demo", turnstileToken: "token" }),
      }),
      env(),
    );
    const body = await response.json() as { ok: boolean; error: { code: string } };

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("TURNSTILE_NOT_CONFIGURED");
  });

  it("does not expose full Cloudflare rule identifiers", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/security-controls"),
      env({ WAF_RULE_ID: "1234567890abcdef", WAF_RULE_STATUS: "active" }),
    );
    const text = await response.text();

    expect(text).toContain("12345678…");
    expect(text).not.toContain("1234567890abcdef");
  });

  it("returns the configured API operation inventory", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/security-controls"),
      env({ API_DISCOVERY_STATUS: "endpoint-management-configured" }),
    );
    const body = await response.json() as {
      ok: boolean;
      data: { apiGateway: { operations: Array<{ method: string; path: string }> } };
    };

    expect(body.ok).toBe(true);
    expect(body.data.apiGateway.operations).toHaveLength(8);
    expect(body.data.apiGateway.operations).toContainEqual({
      method: "POST",
      path: "/api/demo/login",
      control: "Turnstile verified",
    });
    expect(body.data.apiGateway.operations).toContainEqual({
      method: "GET",
      path: "/cf-demo/rate-limit",
      control: "dedicated edge rate-limit proof target",
    });
  });

  it("exposes an isolated, lightweight rate-limit target", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/cf-demo/rate-limit"),
      env({ RATE_LIMIT_STATUS: "active" }),
    );
    const body = await response.json() as { ok: boolean; data: { allowed: boolean; meaning: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.allowed).toBe(true);
    expect(body.data.meaning).toContain("429 response proves");
  });

  it("supports the private helper's dedicated baseline, WAF, and API paths without overstating native enforcement", async () => {
    const baseline = await handleRequest(
      new Request("https://innovativefuturesolutions.com/cf-demo/normal"),
      env(),
    );
    const wafFallback = await handleRequest(
      new Request("https://innovativefuturesolutions.com/cf-demo/attack"),
      env(),
    );
    const validApi = await handleRequest(
      new Request("https://innovativefuturesolutions.com/cf-demo/api?id=42&verbose=false"),
      env(),
    );
    const invalidApi = await handleRequest(
      new Request("https://innovativefuturesolutions.com/cf-demo/api?id=not-an-integer"),
      env(),
    );

    expect(baseline.status).toBe(200);
    expect(await baseline.text()).toContain("public-safe request reached Worker code");
    expect(wafFallback.status).toBe(200);
    expect(await wafFallback.text()).toContain("Only an edge 403 plus a fresh Security Event");
    expect(validApi.status).toBe(200);
    expect(await validApi.text()).toContain("Worker fallback");
    expect(invalidApi.status).toBe(400);
    expect(await invalidApi.text()).toContain("not proof that native API Shield");
  });

  it.each([
    ["bot-fight-mode", "Bot Fight Mode"],
    ["super-bot-fight-mode", "Super Bot Fight Mode"],
    ["bot-management", "Bot Management"],
    ["enterprise-bot-management", "Enterprise Bot Management"],
  ])("recognizes configured bot mode %s without inferring a plan", async (mode, label) => {
    const controls = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/security-controls"),
      env({ BOT_POLICY_MODE: mode }),
    );
    const preflight = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/preflight"),
      env({ BOT_POLICY_MODE: mode }),
    );
    const controlsText = await controls.text();
    const preflightBody = await preflight.json() as {
      data: { checks: Array<{ id: string; status: string; evidence: string }> };
    };

    expect(controlsText).toContain(label);
    expect(controlsText).toContain("Verify current dashboard state");
    expect(controlsText).not.toMatch(/free[- ]plan/i);
    expect(preflightBody.data.checks).toContainEqual({
      id: "bots",
      label: "Bot control",
      status: "pass",
      evidence: label,
    });
  });

  it("warns when bot configuration is unknown", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/preflight"),
      env({ BOT_POLICY_MODE: "unknown" }),
    );
    const body = await response.json() as {
      data: { checks: Array<{ id: string; status: string; evidence: string }> };
    };

    expect(body.data.checks).toContainEqual({
      id: "bots",
      label: "Bot control",
      status: "warn",
      evidence: "Verify current dashboard state",
    });
  });

  it("publishes the 20-slide final deck with bounded live proof controls", () => {
    const titles = [...indexHtml.matchAll(/<section class="slide[^"]*" data-title="([^"]+)"/g)];

    expect(titles).toHaveLength(20);
    expect(indexHtml).toContain('data-title="Why Cloudflare"');
    expect(indexHtml).toContain('data-title="Three applications"');
    expect(indexHtml).toContain('data-title="DNS TLS and Worker context"');
    expect(indexHtml).toContain('data-title="POC outcomes"');
    expect(indexHtml).toContain('data-title="POC truth boundary"');
    expect(indexHtml).toContain('data-title="Source anchors"');
    expect(indexHtml).toContain("two-week POC");
    expect(indexHtml).not.toContain("30-day");
    expect(indexHtml).toContain('data-action="safe-request"');
    expect(indexHtml).toContain('data-action="attack-request"');
    expect(indexHtml).toContain('data-action="run-burst"');
    expect(indexHtml).toContain('data-api-path="/api/health"');
    expect(indexHtml).toContain('href="/openapi.yaml"');
    expect(indexHtml).toContain('data-dashboard-link="securityEvents"');
    expect(indexHtml).toContain("Illustrative role-play baseline and targets for discovery");
    expect(indexHtml).toContain("LIVE CLOUDFLARE VIEWS");
    expect(indexHtml).toContain("18%");
    expect(indexHtml).toContain("45 MIN");
    expect(indexHtml).toContain("3–5 DAYS");
    expect(indexHtml).not.toContain("Download notes");
    expect(indexHtml).not.toContain("Never improvise a fact");
    expect(indexHtml).not.toContain("cloudflare-application-security-speaker-notes");
  });

  it("keeps the final private sidecar out of public assets with the required operator utilities", () => {
    expect(privateSidecar).toContain("Cloudflare AppSec — Final Private Sidecar");
    expect(privateSidecar).toContain("30:00");
    expect(privateSidecar).toContain("Searchable customer Q&amp;A");
    expect(privateSidecar).toContain("cloudflare-appsec-discovery-notes");
    expect(privateSidecar).toContain("CHECKPOINT");
    expect(privateSidecar).toContain("/workers/services/view/platphorm-quake-room-state/production/observability/events");
    expect(privateSidecar).toContain("Three applications");
    expect(privateSidecar).toContain("/workers/services/view/platphorm-json-canary/production");
    expect(privateSidecar).toContain("Workers & Pages fallback");
  });

  it("keeps fullscreen controls interactive with a CSS fallback and copies Windows-safe cURL", () => {
    expect(appJs).toContain("if (presenterDialog?.open) presenterDialog.close()");
    expect(appJs).toContain("webkitRequestFullscreen");
    expect(appJs).toContain("webkitExitFullscreen");
    expect(appJs).toContain("setPresentationFallback(true");
    expect(appJs).toContain('document.addEventListener("fullscreenchange", syncFullscreenUi)');
    expect(appJs).toContain("isTextEntryElement(document.activeElement)");
    expect(appJs).toContain('curl.exe -i "${window.location.origin}/attack-lab');
    expect(appJs).not.toContain("curl -i '${window.location.origin}");
  });

  it("initializes one truth-bound Cloudflare dashboard-link registry", () => {
    expect(appJs).toContain('const CLOUDFLARE_ZONE = "innovativefuturesolutions.com"');
    expect(appJs).toContain("function initializeDashboardLinks()");
    expect(appJs).toContain("/security/analytics/traffic");
    expect(appJs).toContain("/security/analytics/events");
    expect(appJs).toContain("/security/waf/managed-rules");
    expect(appJs).toContain("/security/waf/custom-rules");
    expect(appJs).toContain("/security/waf/rate-limiting-rules");
    expect(appJs).toContain("/ssl-tls/edge-certificates");
    expect(appJs).toContain("/workers/services/view/innovative-future-solutions-security-demo/production/observability/events");
    expect(appJs).toContain("/workers/services/view/platphorm-json-canary/production");
    expect(appJs).toContain('quakeCanonical: "https://quake.innovativefuturesolutions.com"');
    expect(appJs).toContain('zeroTrustHome: "https://dash.cloudflare.com/one/"');
    expect(appJs).toContain("/one/access/apps");
    expect(appJs).toContain("/one/networks/connectors");
    expect(appJs).toContain('link.rel = "noopener noreferrer"');
  });

  it("returns a public-safe preflight matrix backed by configuration state", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/preflight"),
      env({
        WAF_RULE_STATUS: "active",
        BOT_POLICY_MODE: "bot-fight-mode",
        TURNSTILE_SITE_KEY: "public-site-key",
        TURNSTILE_SECRET: "server-secret",
        API_DISCOVERY_STATUS: "endpoint-management-configured",
      }),
    );
    const body = await response.json() as {
      ok: boolean;
      data: { checks: Array<{ id: string; status: string; evidence: string }> };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.checks).toHaveLength(8);
    expect(body.data.checks).toContainEqual({
      id: "waf",
      label: "WAF custom rule",
      status: "pass",
      evidence: "active",
    });
    expect(JSON.stringify(body)).not.toContain("server-secret");
  });

  it("returns redacted edge request evidence without sensitive headers", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/request-inspection", {
        headers: {
          authorization: "Bearer should-never-appear",
          cookie: "session=should-never-appear",
          "x-forwarded-for": "192.0.2.10",
        },
      }),
      env(),
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Cloudflare Workers V8 isolate");
    expect(text).toContain("No IP address, cookies, credentials, or request body");
    expect(text).not.toContain("should-never-appear");
    expect(text).not.toContain("192.0.2.10");
  });

  it("publishes valid agent, MCP, feed, robots, and sitemap discovery surfaces", async () => {
    const mcp = await handleRequest(new Request("https://innovativefuturesolutions.com/.well-known/mcp.json"), env());
    const agents = await handleRequest(new Request("https://innovativefuturesolutions.com/.well-known/agents.json"), env());
    const feed = await handleRequest(new Request("https://innovativefuturesolutions.com/rss.xml"), env());
    const robots = await handleRequest(new Request("https://innovativefuturesolutions.com/robots.txt"), env());
    const sitemap = await handleRequest(new Request("https://innovativefuturesolutions.com/sitemap.xml"), env());

    expect(await mcp.json()).toMatchObject({ endpoint: "https://innovativefuturesolutions.com/api/mcp" });
    expect(await agents.json()).toMatchObject({ canonical: "https://innovativefuturesolutions.com/" });
    expect(feed.headers.get("content-type")).toContain("application/rss+xml");
    expect(await feed.text()).toContain("<rss version=\"2.0\">");
    expect(await robots.text()).toContain("User-agent: GPTBot\nAllow: /");
    expect(await sitemap.text()).toContain("<lastmod>2026-07-22</lastmod>");
  });

  it("serves a minimal read-only MCP protocol surface", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
      env(),
    );
    const body = await response.json() as { result: { tools: Array<{ name: string }> } };

    expect(response.status).toBe(200);
    expect(body.result.tools.map((tool) => tool.name)).toEqual(["get_security_controls", "get_demo_preflight"]);
  });

  it("returns a standard error for unknown API routes", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/missing"),
      env(),
    );
    const body = await response.json() as { ok: boolean; error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
