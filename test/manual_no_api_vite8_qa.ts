/**
 * Vite 8 Upgrade QA Test Suite
 *
 * Supplementary test for the Vite 7 → 8 migration (PR #1601).
 * Focuses on Vite 8 / Rolldown specific regressions:
 *   - App boots and renders (rolldownOptions + platform:"node" work)
 *   - No ERR_INVALID_ARG_VALUE from createRequire(import.meta.url)
 *   - Page navigation across all major routes
 *   - Console health (no new runtime errors from bundler change)
 *   - HMR WebSocket connection is alive (dev mode only)
 *
 * Separate build checks (run manually):
 *   - yarn make:ci:mac    → production build succeeds
 *   - Open built .app     → packaged app launches
 *
 * Usage:
 *   1. Start the app: yarn start
 *   2. Run: npx tsx test/manual_no_api_vite8_qa.ts
 *
 * Environment variables:
 *   CDP_URL  - CDP endpoint (default: http://localhost:9222/)
 *   APP_URL  - App URL fragment to match (default: localhost:5175)
 */
import playwright, { Browser, BrowserContext, ConsoleMessage, Page } from "playwright-core";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000,
  CDP_MAX_ATTEMPTS: 30,
  ACTION_DELAY_MS: 500,
  SELECTOR_TIMEOUT_MS: 10_000,
  NAVIGATION_TIMEOUT_MS: 15_000,
} as const;

// ---------------------------------------------------------------------------
// Test result bookkeeping
// ---------------------------------------------------------------------------

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, status: "PASS" | "FAIL" | "WARN", detail: string) {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
  console.log(`  ${icon} [${status}] ${name}: ${detail}`);
}

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

async function connectCDP(): Promise<Browser> {
  const cdpUrl = process.env.CDP_URL || "http://localhost:9222/";
  let attempts = 0;
  while (attempts < CONFIG.CDP_MAX_ATTEMPTS) {
    try {
      const browser = await playwright.chromium.connectOverCDP(cdpUrl);
      console.log("✓ Connected to CDP");
      return browser;
    } catch (error: unknown) {
      attempts++;
      if (attempts === CONFIG.CDP_MAX_ATTEMPTS) {
        throw new Error(
          `Failed to connect after ${CONFIG.CDP_MAX_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      if (attempts === 1) console.log(`Connecting to ${cdpUrl}...`);
      await new Promise((r) => setTimeout(r, CONFIG.CDP_RETRY_DELAY_MS));
    }
  }
  throw new Error("Unreachable");
}

function findAppPage(contexts: BrowserContext[]): Page {
  const candidates = ["localhost:5175", "localhost:5174", "localhost:5173"];
  const appUrl = process.env.APP_URL;
  if (appUrl) candidates.unshift(appUrl);
  for (const pattern of candidates) {
    for (const ctx of contexts) {
      const page = ctx.pages().find((p) => p.url().includes(pattern));
      if (page) return page;
    }
  }
  throw new Error("Could not find application page");
}

function baseUrl(page: Page): string {
  return page.url().split("#")[0];
}

async function waitFor(page: Page, selector: string, timeout = CONFIG.SELECTOR_TIMEOUT_MS) {
  try {
    return await page.waitForSelector(selector, { timeout });
  } catch {
    return null;
  }
}

async function dismissModal(page: Page) {
  const overlay = await page.$('[data-state="open"][data-slot="dialog-overlay"]');
  if (overlay) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  }
}

// ---------------------------------------------------------------------------
// Monitor (console + pageerror + critical patterns)
// ---------------------------------------------------------------------------

const CRITICAL_PATTERNS = ["ERR_INVALID_ARG_VALUE", "createRequire", "TypeError", "Cannot read properties"];

interface Monitor {
  consoleErrors: string[];
  consoleWarnings: string[];
  criticalHits: string[];
  pageErrors: string[];
  start: () => void;
  stop: () => void;
}

function createMonitor(page: Page): Monitor {
  const monitor: Monitor = {
    consoleErrors: [],
    consoleWarnings: [],
    criticalHits: [],
    pageErrors: [],
    start: () => {
      page.on("console", consoleHandler);
      page.on("pageerror", pageErrorHandler);
    },
    stop: () => {
      page.off("console", consoleHandler);
      page.off("pageerror", pageErrorHandler);
    },
  };

  const consoleHandler = (msg: ConsoleMessage) => {
    const text = msg.text();
    const type = msg.type();
    if (text.includes("Electron Security Warning")) return;
    if (type === "error") {
      monitor.consoleErrors.push(text);
      if (CRITICAL_PATTERNS.some((p) => text.includes(p))) {
        monitor.criticalHits.push(text);
      }
    }
    if (type === "warning") {
      monitor.consoleWarnings.push(text);
    }
  };

  const pageErrorHandler = (error: Error) => {
    monitor.pageErrors.push(`${error.name}: ${error.message}`);
  };

  return monitor;
}

// ---------------------------------------------------------------------------
// Test Cases
// ---------------------------------------------------------------------------

async function testAppBoot(page: Page) {
  console.log("\n=== 1. App Boot & Initial Render ===");

  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});
  await dismissModal(page);

  const title = await page.title();
  record("Page title", title === "MulmoCast" ? "PASS" : "FAIL", `Title: "${title}"`);

  const createBtn = await waitFor(page, 'button:has-text("Create New")');
  record("Dashboard rendered", createBtn ? "PASS" : "FAIL", createBtn ? "Create New button found" : "Not found");

  const projectCount = await page.evaluate(() => document.querySelectorAll('a[href*="#/project/"]').length);
  record("Project list", projectCount > 0 ? "PASS" : "WARN", `${projectCount} projects displayed`);
}

async function testPageNavigation(page: Page) {
  console.log("\n=== 2. Page Navigation (all major routes) ===");

  const routes: Array<{ hash: string; name: string; check: string }> = [
    { hash: "#/", name: "Dashboard", check: 'button:has-text("Create New")' },
    { hash: "#/bgm", name: "BGM", check: "h1,h2" },
    { hash: "#/voice-clone", name: "Voice Clone", check: "h1,h2" },
  ];

  for (const route of routes) {
    await page.goto(`${baseUrl(page)}${route.hash}`);
    await page
      .waitForURL(new RegExp(route.hash.replace("/", "\\/")), { timeout: CONFIG.NAVIGATION_TIMEOUT_MS })
      .catch(() => {});
    await dismissModal(page);

    const el = await waitFor(page, route.check);
    record(`Navigate → ${route.name}`, el ? "PASS" : "FAIL", el ? "Page rendered" : "Expected element not found");
  }

  // Open a project page
  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});
  await waitFor(page, 'a[href*="#/project/"]');

  const projectLinks = await page.$$('a[href*="#/project/"]');
  if (projectLinks.length > 0) {
    const lastLink = projectLinks[projectLinks.length - 1];
    await lastLink.click();
    await page.waitForURL(/.#\/project\//, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

    const beatTab = await waitFor(page, 'button:has-text("BEAT")');
    record("Navigate → Project", beatTab ? "PASS" : "FAIL", beatTab ? "BEAT tab visible" : "BEAT tab not found");
  } else {
    record("Navigate → Project", "WARN", "No projects available to open");
  }
}

async function testCreateRequireError(monitor: Monitor) {
  console.log("\n=== 3. createRequire / ERR_INVALID_ARG_VALUE Check ===");

  const argValueErrors = monitor.consoleErrors.filter((e) => e.includes("ERR_INVALID_ARG_VALUE"));
  record(
    "No ERR_INVALID_ARG_VALUE",
    argValueErrors.length === 0 ? "PASS" : "FAIL",
    argValueErrors.length === 0 ? "None detected" : `${argValueErrors.length} hit(s): ${argValueErrors[0]}`,
  );

  const createRequireErrors = monitor.consoleErrors.filter((e) => e.includes("createRequire"));
  record(
    "No createRequire errors",
    createRequireErrors.length === 0 ? "PASS" : "FAIL",
    createRequireErrors.length === 0
      ? "None detected"
      : `${createRequireErrors.length} hit(s): ${createRequireErrors[0]}`,
  );
}

async function testHMRConnection(page: Page) {
  console.log("\n=== 4. HMR WebSocket Connection (dev mode) ===");

  // In dev mode, Vite establishes a WebSocket for HMR.
  // Check if the HMR client is connected by evaluating the __vite_plugin_react_preamble_installed__
  // or the existence of the Vite HMR websocket.
  const hmrStatus = await page.evaluate(() => {
    // Vite injects __vite__ or import.meta.hot in dev mode
    // Check for WebSocket connections to the Vite dev server
    const ws = (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).filter(
      (e) => e.initiatorType === "websocket" || e.name.includes("__vite"),
    );
    // Also check if any script was loaded from the dev server (indicating Vite is serving)
    const viteScripts = Array.from(document.querySelectorAll('script[type="module"]')).filter((s) =>
      (s as HTMLScriptElement).src.includes("localhost"),
    );
    return {
      wsCount: ws.length,
      viteScriptCount: viteScripts.length,
      hasViteClient: document.querySelector('script[src*="@vite/client"]') !== null,
    };
  });

  const hmrAlive = hmrStatus.hasViteClient || hmrStatus.viteScriptCount > 0;
  record(
    "HMR connection (dev mode)",
    hmrAlive ? "PASS" : "WARN",
    hmrAlive
      ? `Vite client: ${hmrStatus.hasViteClient}, module scripts: ${hmrStatus.viteScriptCount}`
      : "Vite HMR client not detected (may be packaged mode)",
  );
}

async function testSettingsModalQuick(page: Page) {
  console.log("\n=== 5. Settings Modal (quick open/close) ===");

  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const settingsBtn = await waitFor(page, 'button:has-text("Settings")');
  if (!settingsBtn) {
    record("Settings modal", "FAIL", "Settings button not found");
    return;
  }

  await settingsBtn.click();
  const combobox = await waitFor(page, 'button[role="combobox"]');
  record("Settings modal open", combobox ? "PASS" : "FAIL", combobox ? "Rendered" : "Not rendered");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const overlay = await page.$('[data-state="open"][data-slot="dialog-overlay"]');
  record("Settings modal close", !overlay ? "PASS" : "WARN", !overlay ? "Dismissed" : "May still be open");
}

async function testHealthReport(monitor: Monitor) {
  console.log("\n=== 6. Console & Runtime Health ===");

  record(
    "Console errors",
    monitor.consoleErrors.length === 0 ? "PASS" : "FAIL",
    monitor.consoleErrors.length === 0
      ? "No errors"
      : `${monitor.consoleErrors.length} error(s): ${monitor.consoleErrors.slice(0, 3).join("; ")}`,
  );

  record(
    "Critical runtime patterns",
    monitor.criticalHits.length === 0 ? "PASS" : "FAIL",
    monitor.criticalHits.length === 0
      ? "None detected"
      : `${monitor.criticalHits.length} hit(s): ${monitor.criticalHits.slice(0, 3).join("; ")}`,
  );

  record(
    "Uncaught page errors (pageerror)",
    monitor.pageErrors.length === 0 ? "PASS" : "FAIL",
    monitor.pageErrors.length === 0
      ? "None"
      : `${monitor.pageErrors.length} error(s): ${monitor.pageErrors.slice(0, 3).join("; ")}`,
  );

  record(
    "Console warnings",
    monitor.consoleWarnings.length === 0 ? "PASS" : "WARN",
    monitor.consoleWarnings.length === 0
      ? "No warnings (excluding Electron CSP)"
      : `${monitor.consoleWarnings.length} warning(s): ${monitor.consoleWarnings.slice(0, 3).join("; ")}`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  console.log("========================================");
  console.log("  Vite 8 Upgrade QA Test Suite");
  console.log("========================================\n");

  const resources: { browser: Browser | null } = { browser: null };

  try {
    resources.browser = await connectCDP();
    const contexts = resources.browser.contexts();
    if (contexts.length === 0) throw new Error("No browser contexts found");

    const page = findAppPage(contexts);
    console.log(`✓ Found app page: ${page.url()}\n`);

    const monitor = createMonitor(page);
    monitor.start();

    // Phase 1: App boot & initial render
    await testAppBoot(page);

    // Phase 2: Navigate all major routes
    await testPageNavigation(page);

    // Phase 3: createRequire / ERR_INVALID_ARG_VALUE (the main risk from rolldownOptions)
    await testCreateRequireError(monitor);

    // Phase 4: HMR WebSocket (dev mode)
    await testHMRConnection(page);

    // Phase 5: Settings modal quick check
    await testSettingsModalQuick(page);

    // Phase 6: Console & runtime health
    monitor.stop();
    await testHealthReport(monitor);

    // --- Summary ---
    console.log("\n========================================");
    console.log("  Summary");
    console.log("========================================");

    const pass = results.filter((r) => r.status === "PASS").length;
    const fail = results.filter((r) => r.status === "FAIL").length;
    const warn = results.filter((r) => r.status === "WARN").length;
    const pageErrorCount = monitor.pageErrors.length;

    console.log(
      `  PASS: ${pass}  FAIL: ${fail}  WARN: ${warn}  pageerror: ${pageErrorCount}  TOTAL: ${results.length}`,
    );

    if (fail > 0) {
      console.log("\n  Failed tests:");
      results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`    ✗ ${r.name}: ${r.detail}`));
    }
    if (warn > 0) {
      console.log("\n  Warnings:");
      results.filter((r) => r.status === "WARN").forEach((r) => console.log(`    ⚠ ${r.name}: ${r.detail}`));
    }
    if (pageErrorCount > 0) {
      console.log("\n  Page errors:");
      monitor.pageErrors.slice(0, 5).forEach((e) => console.log(`    💥 ${e}`));
    }

    console.log("\n  Manual checks (not automated):");
    console.log("    [ ] yarn make:ci:mac → build succeeds");
    console.log("    [ ] Open built .app → packaged app launches");
    console.log("    [ ] HMR: edit a Vue file → change reflected without reload");

    console.log("");
    process.exit(fail > 0 ? 1 : 0);
  } catch (error: unknown) {
    console.error(`\nFatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    if (resources.browser) {
      await resources.browser.close().catch(() => {});
    }
  }
})();
