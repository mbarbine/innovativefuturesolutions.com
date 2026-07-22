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
