const slides = [...document.querySelectorAll(".slide")];
const slideCount = document.querySelector("#slide-count");
const chapterNav = document.querySelector("#chapter-nav");
const slideAnnouncer = document.querySelector("#slide-announcer");
const previousButton = document.querySelector('[data-action="previous"]');
const nextButtons = [...document.querySelectorAll('[data-action="next"]')];
let current = 0;
let touchStartX = null;
let turnstileToken = "";
let turnstileWidgetId = null;

const chapterButtons = slides.map((slide, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.slideIndex = String(index);
  button.textContent = String(index + 1).padStart(2, "0");
  button.title = `${index + 1}. ${slide.dataset.title}`;
  button.setAttribute("aria-label", `Go to slide ${index + 1}: ${slide.dataset.title}`);
  chapterNav.append(button);
  return button;
});

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
    const active = slideIndex === next;
    slide.classList.toggle("was-active", slideIndex < next);
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
    if (active) slide.scrollTop = 0;
  });
  current = next;
  chapterButtons.forEach((button, index) => {
    button.classList.toggle("is-active", index === current);
    button.classList.toggle("is-complete", index < current);
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  slideCount.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  document.title = `${slides[current].dataset.title} — Innovative Future Solutions`;
  slideAnnouncer.textContent = `Slide ${current + 1} of ${slides.length}: ${slides[current].dataset.title}`;
  previousButton.disabled = current === 0;
  nextButtons.forEach((button) => { button.disabled = current === slides.length - 1; });
  if (updateHash) history.replaceState(null, "", `#/${current + 1}`);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function setHud(name, value, live = true) {
  const element = document.querySelector(`[data-hud="${name}"]`);
  if (!element) return;
  element.textContent = value;
  element.parentElement?.classList.toggle("is-live", live);
}

function setRunner(stage, state) {
  const element = document.querySelector(`[data-runner="${stage}"]`);
  if (!element) return;
  element.classList.remove("is-active", "is-complete", "is-blocked");
  if (state) element.classList.add(state);
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
    setHud("worker", data.status === "healthy" ? "healthy" : data.status, data.status === "healthy");
    setHud("tls", data.edge.tlsVersion, data.edge.tlsVersion !== "unknown");
    setHud("edge", `${data.edge.colo} edge`, data.edge.colo !== "unknown");
  } catch {
    setText('[data-live="health"]', "Edge check unavailable");
    setHud("worker", "unavailable", false);
    setHud("tls", "unknown", false);
    setHud("edge", "Edge unavailable", false);
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
    setHud("waf", controls.waf.status, controls.waf.status === "active");
    setHud("bots", controls.bots.mode === "bot-fight-mode" ? "on" : controls.bots.mode, controls.bots.mode !== "unknown");
    const operationCount = Array.isArray(controls.apiGateway.operations) ? controls.apiGateway.operations.length : 0;
    setHud("api", operationCount ? `${operationCount} routes` : controls.apiGateway.status.replaceAll("-", " "), controls.apiGateway.status !== "unknown");
  } catch {
    setText('[data-live="waf-status"]', "unknown");
    setText('[data-live="bot-mode"]', "unknown");
    setText('[data-live="api-status"]', "status unavailable");
    setHud("waf", "unknown", false);
    setHud("bots", "unknown", false);
    setHud("api", "unknown", false);
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

  setRunner(isAttack ? "attack" : "baseline", "is-active");
  output.textContent = `REQUEST  GET ${path}\n\nSending through Cloudflare's edge…`;
  badge.textContent = "WAIT";
  try {
    const response = await fetch(path, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "unknown";
    const ray = response.headers.get("cf-ray") || response.headers.get("x-request-id") || "unavailable";
    await response.body?.cancel();
    const time = new Date().toISOString();
    const blocked = response.status === 403 || response.status === 1020;
    badge.textContent = blocked ? "BLOCKED" : `${response.status}`;
    output.textContent = blocked
      ? [
          `REQUEST   GET ${path}`,
          "DECISION  BLOCK",
          "LAYER     Cloudflare WAF custom rule",
          `STATUS    ${response.status}`,
          `RAY ID    ${ray}`,
          "ORIGIN    Worker not invoked",
        ].join("\n")
      : [
          `REQUEST   GET ${path}`,
          "DECISION  ALLOW",
          `STATUS    ${response.status}`,
          `TYPE      ${contentType}`,
          `RAY ID    ${ray}`,
          "ORIGIN    Worker executed",
        ].join("\n");
    if (isAttack) {
      setRunner("attack", blocked ? "is-blocked" : "is-complete");
      setRunner("evidence", blocked ? "is-complete" : "is-blocked");
      if (blocked) recordEvent(ray, time);
    } else {
      setRunner("baseline", response.ok ? "is-complete" : "is-blocked");
    }
    return { blocked, response, ray, time };
  } catch (error) {
    badge.textContent = "ERROR";
    output.textContent = `Request could not be completed.\n${error instanceof Error ? error.message : "Unknown browser error"}`;
    setRunner(isAttack ? "attack" : "baseline", "is-blocked");
    return null;
  }
}

async function setupTurnstile() {
  const box = document.querySelector("#turnstile-widget");
  try {
    const { body } = await getJson("/api/config", { cache: "no-store" });
    const config = body.data.turnstile;
    if (!config.configured || !config.siteKey) {
      box.textContent = "Turnstile is not configured on this deployment.";
      setHud("turnstile", "degraded", false);
      return;
    }

    setHud("turnstile", "ready", true);

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
    setHud("turnstile", "unavailable", false);
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
  if (action === "view-event") showSlide(6);
  const slideIndex = event.target.closest("[data-slide-index]")?.dataset.slideIndex;
  if (slideIndex !== undefined) showSlide(Number(slideIndex));
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
