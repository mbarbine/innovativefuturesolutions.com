export interface Env {
  ASSETS: Fetcher;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  SECURITY_DEPLOYED_AT?: string;
  WAF_RULE_STATUS?: string;
  WAF_RULE_ID?: string;
  BOT_POLICY_MODE?: string;
  API_DISCOVERY_STATUS?: string;
}

type JsonRecord = Record<string, unknown>;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const baseSecurityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com",
    "style-src 'self'",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com",
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
      operations: [
        { method: "GET", path: "/api/health", control: "public health" },
        { method: "GET", path: "/api/security-controls", control: "public control snapshot" },
        { method: "GET", path: "/api/demo/profile", control: "public synthetic data" },
        { method: "POST", path: "/api/demo/login", control: "Turnstile verified" },
      ],
    },
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
    version: "1.1.0",
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
    discoveryStatus: "available",
  };
}

const openapi = `openapi: 3.1.0
info:
  title: Innovative Future Solutions Application Security Demo
  version: 1.1.0
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
  /api/demo/profile:
    get:
      operationId: getDemoProfile
      summary: Return a public, synthetic demo profile
      responses:
        '200':
          description: Demo profile
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
`;

const llms = `# Innovative Future Solutions — Application Security Demo

An interactive slide deck and live Cloudflare edge-security demonstration.

Public surfaces:
- / — application-security slide deck
- /api/health — live edge status
- /api/security-controls — configured-control snapshot
- /api/demo/profile — safe API Discovery traffic target
- /openapi.yaml — API description

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

  if (url.pathname === "/api/demo/profile" && method === "GET") {
    return apiSuccess({
      id: "demo-visitor",
      role: "security-evaluator",
      dataClassification: "public synthetic demo data",
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
      documents: ["/llms.txt", "/llms-full.txt", "/openapi.yaml"],
    });
  }

  if (url.pathname === "/robots.txt" && method === "GET") {
    return new Response("User-agent: *\nAllow: /\nSitemap: https://innovativefuturesolutions.com/sitemap.xml\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (url.pathname === "/sitemap.xml" && method === "GET") {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://innovativefuturesolutions.com/</loc></url></urlset>\n',
      { headers: { "content-type": "application/xml; charset=utf-8" } },
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

  return env.ASSETS.fetch(request);
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
