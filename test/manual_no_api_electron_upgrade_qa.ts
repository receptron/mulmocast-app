/**
 * Electron Upgrade QA Test Suite
 *
 * Manual test script to verify basic functionality after Electron version upgrades.
 * Connects to a running Electron app via CDP and validates:
 *   - Chromium version
 *   - Dashboard display
 *   - Page navigation
 *   - Monaco Editor display & interaction
 *   - Settings modal & API key accordion
 *   - Clipboard IPC (dev mode)
 *   - Console errors & deprecation warnings
 *
 * Usage:
 *   1. Start the app: yarn start
 *   2. Run: npx tsx test/manual_no_api_electron_upgrade_qa.ts [expected-chromium-major]
 *      e.g. npx tsx test/manual_no_api_electron_upgrade_qa.ts 144
 *
 * Environment variables:
 *   CDP_URL  - CDP endpoint (default: http://localhost:9222/)
 *   APP_URL  - App URL fragment to match (default: localhost:5175)
 */
import playwright, { Browser, BrowserContext, ConsoleMessage, Page } from "playwright-core";

const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000,
  CDP_MAX_ATTEMPTS: 30,
  ACTION_DELAY_MS: 500,
  NAVIGATION_DELAY_MS: 1000,
  EDITOR_LOAD_DELAY_MS: 1500,
  PROJECT_CREATE_DELAY_MS: 3000,
} as const;

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

// --- Infrastructure ---

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
  const appUrl = process.env.APP_URL || "localhost:5175";
  for (const context of contexts) {
    const page = context.pages().find((p) => p.url().includes(appUrl));
    if (page) return page;
  }
  // fallback: try 5173
  for (const context of contexts) {
    const page = context.pages().find((p) => p.url().includes("localhost:5173"));
    if (page) return page;
  }
  throw new Error("Could not find application page");
}

// --- Console Monitoring ---

interface ConsoleMonitor {
  errors: string[];
  warnings: string[];
  deprecations: string[];
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function createConsoleMonitor(page: Page): ConsoleMonitor {
  const monitor: ConsoleMonitor = {
    errors: [],
    warnings: [],
    deprecations: [],
    start: () => {
      page.on("console", handler);
    },
    stop: () => {
      page.off("console", handler);
    },
    reset: () => {
      monitor.errors = [];
      monitor.warnings = [];
      monitor.deprecations = [];
    },
  };

  const handler = (msg: ConsoleMessage) => {
    const text = msg.text();
    const type = msg.type();
    const lowerText = text.toLowerCase();

    if (type === "error") {
      monitor.errors.push(text);
    }
    if (type === "warning") {
      monitor.warnings.push(text);
    }
    if (lowerText.includes("deprecat") || lowerText.includes("clipboard")) {
      monitor.deprecations.push(`[${type}] ${text}`);
    }
  };

  return monitor;
}

// --- Test Cases ---

async function testBrowserVersion(browser: Browser, expectedMajor: string | undefined) {
  console.log("\n=== 1. Electron / Chromium Version ===");
  const version = browser.version();
  console.log(`  Browser version: ${version}`);

  if (expectedMajor) {
    const matches = version.startsWith(`${expectedMajor}.`);
    record("Chromium version", matches ? "PASS" : "WARN", `Got ${version}, expected ${expectedMajor}.x`);
  } else {
    record("Chromium version", "PASS", `Version: ${version} (no expected version specified)`);
  }
}

async function testDashboard(page: Page) {
  console.log("\n=== 2. Dashboard ===");

  // Navigate to home
  await page.goto(page.url().split("#")[0] + "#/");
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  const title = await page.title();
  record("Page title", title === "MulmoCast" ? "PASS" : "FAIL", `Title: "${title}"`);

  // Check create-new button exists
  const newProjectBtn = await page.$('[data-testid="create-new-button"]');
  record(
    "Dashboard loaded",
    newProjectBtn ? "PASS" : "FAIL",
    newProjectBtn ? "Create new button found" : "Button not found",
  );

  // Check project list is populated
  const projectCards = await page.$$('[data-testid="project-card"]');
  record("Project list", "PASS", `${projectCards.length} projects displayed`);
}

async function testProjectNavigation(page: Page): Promise<string | null> {
  console.log("\n=== 3. Project Creation & Navigation ===");

  const newBtn = await page.$('[data-testid="create-new-button"]');
  if (!newBtn) {
    record("Create project", "FAIL", "Create new button not found");
    return null;
  }

  await newBtn.click();
  await page.waitForTimeout(CONFIG.PROJECT_CREATE_DELAY_MS);

  const url = page.url();
  const isProjectPage = url.includes("#/project/");
  record("Project created & navigated", isProjectPage ? "PASS" : "FAIL", `URL: ${url}`);

  if (isProjectPage) {
    // Check key project page elements
    const beatTab = await page.$('button:has-text("BEAT")');
    record("BEAT tab visible", beatTab ? "PASS" : "FAIL", beatTab ? "Found" : "Not found");

    const jsonTab = await page.$('button:has-text("JSON")');
    record("JSON tab visible", jsonTab ? "PASS" : "FAIL", jsonTab ? "Found" : "Not found");
  }

  return isProjectPage ? url : null;
}

async function testMonacoEditor(page: Page) {
  console.log("\n=== 4. Monaco Editor ===");

  const selectAllKey = process.platform === "darwin" ? "Meta+a" : "Control+a";
  const copyKey = process.platform === "darwin" ? "Meta+c" : "Control+c";
  const pasteKey = process.platform === "darwin" ? "Meta+v" : "Control+v";
  const undoKey = process.platform === "darwin" ? "Meta+z" : "Control+z";
  const TEST_TITLE = "Electron QA Test Project";

  // Click JSON tab
  const jsonTab = await page.$('button:has-text("JSON")');
  if (!jsonTab) {
    record("Monaco Editor - JSON tab", "FAIL", "JSON tab not found");
    return;
  }

  await jsonTab.click();
  await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);

  // Check Monaco Editor is rendered
  const monacoEditor = await page.$(".monaco-editor");
  record("Monaco Editor rendered", monacoEditor ? "PASS" : "FAIL", monacoEditor ? "DOM found" : "Not found");
  if (!monacoEditor) return;

  // Check editor has content
  const editorLines = await page.$$(".monaco-editor .view-line");
  record("Monaco Editor content", editorLines.length > 0 ? "PASS" : "WARN", `${editorLines.length} lines rendered`);

  // --- Realistic editing: change title, clear description ---
  try {
    // Click into editor
    const viewLines = await page.$(".monaco-editor .view-lines");
    if (!viewLines) {
      record("Monaco Editor edit", "WARN", "Could not find .view-lines element");
      return;
    }
    await viewLines.click();
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    // Select all & copy to get current JSON
    await page.keyboard.press(selectAllKey);
    await page.waitForTimeout(200);
    await page.keyboard.press(copyKey);
    await page.waitForTimeout(200);

    const originalJson = await page.evaluate(() => navigator.clipboard.readText());

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(originalJson);
    } catch {
      record("Monaco Editor edit", "WARN", "Could not parse editor content as JSON");
      return;
    }

    const originalTitle = parsed.title as string;
    const originalDescription = parsed.description as string;
    record("Monaco Editor read", "PASS", `title="${originalTitle}", description="${originalDescription}"`);

    // --- Helper: select all, paste JSON, wait for save ---
    const pasteJson = async (json: string) => {
      await page.evaluate((text) => navigator.clipboard.writeText(text), json);
      await page.waitForTimeout(200);
      await page.keyboard.press(selectAllKey);
      await page.waitForTimeout(200);
      await page.keyboard.press(pasteKey);
      // Wait for editor to process paste and trigger save (IPC round-trip)
      await page.waitForTimeout(3000);
    };

    // --- Helper: select all, copy, parse JSON ---
    const readEditorJson = async (): Promise<Record<string, unknown> | null> => {
      await page.keyboard.press(selectAllKey);
      await page.waitForTimeout(200);
      await page.keyboard.press(copyKey);
      await page.waitForTimeout(200);
      const text = await page.evaluate(() => navigator.clipboard.readText());
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    // --- Step 1: Change title, insert test text into description ---
    // "mulmocast" → "QA Test mulmocast" (insert)
    parsed.title = TEST_TITLE;
    parsed.description = `QA Test ${originalDescription}`;
    await pasteJson(JSON.stringify(parsed, null, 2));

    const step1 = await readEditorJson();
    if (!step1) {
      record("Monaco Editor edit", "FAIL", "Step 1: modified content is not valid JSON");
      return;
    }

    record(
      "Monaco edit: title change",
      step1.title === TEST_TITLE ? "PASS" : "FAIL",
      step1.title === TEST_TITLE ? `title → "${TEST_TITLE}"` : `title is "${step1.title}"`,
    );
    record(
      "Monaco edit: description insert",
      step1.description === `QA Test ${originalDescription}` ? "PASS" : "FAIL",
      `description → "${step1.description}"`,
    );

    // --- Step 2: Cmd+Z undo within JSON tab (no tab switch) ---
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(undoKey);
    }
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    const afterCmdZ = await readEditorJson();
    if (afterCmdZ) {
      const cmdZWorked = afterCmdZ.title === originalTitle;
      record(
        "Monaco Cmd+Z undo (no tab switch)",
        cmdZWorked ? "PASS" : "WARN",
        cmdZWorked ? `title restored to "${originalTitle}"` : `title is "${afterCmdZ.title}"`,
      );
    } else {
      record("Monaco Cmd+Z undo", "WARN", "Could not verify (parse error)");
    }

    // --- Step 3: Re-apply edits: title change + description insert + delete ---
    parsed.title = TEST_TITLE;
    parsed.description = `QA Test ${originalDescription}`;
    await pasteJson(JSON.stringify(parsed, null, 2));

    // "QA Test mulmocast" → "QA Test" (delete original text)
    parsed.description = "QA Test";
    await pasteJson(JSON.stringify(parsed, null, 2));

    const step3 = await readEditorJson();
    if (!step3) {
      record("Monaco Editor edit", "FAIL", "Step 3: modified content is not valid JSON");
      return;
    }

    record(
      "Monaco edit: description delete",
      step3.description === "QA Test" ? "PASS" : "FAIL",
      `description → "${step3.description}"`,
    );

    // --- Step 4: Switch to BEAT tab and verify title is reflected ---
    const beatTab = await page.$('button:has-text("BEAT")');
    if (beatTab) {
      await beatTab.click();
      await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
    }

    const domText = await page.evaluate(() => document.body.innerText);
    const titleReflected = domText.includes(TEST_TITLE);
    record(
      "Monaco → BEAT sync",
      titleReflected ? "PASS" : "WARN",
      titleReflected ? "Title change reflected in BEAT tab" : "Title not found in BEAT tab",
    );

    // --- Step 5: App-level undo via undo button ---
    // The undo button is next to "動画のストーリーを作る" heading
    const undoBtn = await page.$("button:has(svg.lucide-undo-icon)");
    if (undoBtn) {
      const isDisabled = await undoBtn.getAttribute("disabled");
      if (isDisabled === null) {
        await undoBtn.click();
        await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

        // Keep clicking until title reverts or button is disabled
        for (let i = 0; i < 10; i++) {
          const currentTitle = await page.evaluate(() => {
            const els = document.querySelectorAll("h1");
            for (const el of els) {
              if (el.textContent && !el.textContent.includes("MulmoCast")) return el.textContent;
            }
            return null;
          });
          if (currentTitle === originalTitle) break;

          const btn = await page.$("button:has(svg.lucide-undo-icon)");
          if (!btn) break;
          const dis = await btn.getAttribute("disabled");
          if (dis !== null) break;
          await btn.click();
          await page.waitForTimeout(500);
        }

        const titleAfterUndo = await page.evaluate(() => {
          const els = document.querySelectorAll("h1");
          for (const el of els) {
            if (el.textContent && !el.textContent.includes("MulmoCast")) return el.textContent;
          }
          return null;
        });

        const appUndoWorked = titleAfterUndo === originalTitle;
        record(
          "App undo button",
          appUndoWorked ? "PASS" : "WARN",
          appUndoWorked ? `title restored to "${originalTitle}"` : `title is "${titleAfterUndo}"`,
        );
      } else {
        record("App undo button", "WARN", "Undo button is disabled (no history)");
      }
    } else {
      record("App undo button", "WARN", "Undo button not found (tried svg.lucide-undo)");
    }
  } catch (error: unknown) {
    record("Monaco Editor interaction", "WARN", `Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Return to BEAT tab
  const beatTabFinal = await page.$('button:has-text("BEAT")');
  if (beatTabFinal) {
    await beatTabFinal.click();
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  }
}

async function testSettingsModal(page: Page) {
  console.log("\n=== 5. Settings Modal ===");

  // Open settings modal
  const settingsBtn = await page.$('[data-testid="settings-button"]');
  if (!settingsBtn) {
    record("Settings button", "FAIL", "Settings button not found");
    return;
  }

  await settingsBtn.click();
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  // Check modal opened - language selector
  const langSelect = await page.$('[data-testid="language-select"]');
  record(
    "Settings modal opened",
    langSelect ? "PASS" : "FAIL",
    langSelect ? "Language selector found" : "Modal content not found",
  );

  // Open API key accordion (Collapsible trigger)
  const apiKeyTrigger =
    (await page.$('button:has-text("APIキー設定")')) ||
    (await page.$('button:has-text("API Key Settings")')) ||
    (await page.$('button:has-text("API Key")'));

  if (apiKeyTrigger) {
    await apiKeyTrigger.click();
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    // Count input fields (including password inputs for API keys)
    const inputFields = await page.$$('input[type="password"], input[type="text"]');
    record(
      "API key accordion",
      inputFields.length > 0 ? "PASS" : "WARN",
      `${inputFields.length} input fields found after expanding accordion`,
    );

    // Close accordion
    await apiKeyTrigger.click();
    await page.waitForTimeout(300);
  } else {
    record("API key accordion", "WARN", "Accordion trigger not found");
  }

  // Close modal with Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Verify modal closed
  const modalAfterClose = await page.$('[data-testid="language-select"]');
  record(
    "Settings modal closed",
    !modalAfterClose ? "PASS" : "WARN",
    !modalAfterClose ? "Modal dismissed" : "Modal may still be open",
  );
}

async function testClipboardIPC(page: Page, monitor: ConsoleMonitor) {
  console.log("\n=== 6. Clipboard IPC (dev mode) ===");

  // Find clipboard button (dev mode only)
  const copyMsgBtn =
    (await page.$('button:has-text("メッセージをコピー")')) || (await page.$('button:has-text("Copy message")'));

  if (!copyMsgBtn) {
    record("Clipboard button (dev)", "WARN", "Not found - may not be in dev mode");
    return;
  }

  record("Clipboard button (dev)", "PASS", "Button found (dev mode confirmed)");

  // Snapshot monitor state, reset for clipboard-specific check, then restore
  const prevErrors = [...monitor.errors];
  const prevWarnings = [...monitor.warnings];
  const prevDeprecations = [...monitor.deprecations];
  monitor.reset();

  await copyMsgBtn.click();
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  // Check for clipboard-related errors
  const clipboardErrors = monitor.errors.filter(
    (e) => e.toLowerCase().includes("clipboard") || e.toLowerCase().includes("deprecat"),
  );
  record(
    "Clipboard IPC - no errors",
    clipboardErrors.length === 0 ? "PASS" : "FAIL",
    clipboardErrors.length === 0 ? "No clipboard-related errors" : `Errors: ${clipboardErrors.join("; ")}`,
  );

  // Check for deprecation warnings
  record(
    "Clipboard - no deprecation warnings",
    monitor.deprecations.length === 0 ? "PASS" : "WARN",
    monitor.deprecations.length === 0
      ? "No deprecation/clipboard warnings"
      : `Found: ${monitor.deprecations.join("; ")}`,
  );

  // Restore previous state so testConsoleHealth sees the full session
  monitor.errors.unshift(...prevErrors);
  monitor.warnings.unshift(...prevWarnings);
  monitor.deprecations.unshift(...prevDeprecations);
}

async function testConsoleHealth(monitor: ConsoleMonitor) {
  console.log("\n=== 7. Console Health ===");

  record("Console errors", monitor.errors.length === 0 ? "PASS" : "WARN", `${monitor.errors.length} error(s) total`);

  record(
    "Deprecation warnings",
    monitor.deprecations.length === 0 ? "PASS" : "WARN",
    monitor.deprecations.length === 0 ? "None found" : `Found: ${monitor.deprecations.join("; ")}`,
  );
}

async function testExternalLinkButton(page: Page) {
  console.log("\n=== 8. External Link Button ===");

  const openFolderBtn =
    (await page.$('button:has-text("プロジェクトのフォルダを開く")')) ||
    (await page.$('button:has-text("Open project folder")'));
  record(
    "Open folder button",
    openFolderBtn ? "PASS" : "WARN",
    openFolderBtn ? "Button found (shell.openExternal available)" : "Button not found",
  );
}

// --- Main ---

(async () => {
  const expectedChromiumMajor = process.argv[2]; // e.g. "144"

  console.log("========================================");
  console.log("  Electron Upgrade QA Test Suite");
  console.log("========================================");
  if (expectedChromiumMajor) {
    console.log(`  Expected Chromium major: ${expectedChromiumMajor}`);
  }
  console.log("");

  const resources: { browser: Browser | null } = { browser: null };
  let exitCode = 1;

  try {
    resources.browser = await connectCDP();
    const contexts = resources.browser.contexts();

    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    const page = findAppPage(contexts);
    console.log(`App page: ${page.url()}`);

    // Start console monitoring
    const monitor = createConsoleMonitor(page);
    monitor.start();

    // Run tests in sequence
    await testBrowserVersion(resources.browser, expectedChromiumMajor);
    await testDashboard(page);
    await testProjectNavigation(page);
    await testMonacoEditor(page);
    await testSettingsModal(page);
    await testClipboardIPC(page, monitor);
    await testExternalLinkButton(page);
    await testConsoleHealth(monitor);

    monitor.stop();

    // Navigate back to home
    await page.goto(page.url().split("#")[0] + "#/");
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    // --- Summary ---
    console.log("\n========================================");
    console.log("  TEST SUMMARY");
    console.log("========================================");

    const pass = results.filter((r) => r.status === "PASS").length;
    const fail = results.filter((r) => r.status === "FAIL").length;
    const warn = results.filter((r) => r.status === "WARN").length;

    console.log(`  PASS: ${pass}`);
    console.log(`  FAIL: ${fail}`);
    console.log(`  WARN: ${warn}`);
    console.log(`  TOTAL: ${results.length}`);
    console.log("----------------------------------------");

    if (fail > 0) {
      console.log("\n  Failed tests:");
      results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`    ✗ ${r.name}: ${r.detail}`);
        });
    }

    if (warn > 0) {
      console.log("\n  Warnings:");
      results
        .filter((r) => r.status === "WARN")
        .forEach((r) => {
          console.log(`    ⚠ ${r.name}: ${r.detail}`);
        });
    }

    console.log("\n========================================");
    exitCode = fail > 0 ? 1 : 0;
  } catch (error) {
    console.error("\nTest suite failed:", error);
    exitCode = 1;
  } finally {
    if (resources.browser) {
      await resources.browser.close().catch(() => {});
    }
    process.exit(exitCode);
  }
})();
