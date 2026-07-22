const slides = [...document.querySelectorAll(".slide")];
const slideCount = document.querySelector("#slide-count");
const chapterNav = document.querySelector("#chapter-nav");
const slideAnnouncer = document.querySelector("#slide-announcer");
const previousButton = document.querySelector('[data-action="previous"]');
const nextButtons = [...document.querySelectorAll('[data-action="next"]')];
const presenterDialog = document.querySelector("#presenter-console");
const presenterOutput = document.querySelector("#presenter-output");
const preflightGrid = document.querySelector("#preflight-grid");
const timerDisplays = [...document.querySelectorAll("#presenter-timer, [data-nav-timer]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let current = 0;
let touchStartX = null;
let turnstileToken = "";
let turnstileWidgetId = null;
let timerStartedAt = null;
let timerElapsedMs = 0;
let timerInterval = null;
let pipelineRunId = 0;
let burstRunId = 0;

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
  setText("[data-presenter-slide]", `${String(current + 1).padStart(2, "0")} · ${slides[current].dataset.title}`);
  previousButton.disabled = current === 0;
  nextButtons.forEach((button) => { button.disabled = current === slides.length - 1; });
  const activeChapter = chapterButtons[current];
  if (chapterNav.scrollWidth > chapterNav.clientWidth) {
    chapterNav.scrollTo({ left: activeChapter.offsetLeft - chapterNav.clientWidth / 2, behavior: reducedMotion ? "auto" : "smooth" });
  }
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

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, reducedMotion ? Math.min(duration, 40) : duration));
}

function setPresenterMessage(message) {
  if (presenterOutput) presenterOutput.textContent = message;
}

function openPresenter() {
  if (!presenterDialog.open) presenterDialog.showModal();
}

function timerText(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function currentElapsed() {
  return timerElapsedMs + (timerStartedAt === null ? 0 : Date.now() - timerStartedAt);
}

function renderTimer() {
  const value = timerText(currentElapsed());
  timerDisplays.forEach((element) => { element.textContent = value; });
}

function setTimerButtonLabel(label) {
  document.querySelectorAll('[data-action="toggle-timer"]').forEach((button) => { button.textContent = label; });
}

function toggleTimer() {
  if (timerStartedAt === null) {
    timerStartedAt = Date.now();
    timerInterval = window.setInterval(renderTimer, 250);
    setTimerButtonLabel("Pause timer");
    setPresenterMessage("Presenter timer is running. Follow the evidence path and leave time for questions.");
  } else {
    timerElapsedMs += Date.now() - timerStartedAt;
    timerStartedAt = null;
    window.clearInterval(timerInterval);
    timerInterval = null;
    setTimerButtonLabel("Resume timer");
    setPresenterMessage(`Timer paused at ${timerText(timerElapsedMs)}.`);
  }
  renderTimer();
}

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    setPresenterMessage(successMessage);
  } catch {
    setPresenterMessage("Clipboard access was unavailable. Select and copy the visible evidence manually.");
  }
}

function renderPreflightCheck(check, index) {
  const card = document.createElement("article");
  card.className = `preflight-check is-${check.status}`;
  card.style.animationDelay = `${index * 70}ms`;
  const status = document.createElement("span");
  const label = document.createElement("b");
  const evidence = document.createElement("small");
  status.textContent = check.status === "pass" ? "PASS" : "CHECK";
  label.textContent = check.label;
  evidence.textContent = check.evidence;
  card.append(status, label, evidence);
  return card;
}

async function runPreflight() {
  openPresenter();
  setText("[data-presenter-readiness]", "Checking…");
  setText('[data-live="preflight-summary"]', "Running eight live checks…");
  preflightGrid.replaceChildren();
  const loading = document.createElement("p");
  loading.textContent = "Calling the Worker for live edge context and the deployment control snapshot…";
  preflightGrid.append(loading);
  try {
    const { response, body } = await getJson("/api/demo/preflight", { cache: "no-store" });
    if (!response.ok || !body.ok) throw new Error("Preflight endpoint returned an error");
    preflightGrid.replaceChildren();
    for (const [index, check] of body.data.checks.entries()) {
      preflightGrid.append(renderPreflightCheck(check, index));
      await wait(90);
    }
    const passed = body.data.checks.filter((check) => check.status === "pass").length;
    const total = body.data.checks.length;
    const summary = `${passed}/${total} controls verified`;
    setText("[data-presenter-readiness]", body.data.ready ? "Demo ready" : `${passed}/${total} ready`);
    setText('[data-live="preflight-summary"]', summary);
    setText('[data-live="preflight-observed"]', new Date(body.data.observedAt).toLocaleTimeString());
    document.querySelector(".live-proof-strip")?.classList.add("is-live");
    setPresenterMessage(`${summary}. Evidence source: ${body.data.evidenceMode}.`);
  } catch (error) {
    preflightGrid.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Preflight could not load. The deck remains usable; retry before the live interview.";
    preflightGrid.append(message);
    setText("[data-presenter-readiness]", "Unavailable");
    setText('[data-live="preflight-summary"]', "Preflight unavailable");
    setPresenterMessage(error instanceof Error ? error.message : "Unknown preflight error");
  }
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
    if (controls.rateLimit) {
      setText("[data-burst-summary]", controls.rateLimit.status === "active" ? controls.rateLimit.policy : "Control snapshot unavailable");
    }
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
  document.querySelector(".event-card")?.classList.add("has-evidence");
}

function clearEvidence() {
  sessionStorage.removeItem("waf-evidence");
  setText('[data-result="ray"]', "Run the XSS probe first");
  setText('[data-result="time"]', "—");
  document.querySelector(".event-card")?.classList.remove("has-evidence");
  ["baseline", "attack", "evidence"].forEach((stage) => setRunner(stage, ""));
  document.querySelector('[data-result="output"]').textContent = "Choose a request to send through Cloudflare.";
  document.querySelector('[data-result="badge"]').textContent = "READY";
  setPresenterMessage("WAF evidence was cleared from this browser session. Cloudflare Security Events were not modified.");
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

async function runApiExplorer(path) {
  const output = document.querySelector("[data-api-output]");
  const status = document.querySelector("[data-api-status]");
  status.textContent = "WAIT";
  output.textContent = `GET ${path}\n\nSending request through Cloudflare's edge…`;
  try {
    const { response, body } = await getJson(path, { cache: "no-store" });
    const ray = response.headers.get("cf-ray") || response.headers.get("x-request-id") || "unavailable";
    status.textContent = String(response.status);
    const rendered = JSON.stringify(body, null, 2);
    output.textContent = `STATUS ${response.status}\nRAY    ${ray}\n\n${rendered.slice(0, 2200)}${rendered.length > 2200 ? "\n… response truncated for the slide" : ""}`;
  } catch (error) {
    status.textContent = "ERROR";
    output.textContent = error instanceof Error ? error.message : "The API request failed.";
  }
}

async function runControlledBurst() {
  const runId = ++burstRunId;
  const button = document.querySelector('[data-action="run-burst"]');
  const output = document.querySelector("[data-burst-output]");
  button.disabled = true;
  output.textContent = "Sending a bounded burst to one isolated demo endpoint…";
  let allowed = 0;
  let blocked = 0;
  let lastStatus = 0;

  const send = async () => {
    const response = await fetch(`/api/demo/burst-control?run=${runId}&n=${allowed + blocked + 1}`, { cache: "no-store" });
    lastStatus = response.status;
    await response.body?.cancel();
    if (response.status === 429 || response.status === 403) blocked += 1;
    else allowed += 1;
    output.textContent = `${allowed} reached Worker · ${blocked} stopped at edge · last status ${response.status}`;
    return blocked > 0;
  };

  try {
    for (let index = 0; index < 8 && !(await send()); index += 1) await wait(90);
    if (!blocked) {
      output.textContent = `${allowed} reached Worker · waiting for the distributed counter to update…`;
      await wait(1800);
      for (let index = 0; index < 8 && !(await send()); index += 1) await wait(140);
    }
    output.textContent = blocked
      ? `${allowed} reached Worker · ${blocked} stopped at edge · ${lastStatus} proves enforcement before code`
      : `${allowed} reached Worker · counter propagation is delayed; retry after the 10-second window`;
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : "The burst-control proof could not complete.";
  } finally {
    button.disabled = false;
  }
}

const storageScenarios = {
  flags: { service: "kv", message: "Workers KV — globally read-heavy configuration tolerates eventual consistency." },
  room: { service: "durable", message: "Durable Objects — one authoritative instance coordinates each room with strongly consistent state." },
  accounts: { service: "d1", message: "D1 — relational records and SQL queries fit a serverless SQLite-based application database." },
  media: { service: "r2", message: "R2 — durable S3-compatible object storage fits media bytes and avoids egress charges." },
  postgres: { service: "hyperdrive", message: "Hyperdrive — keep the regional PostgreSQL system of record while pooling and accelerating connections." },
};

function selectStorageScenario(key) {
  const selection = storageScenarios[key];
  if (!selection) return;
  document.querySelectorAll("[data-storage-scenario]").forEach((button) => {
    const active = button.dataset.storageScenario === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const grid = document.querySelector(".storage-grid");
  grid.classList.add("is-deciding");
  grid.querySelectorAll("[data-storage-service]").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.storageService === selection.service);
  });
  document.querySelector("[data-storage-output]").textContent = selection.message;
}

const pipelineMessages = [
  "Worker: authenticate and return the latency-sensitive response.",
  "Queues: acknowledge durable background work and design the consumer for at-least-once delivery.",
  "Workers AI: invoke inference without provisioning GPU infrastructure.",
  "Vectorize: retrieve semantically relevant context for search or RAG.",
  "Browser Run: perform the browser-only task and persist artifacts to R2 when required.",
];

async function runPipeline() {
  const runId = ++pipelineRunId;
  const pipeline = document.querySelector(".platform-pipeline");
  const cards = [...pipeline.querySelectorAll("[data-pipeline-step]")];
  pipeline.classList.add("is-running");
  cards.forEach((card) => card.classList.remove("is-active", "is-complete"));
  for (const [index, card] of cards.entries()) {
    if (runId !== pipelineRunId) return;
    cards.forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
    document.querySelector("[data-pipeline-output]").textContent = pipelineMessages[index];
    await wait(650);
    card.classList.remove("is-active");
    card.classList.add("is-complete");
  }
  pipeline.classList.remove("is-running");
  document.querySelector("[data-pipeline-output]").innerHTML = "<strong>Architecture simulation complete:</strong> keep the request path short, move failure-prone work behind a queue, and pass capabilities through bindings—not browser credentials.";
}

const migrationGoals = {
  latency: "Move routing, authentication, request transformation, and security policy to Workers first; measure before moving state.",
  state: "Use Durable Objects when requests must coordinate around one authority; use D1 for relational records and KV only when eventual consistency is acceptable.",
  aws: "Keep the AWS system of record initially. Put Workers on the request path and use Hyperdrive where supported to reduce connection and migration risk.",
  batch: "Return quickly from the Worker, enqueue the job, make the consumer idempotent, and expose completion status instead of holding the request open.",
};

function selectMigrationGoal(key) {
  if (!migrationGoals[key]) return;
  document.querySelectorAll("[data-migration-goal]").forEach((button) => {
    const active = button.dataset.migrationGoal === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("[data-migration-output]").textContent = migrationGoals[key];
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    setPresenterMessage(document.fullscreenElement ? "Fullscreen presentation mode enabled." : "Fullscreen presentation mode closed.");
  } catch {
    setPresenterMessage("Fullscreen is unavailable in this browser context.");
  }
}

function resetDemo() {
  pipelineRunId += 1;
  burstRunId += 1;
  clearEvidence();
  sessionStorage.removeItem("waf-evidence");
  timerStartedAt = null;
  timerElapsedMs = 0;
  if (timerInterval !== null) window.clearInterval(timerInterval);
  timerInterval = null;
  setTimerButtonLabel("Start timer");
  renderTimer();
  preflightGrid.replaceChildren();
  const message = document.createElement("p");
  message.textContent = "Run preflight to verify the Worker, custom domain, TLS, WAF, bots, Turnstile, API inventory, and rate limit from live evidence.";
  preflightGrid.append(message);
  setText("[data-presenter-readiness]", "Not checked");
  setText('[data-live="preflight-summary"]', "Live evidence is ready to inspect");
  setText('[data-live="preflight-observed"]', "Not yet run");
  document.querySelector(".live-proof-strip")?.classList.remove("is-live");
  document.querySelectorAll(".is-selected, .decision-lab .is-active, .migration-lab .is-active, .platform-pipeline .is-active, .platform-pipeline .is-complete").forEach((element) => element.classList.remove("is-selected", "is-active", "is-complete"));
  document.querySelector(".storage-grid")?.classList.remove("is-deciding");
  document.querySelector("[data-storage-output]").textContent = "Choose a workload; the recommendation follows the consistency and data-shape requirement.";
  document.querySelector("[data-migration-output]").textContent = "Choose a constraint to produce a defensible migration answer.";
  document.querySelector("[data-pipeline-output]").innerHTML = "<strong>Bindings are the connective tissue:</strong> the Worker receives platform capabilities through its environment instead of exposing service credentials to browser code.";
  document.querySelector("[data-api-output]").textContent = "Select a GET operation to inspect its public-safe response.";
  document.querySelector("[data-api-status]").textContent = "READY";
  document.querySelector("[data-burst-output]").textContent = "The first responses should reach the Worker; the edge then returns 429.";
  if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  showSlide(0);
  setPresenterMessage("Demo state reset. Cloudflare configuration and dashboard Security Events were not modified.");
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "next") showSlide(current + 1);
  if (action === "previous") showSlide(current - 1);
  if (action === "refresh-health") loadHealth();
  if (action === "safe-request") runProbe("safe");
  if (action === "attack-request") runProbe("attack");
  if (action === "view-event") showSlide(6);
  if (action === "open-presenter") openPresenter();
  if (action === "close-presenter") presenterDialog.close();
  if (action === "run-preflight") runPreflight();
  if (action === "toggle-timer") toggleTimer();
  if (action === "copy-slide-link") copyText(window.location.href, `Slide ${current + 1} link copied.`);
  if (action === "fullscreen") toggleFullscreen();
  if (action === "reset-demo") resetDemo();
  if (action === "copy-attack") copyText(`curl -i '${window.location.origin}/attack-lab?attack=xss&payload=%3Cscript%3Ealert(1)%3C%2Fscript%3E'`, "WAF probe cURL copied.");
  if (action === "copy-evidence") {
    const ray = document.querySelector('[data-result="ray"]').textContent;
    const time = document.querySelector('[data-result="time"]').textContent;
    copyText(`Cloudflare WAF evidence\nAction: BLOCK\nHost: innovativefuturesolutions.com\nPath: /attack-lab\nRay ID: ${ray}\nObserved: ${time}`, "WAF evidence copied.");
  }
  if (action === "clear-evidence") clearEvidence();
  if (action === "run-pipeline") runPipeline();
  if (action === "run-burst") runControlledBurst();
  const apiPath = event.target.closest("[data-api-path]")?.dataset.apiPath;
  if (apiPath) runApiExplorer(apiPath);
  const storageScenario = event.target.closest("[data-storage-scenario]")?.dataset.storageScenario;
  if (storageScenario) selectStorageScenario(storageScenario);
  const migrationGoal = event.target.closest("[data-migration-goal]")?.dataset.migrationGoal;
  if (migrationGoal) selectMigrationGoal(migrationGoal);
  const slideIndex = event.target.closest("[data-slide-index]")?.dataset.slideIndex;
  if (slideIndex !== undefined) showSlide(Number(slideIndex));
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "BUTTON", "A", "SELECT"].includes(tag)) return;
  const key = event.key.toLowerCase();
  if (key === "p" || event.key === "?") {
    event.preventDefault();
    openPresenter();
    return;
  }
  if (key === "t") {
    event.preventDefault();
    toggleTimer();
    return;
  }
  if (key === "f") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }
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
renderTimer();
