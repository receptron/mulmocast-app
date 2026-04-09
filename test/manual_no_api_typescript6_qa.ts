/**
 * TypeScript 6 Upgrade QA Test Suite
 *
 * Manual test script to verify basic functionality after TypeScript 5.9 → 6.0 upgrade.
 * Focuses on areas affected by the upgrade:
 *   - Project creation (safeParse → parse change)
 *   - Project reload & title persistence
 *   - Voice Clone list fetch (error.cause → getErrorCause)
 *   - Settings modal display
 *   - Dashboard navigation
 *   - Monaco Editor JSON editing
 *   - Console health + pageerror monitoring
 *
 * Usage:
 *   1. Start the app: yarn start
 *   2. Run: npx tsx test/manual_no_api_typescript6_qa.ts
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
  /** Fallback timeout when no better wait strategy is available. */
  ACTION_DELAY_MS: 500,
  EDITOR_SETTLE_DELAY_MS: 1500,
  /** Selector timeout for waitForSelector calls. */
  SELECTOR_TIMEOUT_MS: 10_000,
  /** Navigation timeout for waitForURL calls. */
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
      if (attempts === 1) {
        console.log(`Connecting to ${cdpUrl}...`);
      }
      await new Promise((resolve) => setTimeout(resolve, CONFIG.CDP_RETRY_DELAY_MS));
    }
  }
  throw new Error("Unreachable");
}

function findAppPage(contexts: BrowserContext[]): Page {
  const candidates = ["localhost:5175", "localhost:5174", "localhost:5173"];
  const appUrl = process.env.APP_URL;
  if (appUrl) candidates.unshift(appUrl);

  for (const pattern of candidates) {
    for (const context of contexts) {
      const page = context.pages().find((p) => p.url().includes(pattern));
      if (page) return page;
    }
  }
  throw new Error("Could not find application page");
}

/** Return the base URL (everything before the hash). */
function baseUrl(page: Page): string {
  return page.url().split("#")[0];
}

// ---------------------------------------------------------------------------
// Console & pageerror monitoring
// ---------------------------------------------------------------------------

/** Patterns that indicate a critical runtime error from Electron main / TS6 regressions. */
const CRITICAL_PATTERNS = ["ERR_INVALID_ARG_VALUE", "TypeError", "Cannot read properties"];

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

    // Ignore known Electron CSP warnings
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
// Helpers
// ---------------------------------------------------------------------------

async function readEditorJson(page: Page): Promise<Record<string, unknown> | null> {
  const selectAllKey = process.platform === "darwin" ? "Meta+a" : "Control+a";
  const copyKey = process.platform === "darwin" ? "Meta+c" : "Control+c";

  const viewLines = await page.$(".monaco-editor .view-lines");
  if (!viewLines) return null;
  await viewLines.click();
  await page.waitForTimeout(300);
  await page.keyboard.press(selectAllKey);
  await page.waitForTimeout(200);
  await page.keyboard.press(copyKey);
  await page.waitForTimeout(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = await page.evaluate(() => (window as any).electronAPI.readClipboardText());
  if (!content) return null;
  try {
    return JSON.parse(content);
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

/**
 * Wait for a selector, returning the element or null on timeout.
 * Never throws – a null return lets the caller decide PASS/FAIL.
 */
async function waitFor(page: Page, selector: string, timeout = CONFIG.SELECTOR_TIMEOUT_MS) {
  try {
    return await page.waitForSelector(selector, { timeout });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test Cases
// ---------------------------------------------------------------------------

async function testDashboard(page: Page) {
  console.log("\n=== 1. Dashboard Display ===");

  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});
  await dismissModal(page);

  const title = await page.title();
  record("Page title", title === "MulmoCast" ? "PASS" : "FAIL", `Title: "${title}"`);

  const newProjectBtn = await waitFor(page, 'button:has-text("Create New")');
  record(
    "Dashboard loaded",
    newProjectBtn ? "PASS" : "FAIL",
    newProjectBtn ? "Create new button found" : "Button not found",
  );

  const projectCount = await page.evaluate(() => document.querySelectorAll('a[href*="#/project/"]').length);
  record("Project list", projectCount > 0 ? "PASS" : "WARN", `${projectCount} projects displayed`);
}

async function testProjectCreateAndReload(page: Page): Promise<string | null> {
  console.log("\n=== 2. Project Creation, Edit & Reload (safeParse → parse) ===");

  // Navigate to dashboard
  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const newBtn = await waitFor(page, 'button:has-text("Create New")');
  if (!newBtn) {
    record("Create project", "FAIL", "Create new button not found");
    return null;
  }

  await newBtn.click();
  // Wait for URL to change to a project page
  await page.waitForURL(/.#\/project\//, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const url = page.url();
  const isProjectPage = url.includes("#/project/");
  record("Project created", isProjectPage ? "PASS" : "FAIL", `URL: ${url}`);
  if (!isProjectPage) return null;

  const projectId = url.split("#/project/")[1];

  // Wait for BEAT tab to appear (script parsed correctly)
  const beatTab = await waitFor(page, 'button:has-text("BEAT")');
  record(
    "BEAT tab visible (script parsed)",
    beatTab ? "PASS" : "FAIL",
    beatTab ? "Script parsed successfully with .parse()" : "BEAT tab not found",
  );

  // --- Monaco edit: modify title via paste (safe – this is a new project) ---
  const selectAllKey = process.platform === "darwin" ? "Meta+a" : "Control+a";
  const pasteKey = process.platform === "darwin" ? "Meta+v" : "Control+v";
  const TEST_TITLE = "[QA] TypeScript 6 Test";

  const jsonTab = await waitFor(page, 'button:has-text("JSON")');
  if (jsonTab) {
    await jsonTab.click();
    await waitFor(page, ".monaco-editor .view-lines");

    const json = await readEditorJson(page);
    if (json) {
      const hasTitle = typeof json.title === "string";
      const hasBeats = Array.isArray(json.beats) && (json.beats as unknown[]).length > 0;
      record(
        "Script JSON structure",
        hasTitle && hasBeats ? "PASS" : "FAIL",
        `title: ${hasTitle ? '"' + String(json.title) + '"' : "missing"}, beats: ${hasBeats ? (json.beats as unknown[]).length : "missing"}`,
      );

      const modified = { ...json, title: TEST_TITLE };
      try {
        const viewLines = await page.$(".monaco-editor .view-lines");
        if (viewLines) {
          await viewLines.click();
          await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
          await page.evaluate((text: string) => navigator.clipboard.writeText(text), JSON.stringify(modified, null, 2));
          await page.waitForTimeout(200);
          await page.keyboard.press(selectAllKey);
          await page.waitForTimeout(200);
          await page.keyboard.press(pasteKey);
          // Wait for editor to process paste and IPC save round-trip
          await page.waitForTimeout(3000);

          const afterEdit = await readEditorJson(page);
          record(
            "Monaco Editor edit",
            afterEdit?.title === TEST_TITLE ? "PASS" : "FAIL",
            afterEdit?.title === TEST_TITLE ? `title → "${TEST_TITLE}"` : `title is "${afterEdit?.title}"`,
          );
        }
      } catch (error: unknown) {
        record("Monaco Editor edit", "WARN", `Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      record("Script JSON structure", "FAIL", "Could not read editor JSON");
    }

    // Return to BEAT tab before reload
    await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
    if (beatTab) {
      await beatTab.click();
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    }
  }

  // --- Reload and verify title persistence ---
  console.log("  Reloading project page...");
  await page.goto(`${baseUrl(page)}#/project/${projectId}`);
  await page
    .waitForURL(new RegExp(`#/project/${projectId}`), { timeout: CONFIG.NAVIGATION_TIMEOUT_MS })
    .catch(() => {});

  const beatTabAfterReload = await waitFor(page, 'button:has-text("BEAT")');
  record(
    "Script intact after reload",
    beatTabAfterReload ? "PASS" : "FAIL",
    beatTabAfterReload ? "BEAT tab visible after reload" : "Page may have crashed",
  );

  // Verify the edited title persisted through reload
  const jsonTabReload = await waitFor(page, 'button:has-text("JSON")');
  if (jsonTabReload) {
    await jsonTabReload.click();
    await waitFor(page, ".monaco-editor .view-lines");

    const reloadedJson = await readEditorJson(page);
    const titlePersisted = reloadedJson?.title === TEST_TITLE;
    record(
      "Title persisted after reload",
      titlePersisted ? "PASS" : "FAIL",
      titlePersisted ? `title = "${TEST_TITLE}"` : `title = "${reloadedJson?.title}"`,
    );

    await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
    const beatTabBack = await page.$('button:has-text("BEAT")');
    if (beatTabBack) {
      await beatTabBack.click();
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    }
  }

  return projectId;
}

async function testExistingProjectLoad(page: Page) {
  console.log("\n=== 3. Existing Project Load (null checks) ===");

  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});
  // Wait for project list to render
  await waitFor(page, 'a[href*="#/project/"]');

  // Pick the oldest project (last in the list, sorted by "Last updated newest first")
  const projectLinks = await page.$$('a[href*="#/project/"]');
  const targetLink = projectLinks.length > 0 ? projectLinks[projectLinks.length - 1] : null;
  if (!targetLink) {
    record("Existing project load", "WARN", "No existing projects found");
    return;
  }

  await targetLink.click();
  await page.waitForURL(/.#\/project\//, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const url = page.url();
  const isProjectPage = url.includes("#/project/");
  record("Existing project opened", isProjectPage ? "PASS" : "FAIL", `URL: ${url}`);
  if (!isProjectPage) return;

  // Wait for key UI elements — FAIL (not WARN) if they don't appear
  const beatTab = await waitFor(page, 'button:has-text("BEAT")');
  record(
    "Existing project UI loaded",
    beatTab ? "PASS" : "FAIL",
    beatTab ? "BEAT tab visible" : "BEAT tab not found within timeout (possible crash)",
  );

  const generateBtn = await waitFor(page, 'button:has-text("Generate Contents")');
  record("Generate button present", generateBtn ? "PASS" : "FAIL", generateBtn ? "Found" : "Not found within timeout");

  // Read-only JSON check on existing project (do NOT edit)
  const jsonTab = await waitFor(page, 'button:has-text("JSON")');
  if (jsonTab) {
    await jsonTab.click();
    await waitFor(page, ".monaco-editor .view-lines");

    const json = await readEditorJson(page);
    if (json) {
      const hasBeats = Array.isArray(json.beats) && (json.beats as unknown[]).length > 0;
      record(
        "Existing project JSON readable",
        hasBeats ? "PASS" : "WARN",
        `beats: ${hasBeats ? (json.beats as unknown[]).length : "none"}, title: "${json.title}"`,
      );
    } else {
      record("Existing project JSON readable", "WARN", "Could not read editor JSON");
    }

    await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
    const beatTabBack = await page.$('button:has-text("BEAT")');
    if (beatTabBack) {
      await beatTabBack.click();
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    }
  }
}

async function testVoiceClonePage(page: Page) {
  console.log("\n=== 4. Voice Clone Page (getErrorCause, name ?? '') ===");

  await page.goto(`${baseUrl(page)}#/voice-clone`);
  await page.waitForURL(/.#\/voice-clone/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const isVoiceClonePage = await page.evaluate(() => document.body.innerText.includes("Voice Clone"));
  record(
    "Voice Clone page loaded",
    isVoiceClonePage ? "PASS" : "FAIL",
    isVoiceClonePage ? "Voice Clone text found" : "Voice Clone text not found",
  );

  const hasContent = await page.evaluate(() => {
    const body = document.body.innerText;
    return body.includes("cloned") || body.includes("Upload Voice Clone") || body.includes("ElevenLab");
  });
  record(
    "Voice Clone content rendered",
    hasContent ? "PASS" : "WARN",
    hasContent ? "Content found (voice list or setup message)" : "No expected content found",
  );

  const hasError = await page.evaluate(() => {
    return document.body.innerText.includes("TypeError") || document.body.innerText.includes("Cannot read properties");
  });
  record(
    "No TypeError from error handling",
    !hasError ? "PASS" : "FAIL",
    !hasError ? "No TypeError visible" : "TypeError found in page content",
  );
}

async function testSettingsModal(page: Page) {
  console.log("\n=== 5. Settings Modal ===");

  await page.goto(`${baseUrl(page)}#/`);
  await page.waitForURL(/.#\/$/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const settingsBtn = await waitFor(page, 'button:has-text("Settings")');
  if (!settingsBtn) {
    record("Settings button", "FAIL", "Settings button not found");
    return;
  }

  await settingsBtn.click();

  // Wait for modal combobox to appear
  const langSelect = await waitFor(page, 'button[role="combobox"]');
  record(
    "Settings modal opened",
    langSelect ? "PASS" : "FAIL",
    langSelect ? "Language selector found" : "Modal content not found",
  );

  // Open API key accordion
  const apiKeyTrigger =
    (await page.$('button:has-text("API Key Settings")')) || (await page.$('button:has-text("APIキー設定")'));

  if (apiKeyTrigger) {
    await apiKeyTrigger.click();
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    const inputFields = await page.$$('input[type="password"], input[type="text"]');
    record("API key accordion", inputFields.length > 0 ? "PASS" : "WARN", `${inputFields.length} input fields found`);

    await apiKeyTrigger.click();
    await page.waitForTimeout(300);
  } else {
    record("API key accordion", "WARN", "Accordion trigger not found");
  }

  // Close modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const modalAfterClose = await page.$('[data-state="open"][data-slot="dialog-overlay"]');
  record(
    "Settings modal closed",
    !modalAfterClose ? "PASS" : "WARN",
    !modalAfterClose ? "Modal dismissed" : "Modal may still be open",
  );
}

async function testBGMPage(page: Page) {
  console.log("\n=== 6. BGM Page ===");

  await page.goto(`${baseUrl(page)}#/bgm`);
  await page.waitForURL(/.#\/bgm/, { timeout: CONFIG.NAVIGATION_TIMEOUT_MS }).catch(() => {});

  const pageTitle = await page.evaluate(() => {
    const headings = document.querySelectorAll("h2, h1");
    for (const h of headings) {
      if (h.textContent?.includes("BGM")) return h.textContent.trim();
    }
    return null;
  });

  record(
    "BGM page loaded",
    pageTitle ? "PASS" : "WARN",
    pageTitle ? `Heading: "${pageTitle}"` : "BGM heading not found",
  );
}

async function testHealthReport(monitor: Monitor) {
  console.log("\n=== 7. Console & Runtime Health ===");

  // Console errors
  record(
    "Console errors",
    monitor.consoleErrors.length === 0 ? "PASS" : "FAIL",
    monitor.consoleErrors.length === 0
      ? "No errors"
      : `${monitor.consoleErrors.length} error(s): ${monitor.consoleErrors.slice(0, 3).join("; ")}`,
  );

  // Critical pattern hits (ERR_INVALID_ARG_VALUE, TypeError, Cannot read properties)
  record(
    "Critical runtime patterns",
    monitor.criticalHits.length === 0 ? "PASS" : "FAIL",
    monitor.criticalHits.length === 0
      ? "None detected"
      : `${monitor.criticalHits.length} hit(s): ${monitor.criticalHits.slice(0, 3).join("; ")}`,
  );

  // Uncaught page errors
  record(
    "Uncaught page errors (pageerror)",
    monitor.pageErrors.length === 0 ? "PASS" : "FAIL",
    monitor.pageErrors.length === 0
      ? "None"
      : `${monitor.pageErrors.length} error(s): ${monitor.pageErrors.slice(0, 3).join("; ")}`,
  );

  // Console warnings (non-critical)
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
  console.log("  TypeScript 6 Upgrade QA Test Suite");
  console.log("========================================\n");

  const resources: { browser: Browser | null } = { browser: null };

  try {
    resources.browser = await connectCDP();
    const contexts = resources.browser.contexts();

    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    const page = findAppPage(contexts);
    console.log(`✓ Found app page: ${page.url()}\n`);

    const monitor = createMonitor(page);
    monitor.start();

    // Phase 1: Dashboard
    await testDashboard(page);

    // Phase 2: New project creation, Monaco edit, reload + title persistence
    await testProjectCreateAndReload(page);

    // Phase 3: Existing project load, read-only JSON check (null checks)
    await testExistingProjectLoad(page);

    // Phase 4: Voice Clone (getErrorCause, name ?? '')
    await testVoiceClonePage(page);

    // Phase 5: Settings modal
    await testSettingsModal(page);

    // Phase 6: BGM page
    await testBGMPage(page);

    // Phase 7: Console & runtime health
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
      console.log("\n  Page errors (uncaught exceptions):");
      monitor.pageErrors.slice(0, 5).forEach((e) => console.log(`    💥 ${e}`));
    }

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
