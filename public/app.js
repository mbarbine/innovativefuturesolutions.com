const slides = [...document.querySelectorAll(".slide")];
const progress = document.querySelector("#progress");
const slideCount = document.querySelector("#slide-count");
let current = 0;
let touchStartX = null;
let turnstileToken = "";
let turnstileWidgetId = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function routeNumber() {
  const match = window.location.hash.match(/^#\/(\d+)$/);
  return match ? clamp(Number(match[1]) - 1, 0, slides.length - 1) : 0;
}

function showSlide(index, updateHash = true) {
  const next = clamp(index, 0, slides.length - 1);
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("was-active", slideIndex < next);
    slide.classList.toggle("is-active", slideIndex === next);
    slide.setAttribute("aria-hidden", String(slideIndex !== next));
  });
  current = next;
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  slideCount.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  document.title = `${slides[current].dataset.title} — Innovative Future Solutions`;
  if (updateHash) history.replaceState(null, "", `#/${current + 1}`);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

async function getJson(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  return { response, body };
}

async function loadHealth() {
  setText('[data-live="health"]', "Checking edge…");
  try {
    const { body } = await getJson("/api/health", { cache: "no-store" });
    const data = body.data;
    setText('[data-live="health"]', data.status === "healthy" ? "Healthy at edge" : data.status);
    setText('[data-live="service"]', data.service);
    setText('[data-live="colo"]', data.edge.colo);
    setText('[data-live="tls"]', data.edge.tlsVersion);
    setText('[data-live="protocol"]', data.edge.httpProtocol);
  } catch {
    setText('[data-live="health"]', "Edge check unavailable");
  }
}

async function loadControls() {
  try {
    const { body } = await getJson("/api/security-controls", { cache: "no-store" });
    const controls = body.data;
    setText('[data-live="waf-status"]', controls.waf.status);
    setText('[data-live="waf-rule"]', controls.waf.ruleId ? `Rule ${controls.waf.ruleId}` : "No rule snapshot available");
    setText('[data-live="bot-mode"]', controls.bots.mode.replaceAll("-", " "));
    setText('[data-live="api-status"]', controls.apiGateway.status.replaceAll("-", " "));
  } catch {
    setText('[data-live="waf-status"]', "unknown");
    setText('[data-live="bot-mode"]', "unknown");
    setText('[data-live="api-status"]', "status unavailable");
  }
}

function recordEvent(ray, time) {
  const evidence = { ray, time };
  sessionStorage.setItem("waf-evidence", JSON.stringify(evidence));
  setText('[data-result="ray"]', ray || "Ray ID unavailable");
  setText('[data-result="time"]', time);
}

function restoreEvent() {
  try {
    const evidence = JSON.parse(sessionStorage.getItem("waf-evidence"));
    if (evidence?.time) recordEvent(evidence.ray, evidence.time);
  } catch {
    // Session evidence is optional and public-safe.
  }
}

async function runProbe(type) {
  const output = document.querySelector('[data-result="output"]');
  const badge = document.querySelector('[data-result="badge"]');
  const isAttack = type === "attack";
  const path = isAttack
    ? "/attack-lab?attack=xss&payload=%3Cscript%3Ealert(1)%3C%2Fscript%3E"
    : "/api/demo/profile";

  output.textContent = `GET ${path}\n\nSending request through Cloudflare…`;
  badge.textContent = "WAIT";
  try {
    const response = await fetch(path, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "unknown";
    const ray = response.headers.get("cf-ray") || response.headers.get("x-request-id") || "unavailable";
    const body = (await response.text()).slice(0, 380).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const time = new Date().toISOString();
    const blocked = response.status === 403 || response.status === 1020;
    badge.textContent = blocked ? "BLOCKED" : `${response.status}`;
    output.textContent = [
      `GET ${path}`,
      `HTTP ${response.status} ${blocked ? "BLOCKED AT EDGE" : response.statusText}`,
      `content-type: ${contentType}`,
      `cf-ray / request-id: ${ray}`,
      "",
      body || "Response body intentionally omitted by edge policy.",
    ].join("\n");
    if (isAttack) recordEvent(ray, time);
  } catch (error) {
    badge.textContent = "ERROR";
    output.textContent = `Request could not be completed.\n${error instanceof Error ? error.message : "Unknown browser error"}`;
  }
}

async function setupTurnstile() {
  const box = document.querySelector("#turnstile-widget");
  try {
    const { body } = await getJson("/api/config", { cache: "no-store" });
    const config = body.data.turnstile;
    if (!config.configured || !config.siteKey) {
      box.textContent = "Turnstile is not configured on this deployment.";
      return;
    }

    for (let attempt = 0; attempt < 40 && !window.turnstile; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!window.turnstile) throw new Error("Turnstile client did not load");

    box.textContent = "";
    turnstileWidgetId = window.turnstile.render(box, {
      sitekey: config.siteKey,
      theme: "dark",
      size: "flexible",
      callback(token) {
        turnstileToken = token;
      },
      "expired-callback"() {
        turnstileToken = "";
      },
    });
  } catch {
    box.textContent = "Turnstile is temporarily unavailable.";
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const result = document.querySelector("#login-result");
  const username = document.querySelector("#username").value.trim();
  if (!turnstileToken) {
    result.textContent = "Complete the Turnstile check before submitting.";
    return;
  }

  result.textContent = "Validating token at Cloudflare…";
  try {
    const { response, body } = await getJson("/api/demo/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, turnstileToken }),
    });
    result.textContent = response.ok ? body.data.message : body.error.message;
  } catch {
    result.textContent = "The Turnstile validation request failed.";
  } finally {
    turnstileToken = "";
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  }
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "next") showSlide(current + 1);
  if (action === "previous") showSlide(current - 1);
  if (action === "refresh-health") loadHealth();
  if (action === "safe-request") runProbe("safe");
  if (action === "attack-request") runProbe("attack");
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    showSlide(current + 1);
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    showSlide(current - 1);
  }
  if (event.key === "Home") showSlide(0);
  if (event.key === "End") showSlide(slides.length - 1);
});

document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  if (Math.abs(distance) > 70) showSlide(current + (distance < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

window.addEventListener("hashchange", () => showSlide(routeNumber(), false));
document.querySelector("#demo-login").addEventListener("submit", submitLogin);

showSlide(routeNumber(), false);
restoreEvent();
loadHealth();
loadControls();
setupTurnstile();
