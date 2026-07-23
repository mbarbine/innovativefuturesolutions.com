export interface Env {
  ASSETS: Fetcher;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  SECURITY_DEPLOYED_AT?: string;
  WAF_RULE_STATUS?: string;
  WAF_RULE_ID?: string;
  BOT_POLICY_MODE?: string;
  API_DISCOVERY_STATUS?: string;
  RATE_LIMIT_STATUS?: string;
  RATE_LIMIT_RULE_ID?: string;
}

type JsonRecord = Record<string, unknown>;

const APP_VERSION = "1.3.0";

const apiOperations = [
  { method: "GET", path: "/api/health", control: "public health" },
  { method: "GET", path: "/api/security-controls", control: "public control snapshot" },
  { method: "GET", path: "/api/demo/preflight", control: "live readiness evidence" },
  { method: "GET", path: "/api/demo/request-inspection", control: "redacted edge context" },
  { method: "GET", path: "/api/demo/profile", control: "public synthetic data" },
  { method: "GET", path: "/api/demo/burst-control", control: "edge rate limit target" },
  { method: "POST", path: "/api/demo/login", control: "Turnstile verified" },
  { method: "GET", path: "/api/docs", control: "public API documentation" },
] as const;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const baseSecurityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com 'sha256-nHTw4hvUfWu8zi0PApob3Z4kQVMpo1fdeRlvItmKS1U='",
    "style-src 'self'",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
    "img-src 'self' data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-permitted-cross-domain-policies": "none",
};

function requestId(request: Request): string {
  return (
    request.headers.get("x-request-id") ??
    request.headers.get("cf-ray") ??
    crypto.randomUUID()
  );
}

function withSecurityHeaders(response: Response, id: string): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(baseSecurityHeaders)) {
    headers.set(name, value);
  }
  headers.set("x-request-id", id);
  headers.set("server-timing", 'edge;desc="Cloudflare Worker"');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function json(data: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: jsonHeaders,
  });
}

function apiSuccess(data: JsonRecord, status = 200): Response {
  return json({ ok: true, data }, status);
}

function apiError(code: string, message: string, status: number, details: JsonRecord = {}): Response {
  return json({ ok: false, error: { code, message, details } }, status);
}

function publicConfig(env: Env): JsonRecord {
  return {
    turnstile: {
      configured: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET),
      siteKey: env.TURNSTILE_SITE_KEY ?? null,
      verification: env.TURNSTILE_SECRET ? "server-side" : "not-configured",
    },
  };
}

function securityControls(env: Env): JsonRecord {
  return {
    source: "Cloudflare deployment configuration snapshot",
    capturedAt: env.SECURITY_DEPLOYED_AT ?? null,
    waf: {
      status: env.WAF_RULE_STATUS ?? "unknown",
      ruleId: env.WAF_RULE_ID ? env.WAF_RULE_ID.slice(0, 8) + "…" : null,
      demoTarget: "/attack-lab?attack=xss&payload=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
    },
    bots: {
      mode: env.BOT_POLICY_MODE ?? "unknown",
      planNote:
        env.BOT_POLICY_MODE === "bot-fight-mode"
          ? "Bot Fight Mode is the available Cloudflare Free-plan bot control; bot-score rules require a higher plan."
          : "No configured bot-control snapshot is available.",
    },
    apiGateway: {
      status: env.API_DISCOVERY_STATUS ?? "unknown",
      note: "API Shield Endpoint Management is available on all plans. Worker-backed endpoint metrics may be unavailable.",
      operations: apiOperations,
    },
    rateLimit: {
      status: env.RATE_LIMIT_STATUS ?? "unknown",
      ruleId: env.RATE_LIMIT_RULE_ID ? env.RATE_LIMIT_RULE_ID.slice(0, 8) + "…" : null,
      demoTarget: "/api/demo/burst-control",
      policy: "5 requests per 10 seconds; block for 10 seconds",
    },
  };
}

function requestInspection(request: Request): JsonRecord {
  const url = new URL(request.url);
  const cf = request.cf as IncomingRequestCfProperties | undefined;
  return {
    observedAt: new Date().toISOString(),
    request: {
      method: request.method,
      scheme: url.protocol.replace(":", ""),
      host: url.host,
      path: url.pathname,
    },
    edge: {
      colo: cf?.colo ?? "unknown",
      country: cf?.country ?? "unknown",
      tlsVersion: cf?.tlsVersion ?? "unknown",
      httpProtocol: cf?.httpProtocol ?? "unknown",
    },
    execution: {
      workerExecuted: true,
      requestId: requestId(request),
      runtime: "Cloudflare Workers V8 isolate",
    },
    privacy: "No IP address, cookies, credentials, or request body are returned by this endpoint.",
  };
}

function preflight(env: Env, request: Request): JsonRecord {
  const url = new URL(request.url);
  const cf = request.cf as IncomingRequestCfProperties | undefined;
  const hostReady = ["innovativefuturesolutions.com", "www.innovativefuturesolutions.com"].includes(url.hostname);
  const tlsReady = url.protocol === "https:" && Boolean(cf?.tlsVersion && cf.tlsVersion !== "unknown");
  const checks = [
    {
      id: "worker",
      label: "Worker runtime",
      status: "pass",
      evidence: `${APP_VERSION} executed in ${cf?.colo ?? "local"}`,
    },
    {
      id: "domain",
      label: "Custom domain",
      status: hostReady ? "pass" : "warn",
      evidence: url.hostname,
    },
    {
      id: "tls",
      label: "HTTPS and TLS",
      status: tlsReady ? "pass" : "warn",
      evidence: cf?.tlsVersion ?? url.protocol,
    },
    {
      id: "waf",
      label: "WAF custom rule",
      status: env.WAF_RULE_STATUS === "active" ? "pass" : "warn",
      evidence: env.WAF_RULE_STATUS ?? "unknown",
    },
    {
      id: "bots",
      label: "Bot control",
      status: env.BOT_POLICY_MODE === "bot-fight-mode" ? "pass" : "warn",
      evidence: env.BOT_POLICY_MODE ?? "unknown",
    },
    {
      id: "turnstile",
      label: "Turnstile Siteverify",
      status: env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? "pass" : "warn",
      evidence: env.TURNSTILE_SECRET ? "server-side configured" : "not configured",
    },
    {
      id: "api",
      label: "API inventory",
      status: env.API_DISCOVERY_STATUS === "endpoint-management-configured" ? "pass" : "warn",
      evidence: `${apiOperations.length} declared operations`,
    },
    {
      id: "rate-limit",
      label: "API burst control",
      status: env.RATE_LIMIT_STATUS === "active" ? "pass" : "warn",
      evidence: env.RATE_LIMIT_STATUS === "active" ? "5 requests / 10 seconds" : env.RATE_LIMIT_STATUS ?? "unknown",
    },
  ];

  return {
    ready: checks.every((check) => check.status === "pass"),
    observedAt: new Date().toISOString(),
    evidenceMode: "live request plus deployment control snapshot",
    checks,
    limitations: [
      "Bot Fight Mode is the configured Free-plan control; Enterprise bot scores are not claimed.",
      "Worker-backed API Shield endpoint metrics may not populate even when endpoints are catalogued.",
      "Security Event details remain in the authenticated Cloudflare dashboard.",
      "Rate counters are scoped to Cloudflare data-center locations and can take a few seconds to propagate.",
    ],
  };
}

async function parseLoginBody(request: Request): Promise<{ username: string; token: string } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return {
        username: typeof body.username === "string" ? body.username.slice(0, 120) : "",
        token: typeof body.turnstileToken === "string" ? body.turnstileToken : "",
      };
    }

    const body = await request.formData();
    return {
      username: String(body.get("username") ?? "").slice(0, 120),
      token: String(body.get("cf-turnstile-response") ?? ""),
    };
  } catch {
    return null;
  }
}

async function verifyTurnstile(token: string, request: Request, secret: string): Promise<boolean> {
  const remoteIp = request.headers.get("cf-connecting-ip");
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);
  form.set("idempotency_key", crypto.randomUUID());

  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const result = (await verification.json()) as { success?: boolean };
  return result.success === true;
}

function health(env: Env, request: Request): JsonRecord {
  const cf = request.cf as IncomingRequestCfProperties | undefined;
  return {
    service: "innovative-future-solutions-security-demo",
    version: APP_VERSION,
    environment: "production",
    status: "healthy",
    timestamp: new Date().toISOString(),
    edge: {
      colo: cf?.colo ?? "unknown",
      country: cf?.country ?? "unknown",
      tlsVersion: cf?.tlsVersion ?? "unknown",
      httpProtocol: cf?.httpProtocol ?? "unknown",
    },
    turnstileStatus: env.TURNSTILE_SECRET ? "configured" : "degraded",
    wafStatus: env.WAF_RULE_STATUS ?? "unknown",
    botStatus: env.BOT_POLICY_MODE ?? "unknown",
    apiDiscoveryStatus: env.API_DISCOVERY_STATUS ?? "unknown",
    rateLimitStatus: env.RATE_LIMIT_STATUS ?? "unknown",
    discoveryStatus: "available",
  };
}

const openapi = `openapi: 3.1.0
info:
  title: Innovative Future Solutions Application Security Demo
  version: 1.3.0
  description: Public-safe endpoints used by the Cloudflare application-security walkthrough.
servers:
  - url: https://innovativefuturesolutions.com
paths:
  /api/health:
    get:
      operationId: getHealth
      summary: Return live edge and control health
      responses:
        '200':
          description: Healthy
  /api/security-controls:
    get:
      operationId: getSecurityControls
      summary: Return the deployment control snapshot
      responses:
        '200':
          description: Current configured control summary
  /api/demo/preflight:
    get:
      operationId: getDemoPreflight
      summary: Run public-safe readiness checks using live edge and configured-control evidence
      responses:
        '200':
          description: Readiness evidence
  /api/demo/request-inspection:
    get:
      operationId: inspectDemoRequest
      summary: Return redacted request and Cloudflare edge execution context
      responses:
        '200':
          description: Redacted edge request context
  /api/demo/profile:
    get:
      operationId: getDemoProfile
      summary: Return a public, synthetic demo profile
      responses:
        '200':
          description: Demo profile
  /api/demo/burst-control:
    get:
      operationId: getBurstControlTarget
      summary: Return a lightweight response until the edge rate limit blocks the request
      responses:
        '200': { description: Request reached the Worker }
        '429': { description: Request was rate limited at the Cloudflare edge }
  /api/demo/login:
    post:
      operationId: submitDemoLogin
      summary: Verify a Turnstile token; does not create a session
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, turnstileToken]
              properties:
                username: { type: string, maxLength: 120 }
                turnstileToken: { type: string }
      responses:
        '200': { description: Turnstile accepted }
        '400': { description: Invalid request or Turnstile token }
        '503': { description: Turnstile is not configured }
  /api/mcp:
    get:
      operationId: getMcpMetadata
      summary: Return public MCP server metadata
      responses:
        '200': { description: MCP metadata }
    post:
      operationId: callMcp
      summary: Call the public read-only MCP server
      responses:
        '200': { description: JSON-RPC response }
`;

const llms = `# Innovative Future Solutions — Application Security Demo

An interactive slide deck and live Cloudflare edge-security demonstration.

Public surfaces:
- / — application-security slide deck
- /api/health — live edge status
- /api/security-controls — configured-control snapshot
- /api/demo/preflight — live readiness evidence
- /api/demo/request-inspection — redacted edge execution context
- /api/demo/profile — safe API Discovery traffic target
- /api/demo/burst-control — isolated edge rate-limit proof target
- /api/mcp — read-only MCP discovery and JSON-RPC endpoint
- /openapi.yaml — API description
- /.well-known/mcp.json — MCP discovery manifest
- /.well-known/agents.json — public agent policy
- /rss.xml — application-security update feed

The /api/demo/login endpoint validates Cloudflare Turnstile tokens server-side and never creates a real user session.
`;

async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if ((url.pathname === "/api/health" || url.pathname === "/api/v1/health") && method === "GET") {
    return apiSuccess(health(env, request));
  }

  if (url.pathname === "/api/config" && method === "GET") {
    return apiSuccess(publicConfig(env));
  }

  if (url.pathname === "/api/security-controls" && method === "GET") {
    return apiSuccess(securityControls(env));
  }

  if (url.pathname === "/api/demo/preflight" && method === "GET") {
    return apiSuccess(preflight(env, request));
  }

  if (url.pathname === "/api/demo/request-inspection" && method === "GET") {
    return apiSuccess(requestInspection(request));
  }

  if (url.pathname === "/api/demo/profile" && method === "GET") {
    return apiSuccess({
      id: "demo-visitor",
      role: "security-evaluator",
      dataClassification: "public synthetic demo data",
    });
  }

  if (url.pathname === "/api/demo/burst-control" && method === "GET") {
    const cf = request.cf as IncomingRequestCfProperties | undefined;
    return apiSuccess({
      allowed: true,
      meaning: "This request reached Worker code. A 429 response proves the edge rate limit acted first.",
      observedAt: new Date().toISOString(),
      edge: { colo: cf?.colo ?? "unknown" },
      requestId: requestId(request),
    });
  }

  if (url.pathname === "/api/demo/login" && method === "POST") {
    if (!env.TURNSTILE_SECRET) {
      return apiError("TURNSTILE_NOT_CONFIGURED", "Turnstile verification is unavailable.", 503);
    }

    const body = await parseLoginBody(request);
    if (!body?.username || !body.token) {
      return apiError("INVALID_LOGIN_DEMO_REQUEST", "Username and Turnstile token are required.", 400);
    }

    const valid = await verifyTurnstile(body.token, request, env.TURNSTILE_SECRET);
    if (!valid) {
      return apiError("TURNSTILE_REJECTED", "Cloudflare Turnstile rejected the token.", 400);
    }

    return apiSuccess({
      verified: true,
      username: body.username,
      message: "Human verification succeeded. This demo intentionally creates no account or session.",
    });
  }

  if (url.pathname === "/api/docs" && method === "GET") {
    return apiSuccess({
      title: "Innovative Future Solutions Application Security Demo API",
      openapi: "https://innovativefuturesolutions.com/openapi.yaml",
      purpose: "Support live, public-safe edge security demonstrations.",
    });
  }

  if (url.pathname === "/api/mcp" && method === "GET") {
    return apiSuccess({
      name: "innovative-future-solutions-security-demo",
      protocolVersion: "2025-06-18",
      endpoint: "https://innovativefuturesolutions.com/api/mcp",
      capabilities: { tools: true },
      tools: ["get_security_controls", "get_demo_preflight"],
    });
  }

  if (url.pathname === "/api/mcp" && method === "POST") {
    const payload = await request.json().catch(() => null) as { jsonrpc?: string; id?: string | number | null; method?: string } | null;
    if (!payload || payload.jsonrpc !== "2.0" || !payload.method) {
      return json({ jsonrpc: "2.0", id: payload?.id ?? null, error: { code: -32600, message: "Invalid Request" } }, 400);
    }
    const result = payload.method === "initialize"
      ? { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "innovative-future-solutions-security-demo", version: APP_VERSION } }
      : payload.method === "tools/list"
        ? { tools: [
            { name: "get_security_controls", description: "Return the public Cloudflare control snapshot", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
            { name: "get_demo_preflight", description: "Return public demo readiness evidence", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
          ] }
        : payload.method === "ping"
          ? {}
          : null;
    if (result === null) {
      return json({ jsonrpc: "2.0", id: payload.id ?? null, error: { code: -32601, message: "Method not found" } });
    }
    return json({ jsonrpc: "2.0", id: payload.id ?? null, result });
  }

  if (url.pathname === "/openapi.yaml" && method === "GET") {
    return new Response(openapi, { headers: { "content-type": "application/yaml; charset=utf-8" } });
  }

  if ((url.pathname === "/llms.txt" || url.pathname === "/llms-full.txt") && method === "GET") {
    return new Response(llms, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (url.pathname === "/llms-index.json" && method === "GET") {
    return json({
      name: "Innovative Future Solutions Application Security Demo",
      canonical: "https://innovativefuturesolutions.com/",
      documents: ["/llms.txt", "/llms-full.txt", "/openapi.yaml", "/.well-known/mcp.json", "/.well-known/agents.json", "/rss.xml"],
    });
  }

  if (url.pathname === "/.well-known/mcp.json" && method === "GET") {
    return json({
      name: "innovative-future-solutions-security-demo",
      description: "Read-only Cloudflare application-security demo evidence",
      protocolVersion: "2025-06-18",
      endpoint: "https://innovativefuturesolutions.com/api/mcp",
      transport: "streamable-http",
      capabilities: ["tools"],
    });
  }

  if (url.pathname === "/.well-known/agents.json" && method === "GET") {
    return json({
      name: "Innovative Future Solutions Application Security Demo",
      canonical: "https://innovativefuturesolutions.com/",
      policy: "Public read-only discovery and synthetic demo evidence; no credentials, accounts, or sessions are exposed.",
      allowed: ["read public documentation", "inspect synthetic control evidence", "call read-only MCP tools"],
      prohibited: ["credential collection", "private data access", "state-changing automation"],
    });
  }

  if (url.pathname === "/robots.txt" && method === "GET") {
    return new Response("User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: https://innovativefuturesolutions.com/sitemap.xml\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (url.pathname === "/sitemap.xml" && method === "GET") {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://innovativefuturesolutions.com/</loc><lastmod>2026-07-22</lastmod></url></urlset>\n',
      { headers: { "content-type": "application/xml; charset=utf-8" } },
    );
  }

  if ((url.pathname === "/rss.xml" || url.pathname === "/atom.xml") && method === "GET") {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Innovative Future Solutions Application Security</title><link>https://innovativefuturesolutions.com/</link><description>Cloudflare application-security demo releases and evidence updates.</description><lastBuildDate>Wed, 22 Jul 2026 00:00:00 GMT</lastBuildDate><item><title>Guided Cloudflare canary demo</title><link>https://innovativefuturesolutions.com/#/10</link><guid isPermaLink="true">https://innovativefuturesolutions.com/#/10</guid><pubDate>Wed, 22 Jul 2026 00:00:00 GMT</pubDate><description>Added guided JSON graph handoffs for live security-control evidence.</description></item></channel></rss>\n',
      { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
    );
  }

  if (url.pathname === "/.well-known/security.txt" && method === "GET") {
    return new Response(
      "Canonical: https://innovativefuturesolutions.com/.well-known/security.txt\nExpires: 2027-07-21T23:59:59Z\nPolicy: https://innovativefuturesolutions.com/#/security\n",
      { headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  if (url.pathname === "/.well-known/trust.json" && method === "GET") {
    return json({
      service: "innovative-future-solutions-security-demo",
      publicRead: true,
      protectedActions: ["Turnstile-verified demo login"],
      dataBoundary: "Public synthetic demo data only; no accounts or sessions are created.",
      edgeProvider: "Cloudflare",
    });
  }

  if (url.pathname.startsWith("/api/")) {
    return apiError("NOT_FOUND", "No API route matches this request.", 404);
  }

  const assetResponse = await env.ASSETS.fetch(request);
  if (method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const headers = new Headers(assetResponse.headers);
    headers.set("cache-control", "no-store");
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  }

  return assetResponse;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const id = requestId(request);
  try {
    return withSecurityHeaders(await routeRequest(request, env), id);
  } catch {
    return withSecurityHeaders(
      apiError("INTERNAL_ERROR", "The request could not be completed.", 500),
      id,
    );
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
