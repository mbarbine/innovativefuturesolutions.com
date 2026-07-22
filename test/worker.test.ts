import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";

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
  });

  it("exposes an isolated, lightweight rate-limit target", async () => {
    const response = await handleRequest(
      new Request("https://innovativefuturesolutions.com/api/demo/burst-control"),
      env({ RATE_LIMIT_STATUS: "active" }),
    );
    const body = await response.json() as { ok: boolean; data: { allowed: boolean; meaning: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.allowed).toBe(true);
    expect(body.data.meaning).toContain("429 response proves");
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
