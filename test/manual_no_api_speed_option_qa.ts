/**
 * Speed Option QA Test Suite
 *
 * Tests that the speed option is correctly displayed for OpenAI, Google, and ElevenLabs
 * TTS providers, with provider-specific min/max/step/placeholder values.
 * Also verifies that speed is hidden for unsupported providers (Gemini, Kotodama),
 * round-trip between JSON ↔ UI, provider-switch behavior, clear/empty handling,
 * and beat-level speech option overrides.
 *
 * Usage:
 *   1. Start the Electron app: yarn start
 *   2. Run the test:  npx tsx test/manual_no_api_speed_option_qa.ts
 *
 * Environment Variables:
 *   CDP_URL  – Override CDP endpoint (default: http://localhost:9222/)
 *   APP_URL  – Override app page URL match (default: localhost:5175)
 */

import playwright, { type Browser, type BrowserContext, type Page, type ConsoleMessage } from "playwright";

const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000,
  CDP_MAX_ATTEMPTS: 30,
  ACTION_DELAY_MS: 500,
  NAVIGATION_DELAY_MS: 1000,
  EDITOR_LOAD_DELAY_MS: 1500,
  EDITOR_SETTLE_DELAY_MS: 1500,
  PROJECT_CREATE_DELAY_MS: 3000,
} as const;

const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
const runId = Date.now();
const TEST_PROJECT_TITLE = `[QA] Speed Option Test ${timestamp}`;

// --- Results ---

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, status: "PASS" | "FAIL" | "WARN", detail: string) {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "\u2713" : status === "FAIL" ? "\u2717" : "\u26a0";
  console.log(`  ${icon} [${status}] ${name}: ${detail}`);
}

// --- Infrastructure ---

async function connectCDP(): Promise<Browser> {
  const cdpUrl = process.env.CDP_URL || "http://localhost:9222/";
  let attempts = 0;

  while (attempts < CONFIG.CDP_MAX_ATTEMPTS) {
    try {
      const browser = await playwright.chromium.connectOverCDP(cdpUrl);
      console.log("\u2713 Connected to CDP");
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
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function createConsoleMonitor(page: Page): ConsoleMonitor {
  const monitor: ConsoleMonitor = {
    errors: [],
    warnings: [],
    start: () => {
      page.on("console", handler);
    },
    stop: () => {
      page.off("console", handler);
    },
    reset: () => {
      monitor.errors = [];
      monitor.warnings = [];
    },
  };

  const handler = (msg: ConsoleMessage) => {
    const text = msg.text();
    const type = msg.type();
    if (type === "error") {
      monitor.errors.push(text);
    }
    if (type === "warning") {
      monitor.warnings.push(text);
    }
  };

  return monitor;
}

// --- Helpers ---

const selectAllKey = process.platform === "darwin" ? "Meta+a" : "Control+a";
const copyKey = process.platform === "darwin" ? "Meta+c" : "Control+c";
const pasteKey = process.platform === "darwin" ? "Meta+v" : "Control+v";

async function clickTabByText(page: Page, tabText: string): Promise<boolean> {
  const tabs = await page.locator('[role="tab"]').all();
  for (const tab of tabs) {
    const text = await tab.textContent();
    if (text?.trim() === tabText) {
      await tab.click();
      await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
      return true;
    }
  }
  return false;
}

async function navigateToStyleTab(page: Page): Promise<boolean> {
  return (await clickTabByText(page, "\u30b9\u30bf\u30a4\u30eb")) || (await clickTabByText(page, "Style"));
}

async function navigateToBeatTab(page: Page): Promise<boolean> {
  // BEAT(N) tab – match partial text
  const tabs = await page.locator('[role="tab"]').all();
  for (const tab of tabs) {
    const text = (await tab.textContent())?.trim() || "";
    if (text.startsWith("BEAT")) {
      await tab.click();
      await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
      return true;
    }
  }
  return false;
}

async function scrollToH4(page: Page, heading: string): Promise<boolean> {
  return page.evaluate((h) => {
    const h4s = document.querySelectorAll("h4");
    for (const el of h4s) {
      if (el.textContent?.trim() === h) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return true;
      }
    }
    return false;
  }, heading);
}

async function scrollToSpeechParams(page: Page): Promise<boolean> {
  return (await scrollToH4(page, "\u97f3\u58f0\u8a2d\u5b9a")) || (await scrollToH4(page, "Speech Parameters"));
}

async function selectOptionByPrefix(page: Page, prefix: string): Promise<boolean> {
  await page.waitForTimeout(300);
  const options = await page.locator('[role="option"]').all();
  for (const option of options) {
    const text = (await option.textContent())?.trim() || "";
    if (text.startsWith(prefix)) {
      await option.click({ force: true });
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
      return true;
    }
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  return false;
}

async function readEditorJson(page: Page): Promise<Record<string, unknown> | null> {
  const viewLines = await page.$(".monaco-editor .view-lines");
  if (!viewLines) return null;
  await viewLines.click();
  await page.waitForTimeout(300);
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
}

async function writeEditorJson(page: Page, json: Record<string, unknown>): Promise<boolean> {
  const viewLines = await page.$(".monaco-editor .view-lines");
  if (!viewLines) return false;
  await viewLines.click();
  await page.waitForTimeout(300);
  await page.keyboard.press(selectAllKey);
  await page.waitForTimeout(200);
  const newText = JSON.stringify(json, null, 2);
  await page.evaluate((t) => navigator.clipboard.writeText(t), newText);
  await page.waitForTimeout(200);
  await page.keyboard.press(pasteKey);
  await page.waitForTimeout(2000);
  return true;
}

/** Extract speechParams from JSON (handles both flat and presentationStyle nested structures) */
function getSpeechParamsFromJson(json: Record<string, unknown>): Record<string, unknown> | undefined {
  const ps = json.presentationStyle as Record<string, unknown> | undefined;
  return (ps?.speechParams || json.speechParams) as Record<string, unknown> | undefined;
}

/** Extract speakers from speechParams */
function getSpeakersFromJson(json: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const speechParams = getSpeechParamsFromJson(json);
  return (speechParams?.speakers || {}) as Record<string, Record<string, unknown>>;
}

/**
 * Find the first speaker's provider combobox inside the speech params section.
 * DOM structure: h4 "Speech Parameters" → sibling .space-y-4 →
 *   combobox[0] = Default Speaker, combobox[1] = first speaker's Provider
 */
async function findSpeakerProviderComboboxIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const h4s = document.querySelectorAll("h4");
    for (const h4 of h4s) {
      const text = h4.textContent?.trim() || "";
      if (text === "\u97f3\u58f0\u8a2d\u5b9a" || text === "Speech Parameters") {
        const parent = h4.parentElement;
        if (!parent) continue;
        const combos = parent.querySelectorAll('[role="combobox"]');
        if (combos.length >= 2) {
          const target = combos[1];
          const allCombos = document.querySelectorAll('[role="combobox"]');
          for (let i = 0; i < allCombos.length; i++) {
            if (allCombos[i] === target) return i;
          }
        }
      }
    }
    return -1;
  });
}

/** Get speed input attributes from the speech section (speaker-level). */
async function getSpeedInputInfo(
  page: Page,
): Promise<{ visible: boolean; min: string; max: string; step: string; placeholder: string; value: string }> {
  return page.evaluate(() => {
    const labels = document.querySelectorAll("label");
    for (const label of labels) {
      const text = label.textContent?.trim() || "";
      if (text === "Reading Speed" || text === "\u8aad\u307f\u4e0a\u3052\u306e\u901f\u3055") {
        const parent = label.parentElement;
        if (!parent) continue;
        const input = parent.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (input) {
          return {
            visible: true,
            min: input.getAttribute("min") || "",
            max: input.getAttribute("max") || "",
            step: input.getAttribute("step") || "",
            placeholder: input.getAttribute("placeholder") || "",
            value: input.value || "",
          };
        }
      }
    }
    return { visible: false, min: "", max: "", step: "", placeholder: "", value: "" };
  });
}

/** Get stability input visibility (ElevenLabs-only). */
async function getStabilityInputVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const labels = document.querySelectorAll("label");
    for (const label of labels) {
      const text = label.textContent?.trim() || "";
      if (text === "Stability" || text === "\u5b89\u5b9a\u6027") {
        const parent = label.closest("div");
        if (!parent) continue;
        const input =
          parent.querySelector('input[type="number"]') || parent.parentElement?.querySelector('input[type="number"]');
        if (input) return true;
      }
    }
    return false;
  });
}

/** Switch the first speaker's provider. */
async function switchSpeakerProvider(page: Page, providerName: string): Promise<boolean> {
  const comboIdx = await findSpeakerProviderComboboxIndex(page);
  if (comboIdx < 0) {
    record(`Switch provider to ${providerName}`, "FAIL", "Provider combobox not found");
    return false;
  }
  await page.locator('[role="combobox"]').nth(comboIdx).click({ force: true });
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  const selected = await selectOptionByPrefix(page, providerName);
  if (!selected) {
    record(`Switch provider to ${providerName}`, "FAIL", "Option not found in dropdown");
    return false;
  }
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  return true;
}

/** Set speed value via the UI input field using native setter + input event. */
async function setSpeedInputValue(page: Page, value: string): Promise<boolean> {
  return page.evaluate((val) => {
    const labels = document.querySelectorAll("label");
    for (const label of labels) {
      const text = label.textContent?.trim() || "";
      if (text === "Reading Speed" || text === "\u8aad\u307f\u4e0a\u3052\u306e\u901f\u3055") {
        const parent = label.parentElement;
        if (!parent) continue;
        const input = parent.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          if (setter) {
            setter.call(input, val);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }
        }
      }
    }
    return false;
  }, value);
}

/** Click the "Advanced Settings" collapsible in the beat editor, if not already open. */
async function openBeatAdvancedSettings(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Find the "Advanced Beat Settings" / "詳細設定" heading
    const headings = document.querySelectorAll("h4");
    for (const h of headings) {
      const text = h.textContent?.trim() || "";
      if (text === "Advanced Beat Settings" || text === "Advanced Settings" || text === "\u8a73\u7d30\u8a2d\u5b9a") {
        // Check if the parent collapsible is already open
        const collapsible = h.closest("[data-state]");
        if (collapsible?.getAttribute("data-state") === "open") return true;
        // Click the trigger area
        (h.closest("div") as HTMLElement)?.click();
        return true;
      }
    }
    return false;
  });
}

/** Toggle the speech options override checkbox in the beat advanced settings. */
async function toggleBeatSpeechOptionsOverride(page: Page, enable: boolean): Promise<boolean> {
  return page.evaluate((shouldEnable) => {
    const checkboxes = document.querySelectorAll('[role="checkbox"]');
    for (const cb of checkboxes) {
      // Check sibling or nearby text for "speech" / "音声オプション"
      const parent = cb.parentElement;
      if (!parent) continue;
      const text = parent.textContent?.trim() || "";
      if (text.toLowerCase().includes("speech") || text.includes("音声オプション")) {
        const isChecked = cb.getAttribute("data-state") === "checked";
        if (isChecked !== shouldEnable) {
          (cb as HTMLElement).click();
        }
        return true;
      }
    }
    return false;
  }, enable);
}

/** Get speed input info from inside the beat-level speech options override card. */
async function getBeatSpeedInputInfo(
  page: Page,
): Promise<{ visible: boolean; min: string; max: string; step: string; placeholder: string; value: string }> {
  return page.evaluate(() => {
    // Beat-level speed input is inside a Card after the speech options checkbox
    // Find all speed labels – the beat-level one is inside a card element
    const labels = document.querySelectorAll("label");
    let found = false;
    for (const label of labels) {
      const text = label.textContent?.trim() || "";
      if (text === "Reading Speed" || text === "\u8aad\u307f\u4e0a\u3052\u306e\u901f\u3055") {
        // Check if inside a Card (beat-level override)
        const card = label.closest('[class*="rounded-xl"], [class*="card"]');
        if (!card) continue;
        found = true;
        const parent = label.parentElement;
        if (!parent) continue;
        const input = parent.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (input) {
          return {
            visible: true,
            min: input.getAttribute("min") || "",
            max: input.getAttribute("max") || "",
            step: input.getAttribute("step") || "",
            placeholder: input.getAttribute("placeholder") || "",
            value: input.value || "",
          };
        }
      }
    }
    return { visible: found, min: "", max: "", step: "", placeholder: "", value: "" };
  });
}

// --- Speed Config expectations ---

interface SpeedExpectation {
  provider: string;
  providerDisplayName: string;
  visible: boolean;
  min?: string;
  max?: string;
  step?: string;
  placeholderContains?: string;
}

// Order matters: ends with ElevenLabs so Phase 3 can check stability without re-switching
const SPEED_EXPECTATIONS: SpeedExpectation[] = [
  {
    provider: "openai",
    providerDisplayName: "OpenAI",
    visible: true,
    min: "0.25",
    max: "4",
    step: "0.25",
    placeholderContains: "0.25",
  },
  {
    provider: "google",
    providerDisplayName: "Google",
    visible: true,
    min: "0.25",
    max: "2",
    step: "0.25",
    placeholderContains: "0.25",
  },
  {
    provider: "gemini",
    providerDisplayName: "Gemini",
    visible: false,
  },
  {
    provider: "kotodama",
    providerDisplayName: "Kotodama",
    visible: false,
  },
  {
    provider: "elevenlabs",
    providerDisplayName: "ElevenLabs",
    visible: true,
    min: "0.7",
    max: "1.2",
    step: "0.1",
    placeholderContains: "0.7",
  },
];

// --- Test Functions ---

/**
 * Phase 1: Create a test project, set title, navigate to Style tab.
 */
async function testSetup(page: Page): Promise<boolean> {
  console.log("\n=== 1. Setup ===");

  // Navigate to dashboard
  await page.goto(page.url().split("#")[0] + "#/");
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  // Dismiss any modal overlay
  const overlay = await page.$('[data-state="open"][aria-hidden="true"]');
  if (overlay) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  }

  // Create a new project
  const newBtn = await page.$('[data-testid="create-new-button"]');
  if (newBtn) {
    await newBtn.click();
    await page.waitForTimeout(CONFIG.PROJECT_CREATE_DELAY_MS);
    const url = page.url();
    const created = url.includes("#/project/");
    record("Create test project", created ? "PASS" : "FAIL", `URL: ${url}`);
    if (!created) return false;
  } else {
    const firstProject = await page.$('a[href*="project"]');
    if (firstProject) {
      await firstProject.click();
      await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
    } else {
      record("Setup", "FAIL", "No project found and cannot create one");
      return false;
    }
  }

  // Set project title via JSON editor
  const jsonTabOk = await clickTabByText(page, "JSON");
  if (jsonTabOk) {
    await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);
    const json = await readEditorJson(page);
    if (json) {
      json.title = TEST_PROJECT_TITLE;
      const written = await writeEditorJson(page, json);
      record("Set project title", written ? "PASS" : "FAIL", `"${TEST_PROJECT_TITLE}"`);
    } else {
      record("Set project title", "WARN", "Could not read JSON");
    }
  }

  // Navigate to Style tab
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const styleOk = await navigateToStyleTab(page);
  record("Navigate to Style tab", styleOk ? "PASS" : "FAIL", styleOk ? "OK" : "Tab not found");
  if (!styleOk) return false;

  // Scroll to Speech Parameters section
  const scrollOk = await scrollToSpeechParams(page);
  record("Scroll to Speech Parameters", scrollOk ? "PASS" : "FAIL", scrollOk ? "OK" : "Section not found");

  return scrollOk;
}

/**
 * Phase 2: For each TTS provider, switch and verify speed input visibility and attributes.
 */
async function testSpeedOptionPerProvider(page: Page): Promise<void> {
  console.log("\n=== 2. Speed Option per Provider ===");

  for (const expectation of SPEED_EXPECTATIONS) {
    const { providerDisplayName, visible, min, max, step, placeholderContains } = expectation;

    console.log(`\n--- Provider: ${providerDisplayName} ---`);

    const switched = await switchSpeakerProvider(page, providerDisplayName);
    if (!switched) continue;

    await scrollToSpeechParams(page);
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

    const speedInfo = await getSpeedInputInfo(page);

    if (visible) {
      record(
        `${providerDisplayName}: Speed visible`,
        speedInfo.visible ? "PASS" : "FAIL",
        speedInfo.visible ? "Visible" : "Not visible (expected visible)",
      );

      if (speedInfo.visible) {
        if (min !== undefined) {
          record(
            `${providerDisplayName}: min=${min}`,
            speedInfo.min === min ? "PASS" : "FAIL",
            `actual="${speedInfo.min}"`,
          );
        }
        if (max !== undefined) {
          record(
            `${providerDisplayName}: max=${max}`,
            speedInfo.max === max ? "PASS" : "FAIL",
            `actual="${speedInfo.max}"`,
          );
        }
        if (step !== undefined) {
          record(
            `${providerDisplayName}: step=${step}`,
            speedInfo.step === step ? "PASS" : "FAIL",
            `actual="${speedInfo.step}"`,
          );
        }
        if (placeholderContains !== undefined) {
          const hasRange = speedInfo.placeholder.includes(placeholderContains);
          record(
            `${providerDisplayName}: placeholder contains "${placeholderContains}"`,
            hasRange ? "PASS" : "FAIL",
            `actual="${speedInfo.placeholder}"`,
          );
        }
      }
    } else {
      record(
        `${providerDisplayName}: Speed hidden`,
        !speedInfo.visible ? "PASS" : "FAIL",
        !speedInfo.visible ? "Hidden (correct)" : "Visible (expected hidden)",
      );
    }
  }
}

/**
 * Phase 3: ElevenLabs-specific fields (stability, similarity_boost) should only appear for ElevenLabs.
 */
async function testElevenLabsExclusiveFields(page: Page): Promise<void> {
  console.log("\n=== 3. ElevenLabs-Exclusive Fields ===");

  // Phase 2 ends with ElevenLabs selected, so no need to switch
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  const visible = await getStabilityInputVisible(page);
  record("ElevenLabs: Stability visible", visible ? "PASS" : "FAIL", visible ? "OK" : "Not found");

  const switched2 = await switchSpeakerProvider(page, "OpenAI");
  if (switched2) {
    await scrollToSpeechParams(page);
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    const visible = await getStabilityInputVisible(page);
    record("OpenAI: Stability hidden", !visible ? "PASS" : "FAIL", !visible ? "OK" : "Should not appear");
  }

  const switched3 = await switchSpeakerProvider(page, "Google");
  if (switched3) {
    await scrollToSpeechParams(page);
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    const visible = await getStabilityInputVisible(page);
    record("Google: Stability hidden", !visible ? "PASS" : "FAIL", !visible ? "OK" : "Should not appear");
  }
}

/**
 * Phase 4a: JSON → UI: Set speed in JSON, verify on Style tab.
 */
async function testJsonToUi(page: Page): Promise<void> {
  console.log("\n=== 4a. JSON → UI ===");

  // Ensure OpenAI provider
  await navigateToStyleTab(page);
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  const switched = await switchSpeakerProvider(page, "OpenAI");
  if (!switched) {
    record("4a: Switch to OpenAI", "FAIL", "Could not switch provider");
    return;
  }

  // Switch to JSON tab
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const jsonTabOk = await clickTabByText(page, "JSON");
  if (!jsonTabOk) {
    record("4a: JSON tab", "FAIL", "Could not switch to JSON tab");
    return;
  }
  await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);

  const json = await readEditorJson(page);
  if (!json) {
    record("4a: Read JSON", "FAIL", "Could not read JSON from editor");
    return;
  }

  const speakers = getSpeakersFromJson(json);
  const speakerKeys = Object.keys(speakers);
  if (speakerKeys.length === 0) {
    record("4a: Speaker found", "FAIL", "No speakers defined");
    return;
  }

  const key = speakerKeys[0];
  const testSpeed = 2.5;

  // Set speed
  if (!speakers[key].speechOptions) {
    speakers[key].speechOptions = {};
  }
  (speakers[key].speechOptions as Record<string, unknown>).speed = testSpeed;

  const written = await writeEditorJson(page, json);
  record("4a: Write speed to JSON", written ? "PASS" : "FAIL", `speed=${testSpeed} on "${key}"`);
  if (!written) return;

  // Switch to Style tab and check
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  await navigateToStyleTab(page);
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const speedInfo = await getSpeedInputInfo(page);
  record(
    "4a: Speed reflected on UI",
    speedInfo.value === String(testSpeed) ? "PASS" : "FAIL",
    `expected="${testSpeed}", actual="${speedInfo.value}"`,
  );
}

/**
 * Phase 4b: UI → JSON: Set speed on UI, verify in JSON.
 */
async function testUiToJson(page: Page): Promise<void> {
  console.log("\n=== 4b. UI → JSON ===");

  // Ensure on Style tab with OpenAI
  await navigateToStyleTab(page);
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  const switched = await switchSpeakerProvider(page, "OpenAI");
  if (!switched) {
    record("4b: Switch to OpenAI", "FAIL", "Could not switch provider");
    return;
  }

  // Set speed via UI
  const uiSpeed = "3.0";
  const setOk = await setSpeedInputValue(page, uiSpeed);
  record("4b: Set speed via UI", setOk ? "PASS" : "FAIL", `speed=${uiSpeed}`);
  if (!setOk) return;

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Switch to JSON and verify
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const jsonTabOk = await clickTabByText(page, "JSON");
  if (!jsonTabOk) {
    record("4b: JSON tab", "FAIL", "Could not switch to JSON tab");
    return;
  }
  await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);

  const json = await readEditorJson(page);
  if (!json) {
    record("4b: Read JSON", "FAIL", "Could not read JSON");
    return;
  }

  const speakers = getSpeakersFromJson(json);
  const key = Object.keys(speakers)[0];
  const speedInJson = (speakers[key]?.speechOptions as Record<string, unknown> | undefined)?.speed;

  record(
    "4b: Speed reflected in JSON",
    speedInJson === Number(uiSpeed) ? "PASS" : "FAIL",
    `expected=${uiSpeed}, actual=${speedInJson}`,
  );
}

/**
 * Phase 4c: Clear speed (empty) → verify removed from JSON.
 */
async function testClearSpeed(page: Page): Promise<void> {
  console.log("\n=== 4c. Clear Speed ===");

  // Ensure on Style tab with OpenAI and a speed value already set
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  await navigateToStyleTab(page);
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Clear speed input by setting empty string
  const cleared = await setSpeedInputValue(page, "");
  record("4c: Clear speed via UI", cleared ? "PASS" : "FAIL", 'Set to ""');
  if (!cleared) return;

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Switch to JSON and verify speed is absent
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const jsonTabOk = await clickTabByText(page, "JSON");
  if (!jsonTabOk) {
    record("4c: JSON tab", "FAIL", "Could not switch to JSON tab");
    return;
  }
  await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);

  const json = await readEditorJson(page);
  if (!json) {
    record("4c: Read JSON", "FAIL", "Could not read JSON");
    return;
  }

  const speakers = getSpeakersFromJson(json);
  const key = Object.keys(speakers)[0];
  const speechOptions = speakers[key]?.speechOptions as Record<string, unknown> | undefined;
  const hasSpeed = speechOptions && "speed" in speechOptions;

  record(
    "4c: Speed removed from JSON",
    !hasSpeed ? "PASS" : "FAIL",
    !hasSpeed ? "speed key absent (correct)" : `speed still present: ${speechOptions?.speed}`,
  );
}

/**
 * Phase 4d: Provider switch with speed value – speed persists for providers that support it,
 *           disappears for unsupported, reappears when switching back.
 */
async function testProviderSwitchWithSpeed(page: Page): Promise<void> {
  console.log("\n=== 4d. Provider Switch with Speed ===");

  // Set speed on OpenAI via JSON
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  await navigateToStyleTab(page);
  await scrollToSpeechParams(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const switched1 = await switchSpeakerProvider(page, "OpenAI");
  if (!switched1) return;

  const uiSpeed = "1.5";
  const setOk = await setSpeedInputValue(page, uiSpeed);
  record("4d: Set speed=1.5 on OpenAI", setOk ? "PASS" : "FAIL", "");
  if (!setOk) return;

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Switch to Gemini (no speed support) → speed should disappear
  const switched2 = await switchSpeakerProvider(page, "Gemini");
  if (switched2) {
    await scrollToSpeechParams(page);
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    const info = await getSpeedInputInfo(page);
    record(
      "4d: Gemini hides speed",
      !info.visible ? "PASS" : "FAIL",
      !info.visible ? "Hidden (correct)" : "Still visible",
    );
  }

  // Switch to Google (speed supported) → speed field should reappear with Google's range
  const switched3 = await switchSpeakerProvider(page, "Google");
  if (switched3) {
    await scrollToSpeechParams(page);
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    const info = await getSpeedInputInfo(page);
    record("4d: Google shows speed", info.visible ? "PASS" : "FAIL", info.visible ? "Visible" : "Not visible");
    if (info.visible) {
      record("4d: Google max=2", info.max === "2" ? "PASS" : "FAIL", `actual max="${info.max}"`);
    }
  }

  // Restore to OpenAI for subsequent tests
  await switchSpeakerProvider(page, "OpenAI");
}

/**
 * Phase 5: Beat-level speech options override – speed field in Advanced Settings.
 */
async function testBeatLevelSpeedOverride(page: Page): Promise<void> {
  console.log("\n=== 5. Beat-Level Speed Override ===");

  // Navigate to BEAT tab
  const beatOk = await navigateToBeatTab(page);
  record("5: Navigate to BEAT tab", beatOk ? "PASS" : "FAIL", beatOk ? "OK" : "BEAT tab not found");
  if (!beatOk) return;

  // Scroll to bottom to find Advanced Settings
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Open Advanced Settings
  const advancedOk = await openBeatAdvancedSettings(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  record("5: Open Advanced Settings", advancedOk ? "PASS" : "WARN", advancedOk ? "OK" : "Not found or already open");

  // Toggle speech options override ON
  const toggleOk = await toggleBeatSpeechOptionsOverride(page, true);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  record("5: Enable speech override", toggleOk ? "PASS" : "FAIL", toggleOk ? "Enabled" : "Checkbox not found");
  if (!toggleOk) return;

  // Verify speed field appears in the beat-level card
  const beatSpeed = await getBeatSpeedInputInfo(page);
  record(
    "5: Beat speed field visible",
    beatSpeed.visible ? "PASS" : "FAIL",
    beatSpeed.visible ? "Visible" : "Not found",
  );

  if (beatSpeed.visible) {
    // Verify it has OpenAI's attributes (the speaker is set to OpenAI)
    record(
      "5: Beat speed has provider attrs",
      beatSpeed.min === "0.25" && beatSpeed.max === "4" ? "PASS" : "FAIL",
      `min="${beatSpeed.min}", max="${beatSpeed.max}"`,
    );
  }

  // Verify in JSON that beat.speechOptions exists
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const jsonTabOk = await clickTabByText(page, "JSON");
  if (jsonTabOk) {
    await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);
    const json = await readEditorJson(page);
    if (json) {
      const beats = json.beats as Array<Record<string, unknown>> | undefined;
      const firstBeat = beats?.[0];
      const hasSpeechOptions = firstBeat && "speechOptions" in firstBeat;
      record(
        "5: Beat speechOptions in JSON",
        hasSpeechOptions ? "PASS" : "FAIL",
        hasSpeechOptions ? "Present" : "Missing",
      );
    }
  }

  // Cleanup: toggle speech options override OFF
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  await navigateToBeatTab(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  await openBeatAdvancedSettings(page);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  await toggleBeatSpeechOptionsOverride(page, false);
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
}

/**
 * Phase 6: Console health.
 */
async function testConsoleHealth(monitor: ConsoleMonitor): Promise<void> {
  console.log("\n=== 6. Console Health ===");
  record("Console errors", monitor.errors.length === 0 ? "PASS" : "WARN", `${monitor.errors.length} error(s) total`);
  if (monitor.errors.length > 0) {
    console.log(`    Errors: ${monitor.errors.slice(0, 5).join("; ")}`);
  }
}

// --- Main ---

(async () => {
  console.log("========================================");
  console.log("  Speed Option QA Test Suite");
  console.log(`  ${timestamp}`);
  console.log(`  Run ID: ${runId}`);
  console.log(`  Project: "${TEST_PROJECT_TITLE}"`);
  console.log("========================================\n");

  let exitCode = 1;

  try {
    const browser = await connectCDP();
    const contexts = browser.contexts();

    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    const page = findAppPage(contexts);
    console.log(`App page: ${page.url()}`);

    const monitor = createConsoleMonitor(page);
    monitor.start();

    // Phase 1: Setup
    console.log("\n==========================================");
    console.log("  Phase 1: Setup");
    console.log("==========================================");
    const setupOk = await testSetup(page);

    if (setupOk) {
      // Phase 2: Speed per provider
      console.log("\n==========================================");
      console.log("  Phase 2: Speed Option Visibility & Attributes");
      console.log("==========================================");
      await testSpeedOptionPerProvider(page);

      // Phase 3: ElevenLabs-exclusive fields
      console.log("\n==========================================");
      console.log("  Phase 3: ElevenLabs-Exclusive Fields");
      console.log("==========================================");
      await testElevenLabsExclusiveFields(page);

      // Phase 4: Round-trip
      console.log("\n==========================================");
      console.log("  Phase 4: Round-Trip (JSON ↔ UI)");
      console.log("==========================================");
      await testJsonToUi(page);
      await testUiToJson(page);
      await testClearSpeed(page);
      await testProviderSwitchWithSpeed(page);

      // Phase 5: Beat-level override
      console.log("\n==========================================");
      console.log("  Phase 5: Beat-Level Speed Override");
      console.log("==========================================");
      await testBeatLevelSpeedOverride(page);
    }

    // Phase 6: Health
    console.log("\n==========================================");
    console.log("  Phase 6: Console Health");
    console.log("==========================================");
    monitor.stop();
    await testConsoleHealth(monitor);

    // --- Summary ---
    console.log("\n========================================");
    console.log("  Summary");
    console.log("========================================");

    const pass = results.filter((r) => r.status === "PASS").length;
    const fail = results.filter((r) => r.status === "FAIL").length;
    const warn = results.filter((r) => r.status === "WARN").length;
    console.log(`  PASS: ${pass}  |  FAIL: ${fail}  |  WARN: ${warn}  |  Total: ${results.length}`);

    if (fail > 0) {
      console.log("\n  Failed tests:");
      results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`    \u2717 ${r.name}: ${r.detail}`));
    }

    exitCode = fail > 0 ? 1 : 0;
  } catch (error: unknown) {
    console.error("\nFatal error:", error instanceof Error ? error.message : String(error));
  }

  console.log(`\nExit code: ${exitCode}`);
  process.exit(exitCode);
})();
