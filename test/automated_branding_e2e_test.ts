/**
 * Branding E2E Test
 *
 * Automated test that starts/stops the Electron app for each brand configuration
 * and verifies that the brand name is correctly displayed in the UI.
 *
 * Test matrix:
 *   1. Default brand (no BRAND env) → expects "MulmoCast"
 *   2. BRAND=foobar → expects "Foobar"
 *
 * Usage:
 *   npx tsx test/automated_branding_e2e_test.ts
 */
import { spawn, ChildProcess } from "child_process";
import playwright, { Browser, BrowserContext, Page } from "playwright-core";
import path from "path";

const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000,
  CDP_MAX_ATTEMPTS: 50,
  PROCESS_KILL_TIMEOUT_MS: 5000,
  APP_STABILIZATION_DELAY_MS: 5000,
  NAVIGATION_DELAY_MS: 1000,
  PROJECT_CREATE_DELAY_MS: 3000,
  VITE_SERVER_WAIT_MAX_MS: 60000,
  VITE_SERVER_CHECK_INTERVAL_MS: 2000,
  BUTTON_TIMEOUT_MS: 15000,
} as const;

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, status: "PASS" | "FAIL", detail: string) {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : "✗";
  console.log(`  ${icon} [${status}] ${name}: ${detail}`);
}

// --- Infrastructure ---

function startElectronApp(brandEnv?: string): ChildProcess {
  const electronForgeBinary = process.platform === "win32" ? "electron-forge.cmd" : "electron-forge";
  const electronForgeBinPath = path.join(process.cwd(), "node_modules", ".bin", electronForgeBinary);

  const env: Record<string, string | undefined> = {
    ...process.env,
    NODE_ENV: "development",
  };
  if (brandEnv !== undefined) {
    env.BRAND = brandEnv;
  } else {
    delete env.BRAND;
  }

  const child = spawn(process.execPath, [electronForgeBinPath, "start"], {
    shell: false,
    detached: process.platform !== "win32",
    env,
  });

  child.stdout?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`  [Electron]: ${line}`);
  });

  child.stderr?.on("data", () => {
    // suppress noise
  });

  return child;
}

async function terminateElectronProcess(electronProcess: ChildProcess | null): Promise<void> {
  if (!electronProcess || electronProcess.killed) return;

  console.log("  Terminating Electron app...");

  return new Promise((resolve) => {
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        try {
          electronProcess.kill("SIGKILL");
        } catch {
          // already exited
        }
        cleanup();
      }
    }, CONFIG.PROCESS_KILL_TIMEOUT_MS);

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve();
      }
    };

    electronProcess.once("exit", cleanup);
    electronProcess.once("error", cleanup);

    try {
      if (process.platform === "win32") {
        electronProcess.kill("SIGTERM");
      } else {
        process.kill(-electronProcess.pid!, "SIGTERM");
      }
    } catch {
      cleanup();
    }
  });
}

async function ensureNoCDPConflict(): Promise<void> {
  const cdpUrl = "http://localhost:9222/";
  try {
    const resp = await fetch(`${cdpUrl}json/version`);
    if (resp.ok) {
      throw new Error(
        "Another process is already listening on CDP port 9222. " +
          "Close all Electron/MulmoCast instances before running this test.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Another process")) throw error;
    // Connection refused — port is free, good to go
  }
}

async function connectCDP(): Promise<Browser> {
  const cdpUrl = "http://localhost:9222/";
  let attempts = 0;

  while (attempts < CONFIG.CDP_MAX_ATTEMPTS) {
    try {
      return await playwright.chromium.connectOverCDP(cdpUrl);
    } catch {
      attempts++;
      if (attempts === CONFIG.CDP_MAX_ATTEMPTS) {
        throw new Error(`Failed to connect to CDP after ${CONFIG.CDP_MAX_ATTEMPTS} attempts`);
      }
      if (attempts === 1) console.log(`  Connecting to ${cdpUrl}...`);
      await new Promise((r) => setTimeout(r, CONFIG.CDP_RETRY_DELAY_MS));
    }
  }
  throw new Error("Unreachable");
}

function findAppPage(contexts: BrowserContext[]): Page | null {
  for (const port of ["5173", "5174", "5175"]) {
    for (const context of contexts) {
      const page = context.pages().find((p) => p.url().includes(`localhost:${port}`));
      if (page) return page;
    }
  }
  return null;
}

// --- Onboarding ---

async function completeOnboarding(page: Page): Promise<void> {
  try {
    const dialog = await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    if (!dialog) return;
    console.log("  Onboarding dialog detected, completing...");

    // Step 1: Welcome - Click Next
    const nextButton = await page.waitForSelector('button:has-text("Next"), button:has-text("次へ")', {
      timeout: CONFIG.BUTTON_TIMEOUT_MS,
    });
    await nextButton.click();

    // Step 2: LLM Settings - Click Next
    const nextButton2 = await page.waitForSelector('button:has-text("Next"), button:has-text("次へ")', {
      timeout: CONFIG.BUTTON_TIMEOUT_MS,
    });
    await nextButton2.click();

    // Step 3: API Key - fill dummy and click Next
    const passwordInput = await page.$('input[type="password"]:visible');
    if (passwordInput) {
      await passwordInput.fill("dummy-api-key-for-testing");
      await new Promise((r) => setTimeout(r, 500));
    }
    const nextButton3 = await page.waitForSelector('button:has-text("Next"), button:has-text("次へ")', {
      timeout: CONFIG.BUTTON_TIMEOUT_MS,
    });
    await nextButton3.click();

    // Final step: Complete
    const completeButton = await page.waitForSelector(
      'button:has-text("セットアップ完了"), button:has-text("Complete Setup")',
      { timeout: CONFIG.BUTTON_TIMEOUT_MS },
    );
    await completeButton.click();
    console.log("  ✓ Onboarding completed");
  } catch {
    // No onboarding dialog (already completed previously) — continue
    console.log("  No onboarding dialog, continuing...");
  }
}

// --- Wait for app page with polling ---

async function waitForAppPage(browser: Browser): Promise<Page> {
  let waitTime = 0;
  while (waitTime < CONFIG.VITE_SERVER_WAIT_MAX_MS) {
    const page = findAppPage(browser.contexts());
    if (page) return page;
    await new Promise((r) => setTimeout(r, CONFIG.VITE_SERVER_CHECK_INTERVAL_MS));
    waitTime += CONFIG.VITE_SERVER_CHECK_INTERVAL_MS;
  }
  throw new Error(`Could not find application page after ${CONFIG.VITE_SERVER_WAIT_MAX_MS / 1000}s`);
}

// --- Test for a single brand ---

async function testBrand(brandEnv: string | undefined, expectedName: string): Promise<void> {
  const label = brandEnv ?? "(default)";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Brand: BRAND=${label} → expected "${expectedName}"`);
  console.log(`${"=".repeat(50)}`);

  let electronProcess: ChildProcess | null = null;
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Ensure no other Electron app is on CDP port
    await ensureNoCDPConflict();

    // Start app
    console.log("  Starting Electron app...");
    electronProcess = startElectronApp(brandEnv);

    // Connect via CDP
    browser = await connectCDP();
    console.log("  ✓ Connected to CDP");

    // Wait for Vite dev server and app page
    console.log("  Waiting for app page...");
    page = await waitForAppPage(browser);
    console.log(`  ✓ Found app page: ${page.url()}`);

    // Wait for app to stabilize
    await new Promise((r) => setTimeout(r, CONFIG.APP_STABILIZATION_DELAY_MS));

    // Handle onboarding if it appears
    await completeOnboarding(page);

    // Wait for header to render (Vue app ready after onboarding)
    try {
      await page.waitForSelector("header h1", { timeout: CONFIG.BUTTON_TIMEOUT_MS });
      console.log("  ✓ Vue app rendered");
    } catch {
      record(`[${label}] Vue app render`, "FAIL", "header h1 not found after timeout");
      return;
    }

    // Test document title
    const title = await page.title();
    record(
      `[${label}] Document title`,
      title === expectedName ? "PASS" : "FAIL",
      `expected "${expectedName}", got "${title}"`,
    );

    // Test header h1
    const headerText = await page.evaluate(() => {
      const h1 = document.querySelector("header h1");
      return h1?.textContent?.trim() ?? null;
    });
    record(
      `[${label}] Header h1`,
      headerText === expectedName ? "PASS" : "FAIL",
      `expected "${expectedName}", got "${headerText}"`,
    );

    // Navigate to dashboard to ensure create-new-button is available
    // (app may restore last visited project page on startup)
    const appOrigin = new URL(page.url().replace(/#.*/, "")).origin;
    await page.goto(`${appOrigin}/#/`);
    await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

    // Create a new project and check description matches brand name
    console.log("  Creating test project...");
    const createBtn = await page.$('[data-testid="create-new-button"]');
    if (createBtn) {
      await createBtn.click();
      await new Promise((r) => setTimeout(r, CONFIG.PROJECT_CREATE_DELAY_MS));

      const url = page.url();
      const projectIdMatch = url.match(/#\/project\/(.+)/);
      const projectId = projectIdMatch?.[1] ?? null;

      if (projectId) {
        // Read description from the script via IPC
        const description = await page.evaluate(async () => {
          const api = (
            window as unknown as {
              electronAPI: { project: { getProjectMulmoScript: (id: string) => Promise<unknown> } };
            }
          ).electronAPI;
          const url = window.location.hash;
          const id = url.replace("#/project/", "");
          const script = (await api.project.getProjectMulmoScript(id)) as { description?: string } | null;
          return script?.description ?? null;
        });

        record(
          `[${label}] New project description`,
          description === expectedName ? "PASS" : "FAIL",
          `expected "${expectedName}", got "${description}"`,
        );

        // Delete the test project
        console.log("  Deleting test project...");
        await page.evaluate(async () => {
          const api = (window as unknown as { electronAPI: { project: { delete: (id: string) => Promise<unknown> } } })
            .electronAPI;
          const url = window.location.hash;
          const id = url.replace("#/project/", "");
          await api.project.delete(id);
        });
        await new Promise((r) => setTimeout(r, CONFIG.NAVIGATION_DELAY_MS));
      } else {
        record(`[${label}] New project description`, "FAIL", "Could not extract project ID from URL");
      }
    } else {
      record(`[${label}] New project description`, "FAIL", "Create new button not found");
    }

    // Navigate back to dashboard and re-check
    const dashboardBtn = await page.$('[data-testid="dashboard-button"]');
    if (dashboardBtn) {
      await dashboardBtn.click();
      await new Promise((r) => setTimeout(r, CONFIG.NAVIGATION_DELAY_MS));

      const titleAfter = await page.title();
      record(`[${label}] Title after navigation`, titleAfter === expectedName ? "PASS" : "FAIL", `got "${titleAfter}"`);

      const headerAfter = await page.evaluate(() => {
        const h1 = document.querySelector("header h1");
        return h1?.textContent?.trim() ?? null;
      });
      record(
        `[${label}] Header after navigation`,
        headerAfter === expectedName ? "PASS" : "FAIL",
        `got "${headerAfter}"`,
      );
    } else {
      record(`[${label}] Dashboard button`, "FAIL", "not found");
    }
  } catch (error) {
    record(`[${label}] Unexpected error`, "FAIL", error instanceof Error ? error.message : String(error));
  } finally {
    // Always try to close the window before terminating
    if (page) {
      console.log("  Closing application window...");
      try {
        await page.evaluate(() => window.close());
        await new Promise((r) => setTimeout(r, 1000));
      } catch {
        // page may already be closed
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
    await terminateElectronProcess(electronProcess);
    // Wait for port and CDP to be fully released
    await new Promise((r) => setTimeout(r, 5000));
  }
}

// --- Main ---

(async () => {
  console.log("=== Branding E2E Test ===");

  const brandMatrix: Array<{ brandEnv: string | undefined; expectedName: string }> = [
    { brandEnv: undefined, expectedName: "MulmoCast" },
    { brandEnv: "foobar", expectedName: "Foobar" },
  ];

  for (const { brandEnv, expectedName } of brandMatrix) {
    await testBrand(brandEnv, expectedName);
  }

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`  Results: ${passed} PASS / ${failed} FAIL`);
  console.log(`${"=".repeat(50)}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  ✗ ${r.name}: ${r.detail}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
})();
