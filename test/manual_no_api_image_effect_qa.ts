/**
 * Image Effect QA Test Suite
 *
 * Tests the Image Effect UI for html_tailwind animation beats.
 * Creates 4 projects (landscape/portrait canvas × landscape/portrait image)
 * and applies all 6 effects (zoomIn, zoomOut, moveToLeft, moveToRight, moveToTop, moveToBottom)
 * to each, verifying the resulting JSON structure.
 *
 * Usage:
 *   1. Start the Electron app: yarn start
 *   2. Run the test:  npx tsx test/manual_no_api_image_effect_qa.ts
 *
 * Environment Variables:
 *   CDP_URL  – Override CDP endpoint (default: http://localhost:9222/)
 *   APP_URL  – Override app page URL match (default: localhost:5175)
 *   RUN_GENERATE=1 – Also run "Generate Contents" and wait for completion
 */

import path from "path";
import fs from "fs";
import playwright, { type Browser, type BrowserContext, type Page, type ConsoleMessage } from "playwright";

// =====================================================================
// Config & Constants
// =====================================================================

const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000,
  CDP_MAX_ATTEMPTS: 30,
  ACTION_DELAY_MS: 500,
  NAVIGATION_DELAY_MS: 1000,
  EDITOR_LOAD_DELAY_MS: 1500,
  EDITOR_SETTLE_DELAY_MS: 1500,
  PROJECT_CREATE_DELAY_MS: 3000,
  SETTINGS_SAVE_DELAY_MS: 2000,
  EFFECT_APPLY_DELAY_MS: 1000,
} as const;

const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
const runId = Date.now();

const EFFECT_TYPES = ["zoomIn", "zoomOut", "moveToLeft", "moveToRight", "moveToTop", "moveToBottom"] as const;
type EffectType = (typeof EFFECT_TYPES)[number];

const EFFECT_DISPLAY_NAMES: Record<string, Record<EffectType, string>> = {
  en: {
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    moveToLeft: "Move to Left",
    moveToRight: "Move to Right",
    moveToTop: "Move to Top",
    moveToBottom: "Move to Bottom",
  },
  ja: {
    zoomIn: "ズームイン",
    zoomOut: "ズームアウト",
    moveToLeft: "左へ移動",
    moveToRight: "右へ移動",
    moveToTop: "上へ移動",
    moveToBottom: "下へ移動",
  },
};

/** Canvas size configurations for the 4 test projects. */
const CANVAS_CONFIGS = [
  { label: "Landscape canvas + Landscape image", width: 1792, height: 1024, imageKey: "landscape" },
  { label: "Landscape canvas + Portrait image", width: 1792, height: 1024, imageKey: "portrait" },
  { label: "Portrait canvas + Landscape image", width: 1024, height: 1792, imageKey: "landscape" },
  { label: "Portrait canvas + Portrait image", width: 1024, height: 1792, imageKey: "portrait" },
] as const;

const IMAGE_FILES: Record<string, { filename: string; extension: string }> = {
  landscape: { filename: "qa_landscape.jpg", extension: "jpg" },
  portrait: { filename: "qa_portrait.png", extension: "png" },
};

const MATERIAL_KEY = "testImage";
const SHOULD_RUN_GENERATE = process.env.RUN_GENERATE === "1";
const TARGET_BEAT_COUNT = 6;

const MINIMAL_HTML_TAILWIND_IMAGE = {
  type: "html_tailwind" as const,
  html: ["<div class='h-full w-full'></div>"],
  script: ["function render(frame,totalFrames){void frame;void totalFrames;}"],
  animation: true,
};

// =====================================================================
// Results
// =====================================================================

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

// =====================================================================
// Infrastructure
// =====================================================================

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
      if (attempts === CONFIG.CDP_MAX_ATTEMPTS)
        throw new Error(
          `Failed after ${CONFIG.CDP_MAX_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      if (attempts === 1) console.log(`Connecting to ${cdpUrl}...`);
      await new Promise((r) => setTimeout(r, CONFIG.CDP_RETRY_DELAY_MS));
    }
  }
  throw new Error("Unreachable");
}

function findAppPage(contexts: BrowserContext[]): Page {
  const appUrl = process.env.APP_URL || "localhost:5175";
  for (const ctx of contexts) {
    const p = ctx.pages().find((pg) => pg.url().includes(appUrl));
    if (p) return p;
  }
  for (const ctx of contexts) {
    const p = ctx.pages().find((pg) => pg.url().includes("localhost:5173"));
    if (p) return p;
  }
  throw new Error("Could not find application page");
}

// =====================================================================
// Console Monitor
// =====================================================================

interface ConsoleMonitor {
  errors: string[];
  warnings: string[];
  start: () => void;
  stop: () => void;
}

function createConsoleMonitor(page: Page): ConsoleMonitor {
  const monitor: ConsoleMonitor = {
    errors: [],
    warnings: [],
    start: () => page.on("console", handler),
    stop: () => page.off("console", handler),
  };
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") monitor.errors.push(msg.text());
    if (msg.type() === "warning") monitor.warnings.push(msg.text());
  };
  return monitor;
}

// =====================================================================
// Settings Helpers
// =====================================================================

async function withSettingsModal(page: Page, callback: () => Promise<void>): Promise<boolean> {
  const settingsBtn = await page.$('[data-testid="settings-button"]');
  if (!settingsBtn) {
    record("Settings button", "FAIL", "Settings button not found");
    return false;
  }
  await settingsBtn.click();
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  const langSelect = await page.$('[data-testid="language-select"]');
  if (!langSelect) {
    record("Settings modal opened", "FAIL", "Modal did not open");
    return false;
  }

  await callback();

  await page.waitForTimeout(CONFIG.SETTINGS_SAVE_DELAY_MS);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  return true;
}

async function ensureProMode(page: Page): Promise<void> {
  console.log("  Ensuring Pro mode...");
  await withSettingsModal(page, async () => {
    const modeSelect = await page.$("#mode");
    if (modeSelect) {
      await modeSelect.click({ force: true });
      await page.waitForTimeout(300);
      const proOption = page.locator('[role="option"]').filter({ hasText: /Advanced|上級/ });
      const count = await proOption.count();
      if (count > 0) {
        await proOption.first().click({ force: true });
        await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
        record("Set Pro mode", "PASS", "Selected Pro user level");
      } else {
        await page.keyboard.press("Escape");
        record("Set Pro mode", "WARN", "Pro option not found (may already be set)");
      }
    } else {
      record("Set Pro mode", "WARN", "Mode select (#mode) not found");
    }
  });
}

// =====================================================================
// Generic Helpers
// =====================================================================

const selectAllKey = process.platform === "darwin" ? "Meta+a" : "Control+a";
const copyKey = process.platform === "darwin" ? "Meta+c" : "Control+c";
const pasteKey = process.platform === "darwin" ? "Meta+v" : "Control+v";

async function clickTabByTestId(page: Page, testId: string): Promise<boolean> {
  const tab = page.locator(`[data-testid="${testId}"]`);
  if ((await tab.count()) > 0) {
    await tab.click();
    await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
    return true;
  }
  return false;
}

/** Navigate to JSON tab (settle first to avoid Monaco "Canceled" error). */
async function toJson(page: Page): Promise<boolean> {
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  const ok = await clickTabByTestId(page, "script-editor-tab-json");
  if (ok) await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);
  return ok;
}

async function toBeatTab(page: Page): Promise<boolean> {
  await page.waitForTimeout(CONFIG.EDITOR_SETTLE_DELAY_MS);
  return clickTabByTestId(page, "script-editor-tab-media");
}

// =====================================================================
// Monaco Helpers (clipboard-based — proven pattern from existing tests)
// =====================================================================

async function readEditorJson(page: Page): Promise<Record<string, unknown> | null> {
  const viewLines = await page.$(".monaco-editor .view-lines");
  if (!viewLines) return null;
  await viewLines.click();
  await page.waitForTimeout(300);
  await page.keyboard.press(selectAllKey);
  await page.waitForTimeout(200);
  await page.keyboard.press(copyKey);
  await page.waitForTimeout(200);
  const text = await page.evaluate(() =>
    (window as unknown as { electronAPI: { readClipboardText: () => string } }).electronAPI.readClipboardText(),
  );
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
  await page.evaluate(
    (t) =>
      (
        window as unknown as { electronAPI: { writeClipboardText: (text: string) => void } }
      ).electronAPI.writeClipboardText(t),
    JSON.stringify(json, null, 2),
  );
  await page.waitForTimeout(200);
  await page.keyboard.press(pasteKey);
  await page.waitForTimeout(2000);
  return true;
}

// =====================================================================
// Navigation Helpers
// =====================================================================

async function navigateToDashboard(page: Page): Promise<void> {
  const dashboardBtn = await page.$('[data-testid="dashboard-button"]');
  if (dashboardBtn) {
    await dashboardBtn.click();
    await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
  }
}

/** Detect app language (en or ja) by checking tab labels. */
async function detectLanguage(page: Page): Promise<"en" | "ja"> {
  const tabs = await page.locator('[role="tab"]').all();
  for (const tab of tabs) {
    const tabText = (await tab.textContent())?.trim() || "";
    if (tabText.includes("スタイル") || tabText.includes("メディア")) return "ja";
  }
  // Check any visible text on page
  const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 500) || "");
  if (bodyText.includes("新規") || bodyText.includes("プロジェクト")) return "ja";
  return "en";
}

// =====================================================================
// Project Setup Helpers
// =====================================================================

async function createTestProject(page: Page, configLabel: string): Promise<boolean> {
  const newBtn = await page.$('[data-testid="create-new-button"]');
  if (!newBtn) {
    record(`Create project (${configLabel})`, "FAIL", "Create button not found");
    return false;
  }
  await newBtn.click();
  await page.waitForTimeout(CONFIG.PROJECT_CREATE_DELAY_MS);
  const url = page.url();
  const success = url.includes("#/project/");
  record(`Create project (${configLabel})`, success ? "PASS" : "FAIL", `URL: ${url}`);
  return success;
}

/** Upload a test image file to Materials via IPC and return the stored path. */
async function uploadTestImage(page: Page, imageKey: string): Promise<string | null> {
  const imageFile = IMAGE_FILES[imageKey];
  const imagePath = path.resolve(__dirname, "images", imageFile.filename);

  if (!fs.existsSync(imagePath)) {
    record("Upload test image", "FAIL", `File not found: ${imagePath}`);
    return null;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const bufferArray = Array.from(new Uint8Array(imageBuffer));

  // Get projectId from URL
  const projectId = await page.evaluate(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/project\/([^/]+)/);
    return match?.[1] ?? null;
  });

  if (!projectId) {
    record("Upload test image", "FAIL", "Could not extract projectId from URL");
    return null;
  }

  // Upload via IPC
  const result = await page.evaluate(
    async ({ projId, matKey, buf, ext }) => {
      try {
        const uint8 = new Uint8Array(buf);
        const res = await (
          window as unknown as { electronAPI: { mulmoHandler: (...args: unknown[]) => Promise<unknown> } }
        ).electronAPI.mulmoHandler("mulmoReferenceImageUpload", projId, matKey, uint8, ext);
        return { success: true, path: res };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    { projId: projectId, matKey: MATERIAL_KEY, buf: bufferArray, ext: imageFile.extension },
  );

  const uploadResult = result as { success: boolean; path?: unknown; error?: string };
  record(
    "Upload test image",
    uploadResult.success ? "PASS" : "FAIL",
    uploadResult.success ? `Uploaded ${imageFile.filename} → ${uploadResult.path}` : `Error: ${uploadResult.error}`,
  );

  return uploadResult.success ? String(uploadResult.path) : null;
}

/** Set project title, description, canvas size, and add material image ref via JSON editor. */
async function setupProjectViaJson(
  page: Page,
  projectTitle: string,
  projectDescription: string,
  canvasWidth: number,
  canvasHeight: number,
  uploadedPath: string,
): Promise<boolean> {
  const jsonTabOk = await toJson(page);
  if (!jsonTabOk) {
    record("Navigate to JSON tab", "FAIL", "JSON tab not found");
    return false;
  }

  const json = await readEditorJson(page);
  if (!json) {
    record("Read JSON", "FAIL", "Could not read editor JSON");
    return false;
  }

  // Set title and description
  json.title = projectTitle;
  json.description = projectDescription;

  // Set canvas size
  json.canvasSize = { width: canvasWidth, height: canvasHeight };

  // Add material image reference with uploaded path
  const imageParams = (json.imageParams as Record<string, unknown>) || {};
  const images = (imageParams.images as Record<string, unknown>) || {};
  images[MATERIAL_KEY] = {
    type: "image",
    source: {
      kind: "path",
      path: uploadedPath,
    },
  };
  imageParams.images = images;
  json.imageParams = imageParams;

  // Keep the first beat and add 5 more beats (6 total), each with minimal valid html_tailwind payload.
  const beats = (json.beats as Array<Record<string, unknown>>) || [];
  if (beats.length === 0) {
    record("Setup project JSON", "FAIL", "No base beat found in project JSON");
    return false;
  }
  const baseBeat = beats[0];
  const seedBeats = Array.from({ length: TARGET_BEAT_COUNT }, (_, idx) => ({
    ...JSON.parse(JSON.stringify(baseBeat)),
    id: `${runId}-${idx + 1}`,
    image: JSON.parse(JSON.stringify(MINIMAL_HTML_TAILWIND_IMAGE)),
  }));
  json.beats = seedBeats;

  const written = await writeEditorJson(page, json);
  record(
    "Setup project JSON",
    written ? "PASS" : "FAIL",
    written ? `${canvasWidth}x${canvasHeight}, title="${projectTitle}"` : "Failed to write JSON",
  );
  return written;
}

// =====================================================================
// Effect Application Helpers
// =====================================================================

const IMAGE_EFFECT_SELECTORS = {
  panel: '[data-testid="image-effect-panel"]',
  effectSelect: '[data-testid="image-effect-effect-select"]',
  materialButton: '[data-testid="image-effect-material-button"]',
  setButton: '[data-testid="image-effect-set-button"]',
  durationInput: '[data-testid="image-effect-duration-input"]',
  zoomInput: '[data-testid="image-effect-zoom-input"]',
  panDistanceInput: '[data-testid="image-effect-pan-distance-input"]',
} as const;

/** Verify ImageEffect panel exists by stable test id. */
async function findEffectPanel(page: Page, beatIndex: number): Promise<boolean> {
  const panel = page.locator(IMAGE_EFFECT_SELECTORS.panel).nth(beatIndex);
  return (await panel.count()) > 0;
}

async function getEffectPanelElement(page: Page, beatIndex: number) {
  const panels = await page.$$(IMAGE_EFFECT_SELECTORS.panel);
  return panels[beatIndex] ?? null;
}

/** Find the effect type Select trigger inside the ImageEffect panel. */
async function findEffectSelectTrigger(page: Page, beatIndex: number): Promise<ReturnType<Page["$"]>> {
  const panel = await getEffectPanelElement(page, beatIndex);
  if (!panel) return null;
  return await panel.$(IMAGE_EFFECT_SELECTORS.effectSelect);
}

/** Select an option from an open dropdown by exact text. */
async function selectOptionByText(page: Page, optionText: string): Promise<boolean> {
  await page.waitForTimeout(300);
  const options = await page.$$('[role="option"]');
  for (const opt of options) {
    const text = (await opt.textContent())?.trim();
    if (text === optionText) {
      await opt.click();
      return true;
    }
  }
  // Close dropdown if option not found
  await page.keyboard.press("Escape");
  return false;
}

/** Find the material image button in the ImageEffect panel. */
async function findMaterialButton(page: Page, beatIndex: number): Promise<ReturnType<Page["$"]>> {
  const panel = await getEffectPanelElement(page, beatIndex);
  if (!panel) return null;
  return await panel.$(IMAGE_EFFECT_SELECTORS.materialButton);
}

/** Select a material from the MaterialsImageDialog. */
async function selectMaterialFromDialog(page: Page): Promise<boolean> {
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Find the dialog and click the button that contains the material key
  const dialogButtons = await page.$$('[role="dialog"] button');
  for (const btn of dialogButtons) {
    const text = (await btn.textContent())?.trim() || "";
    if (text.includes(MATERIAL_KEY)) {
      await btn.click();
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
      return true;
    }
  }
  return false;
}

/** Click the "Set" button in the ImageEffect panel. */
async function clickSetButton(page: Page, beatIndex: number): Promise<boolean> {
  const panel = await getEffectPanelElement(page, beatIndex);
  if (!panel) return false;
  const setButton = await panel.$(IMAGE_EFFECT_SELECTORS.setButton);
  if (!setButton) return false;
  const disabled = await setButton.isDisabled();
  if (disabled) return false;
  await setButton.click();
  return true;
}

/** Set an input field's value inside the ImageEffect panel by stable test id. */
async function setEffectInput(page: Page, testIdSelector: string, beatIndex: number, value: number): Promise<boolean> {
  const panel = await getEffectPanelElement(page, beatIndex);
  if (!panel) return false;
  const input = await panel.$(testIdSelector);
  if (!input) return false;
  await input.fill(String(value));
  return true;
}

/** Apply a single effect: select effect type → select material → click Set. */
async function applyEffect(
  page: Page,
  effectType: EffectType,
  beatIndex: number,
  lang: "en" | "ja",
  configLabel: string,
): Promise<boolean> {
  const testName = `${effectType} [beat ${beatIndex + 1}] (${configLabel})`;

  // 1. Go to BEAT tab
  const beatTabOk = await toBeatTab(page);
  if (!beatTabOk) {
    record(`Apply ${testName}`, "FAIL", "Could not navigate to BEAT tab");
    return false;
  }
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // 2. Verify ImageEffect panel is visible
  const panelExists = await findEffectPanel(page, beatIndex);
  if (!panelExists) {
    record(`Apply ${testName}`, "FAIL", "ImageEffect panel not found on BEAT tab");
    return false;
  }

  // 3. Select effect type
  const effectDisplayName = EFFECT_DISPLAY_NAMES[lang]?.[effectType] ?? effectType;
  const effectSelect = await findEffectSelectTrigger(page, beatIndex);
  if (!effectSelect) {
    record(`Apply ${testName}`, "FAIL", "Effect select trigger not found");
    return false;
  }
  await effectSelect.click();
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const optionSelected = await selectOptionByText(page, effectDisplayName);
  if (!optionSelected) {
    record(`Apply ${testName}`, "FAIL", `Option "${effectDisplayName}" not found in dropdown`);
    return false;
  }
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // 4. Select material image via dialog
  const materialBtn = await findMaterialButton(page, beatIndex);
  if (!materialBtn) {
    record(`Apply ${testName}`, "FAIL", "Material button not found");
    return false;
  }
  await materialBtn.click();
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const imageSelected = await selectMaterialFromDialog(page);
  if (!imageSelected) {
    record(`Apply ${testName}`, "FAIL", "Could not select material from dialog");
    return false;
  }
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // 5. Click "Set" button
  const setOk = await clickSetButton(page, beatIndex);
  if (!setOk) {
    record(`Apply ${testName}`, "FAIL", "Set button not found or disabled");
    return false;
  }
  await page.waitForTimeout(CONFIG.EFFECT_APPLY_DELAY_MS);

  return true;
}

// =====================================================================
// JSON Verification
// =====================================================================

// Default values from image_effect_data.ts
const DEFAULT_ZOOM = 120;
const DEFAULT_DURATION = 5;
const DEFAULT_PAN_DISTANCE = 10;

function extractConstNumber(scriptStr: string, name: string): number | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`const\\s+${escapedName}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)`);
  const match = scriptStr.match(regex);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** Verify effect-specific parameters with exact value checks. */
function verifyEffectParamsExact(
  scriptStr: string,
  effectType: EffectType,
  expectedZoom: number,
  expectedPanDistance: number,
): { ok: boolean; detail: string } {
  const expectedScale = expectedZoom / 100;
  const hasRender = /function\s+render\s*\(\s*frame\s*,\s*totalFrames\s*\)/.test(scriptStr);

  switch (effectType) {
    case "zoomIn": {
      const zoomFrom = extractConstNumber(scriptStr, "zoomFrom");
      const zoomTo = extractConstNumber(scriptStr, "zoomTo");
      const ok = hasRender && zoomFrom === 1 && zoomTo === expectedScale;
      return { ok, detail: `render=${hasRender}, zoomFrom=${zoomFrom}, zoomTo=${zoomTo}` };
    }
    case "zoomOut": {
      const zoomFrom = extractConstNumber(scriptStr, "zoomFrom");
      const zoomTo = extractConstNumber(scriptStr, "zoomTo");
      const ok = hasRender && zoomFrom === expectedScale && zoomTo === 1;
      return { ok, detail: `render=${hasRender}, zoomFrom=${zoomFrom}, zoomTo=${zoomTo}` };
    }
    case "moveToLeft": {
      const axis = /const\s+axis\s*=\s*["']x["']/.test(scriptStr);
      const direction = extractConstNumber(scriptStr, "direction");
      const requestedDistance = extractConstNumber(scriptStr, "requestedDistance");
      const scale = extractConstNumber(scriptStr, "zoom");
      const ok =
        hasRender && axis && direction === 1 && requestedDistance === expectedPanDistance && scale === expectedScale;
      return {
        ok,
        detail: `render=${hasRender}, axis=x, direction=${direction}, distance=${requestedDistance}, zoom=${scale}`,
      };
    }
    case "moveToRight": {
      const axis = /const\s+axis\s*=\s*["']x["']/.test(scriptStr);
      const direction = extractConstNumber(scriptStr, "direction");
      const requestedDistance = extractConstNumber(scriptStr, "requestedDistance");
      const scale = extractConstNumber(scriptStr, "zoom");
      const ok =
        hasRender && axis && direction === -1 && requestedDistance === expectedPanDistance && scale === expectedScale;
      return {
        ok,
        detail: `render=${hasRender}, axis=x, direction=${direction}, distance=${requestedDistance}, zoom=${scale}`,
      };
    }
    case "moveToTop": {
      const axis = /const\s+axis\s*=\s*["']y["']/.test(scriptStr);
      const direction = extractConstNumber(scriptStr, "direction");
      const requestedDistance = extractConstNumber(scriptStr, "requestedDistance");
      const scale = extractConstNumber(scriptStr, "zoom");
      const ok =
        hasRender && axis && direction === 1 && requestedDistance === expectedPanDistance && scale === expectedScale;
      return {
        ok,
        detail: `render=${hasRender}, axis=y, direction=${direction}, distance=${requestedDistance}, zoom=${scale}`,
      };
    }
    case "moveToBottom": {
      const axis = /const\s+axis\s*=\s*["']y["']/.test(scriptStr);
      const direction = extractConstNumber(scriptStr, "direction");
      const requestedDistance = extractConstNumber(scriptStr, "requestedDistance");
      const scale = extractConstNumber(scriptStr, "zoom");
      const ok =
        hasRender && axis && direction === -1 && requestedDistance === expectedPanDistance && scale === expectedScale;
      return {
        ok,
        detail: `render=${hasRender}, axis=y, direction=${direction}, distance=${requestedDistance}, zoom=${scale}`,
      };
    }
  }
}

/** Verify the beat's JSON structure after applying an effect with exact value checks. */
async function verifyEffectJson(
  page: Page,
  effectType: EffectType,
  beatIndex: number,
  configLabel: string,
  expectedZoom: number = DEFAULT_ZOOM,
  expectedDuration: number = DEFAULT_DURATION,
  expectedPanDistance: number = DEFAULT_PAN_DISTANCE,
): Promise<void> {
  const testPrefix = `${effectType} [beat ${beatIndex + 1}] (${configLabel})`;

  const jsonTabOk = await toJson(page);
  if (!jsonTabOk) {
    record(`${testPrefix} JSON`, "FAIL", "Could not navigate to JSON tab");
    return;
  }

  const json = await readEditorJson(page);
  if (!json) {
    record(`${testPrefix} JSON`, "FAIL", "Could not read JSON");
    return;
  }

  const beats = json.beats as Array<Record<string, unknown>>;
  if (!beats || beats.length === 0) {
    record(`${testPrefix} JSON`, "FAIL", "No beats in JSON");
    return;
  }

  const beat = beats[beatIndex];
  if (!beat) {
    record(`${testPrefix} JSON`, "FAIL", `No beat at index ${beatIndex}`);
    return;
  }
  const image = beat.image as Record<string, unknown> | undefined;

  if (!image) {
    record(`${testPrefix} image`, "FAIL", "beat.image is missing");
    return;
  }

  // 1. Check type === "html_tailwind"
  record(
    `${testPrefix} image.type`,
    image.type === "html_tailwind" ? "PASS" : "FAIL",
    `Expected "html_tailwind", got "${image.type}"`,
  );

  // 2. Check animation === true
  record(
    `${testPrefix} image.animation`,
    image.animation === true ? "PASS" : "FAIL",
    `Expected true, got ${image.animation}`,
  );

  // 3. Check html contains image:testImage reference
  const htmlStr = Array.isArray(image.html) ? (image.html as string[]).join("\n") : String(image.html || "");
  const hasImageRef = htmlStr.includes(`image:${MATERIAL_KEY}`);
  record(
    `${testPrefix} image.html ref`,
    hasImageRef ? "PASS" : "FAIL",
    hasImageRef ? `Contains "image:${MATERIAL_KEY}"` : "Missing image reference",
  );

  // 4. Check script contains render() function
  const scriptStr = Array.isArray(image.script) ? (image.script as string[]).join("\n") : String(image.script || "");
  const hasRenderFunction = /function\s+render\s*\(\s*frame\s*,\s*totalFrames\s*\)/.test(scriptStr);
  record(
    `${testPrefix} image.script`,
    hasRenderFunction ? "PASS" : "FAIL",
    hasRenderFunction ? "Contains render(frame,totalFrames)" : "Missing render function",
  );

  // 5. Check effect-specific params with exact values (Level 3+ verification)
  const paramResult = verifyEffectParamsExact(scriptStr, effectType, expectedZoom, expectedPanDistance);
  record(`${testPrefix} params exact`, paramResult.ok ? "PASS" : "FAIL", paramResult.detail);

  // 6. Check duration === expectedDuration (exact match, not just > 0)
  const duration = beat.duration;
  record(
    `${testPrefix} duration`,
    duration === expectedDuration ? "PASS" : "FAIL",
    `Expected ${expectedDuration}, got ${duration}`,
  );
}

// =====================================================================
// Test Phase Functions
// =====================================================================

/** Run all 6 effects for a single project: apply via UI → verify JSON with default values. */
async function testAllEffectsDefaults(
  page: Page,
  config: (typeof CANVAS_CONFIGS)[number],
  lang: "en" | "ja",
): Promise<void> {
  for (const [beatIndex, effectType] of EFFECT_TYPES.entries()) {
    console.log(`\n    --- Effect: ${effectType} (defaults, beat ${beatIndex + 1}) ---`);

    const applied = await applyEffect(page, effectType, beatIndex, lang, config.label);
    if (!applied) continue;

    // Verify with default values
    await verifyEffectJson(
      page,
      effectType,
      beatIndex,
      config.label,
      DEFAULT_ZOOM,
      DEFAULT_DURATION,
      DEFAULT_PAN_DISTANCE,
    );
  }
}

/** Test custom values: change zoom/duration/panDistance → Set → verify exact JSON values. */
async function testCustomValues(page: Page, config: (typeof CANVAS_CONFIGS)[number], lang: "en" | "ja"): Promise<void> {
  const customZoom = 150;
  const customDuration = 8;
  const customPanDistance = 20;

  // Test 1: zoomIn with custom zoom and duration
  {
    const effectType: EffectType = "zoomIn";
    const testLabel = `${effectType} custom (${config.label})`;
    console.log(`\n    --- ${testLabel} ---`);

    const beatIndex = EFFECT_TYPES.indexOf(effectType);
    const applied = await applyEffect(page, effectType, beatIndex, lang, config.label);
    if (applied) {
      // Go back to BEAT tab to change inputs before re-applying
      await toBeatTab(page);
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

      const zoomSet = await setEffectInput(page, IMAGE_EFFECT_SELECTORS.zoomInput, beatIndex, customZoom);
      record(`${testLabel} set zoom`, zoomSet ? "PASS" : "FAIL", `zoom=${customZoom}`);

      const durSet = await setEffectInput(page, IMAGE_EFFECT_SELECTORS.durationInput, beatIndex, customDuration);
      record(`${testLabel} set duration`, durSet ? "PASS" : "FAIL", `duration=${customDuration}`);

      await page.waitForTimeout(300);
      const setOk = await clickSetButton(page, beatIndex);
      record(`${testLabel} click Set`, setOk ? "PASS" : "FAIL", "Re-applied with custom values");

      if (setOk) {
        await page.waitForTimeout(CONFIG.EFFECT_APPLY_DELAY_MS);
        await verifyEffectJson(
          page,
          effectType,
          beatIndex,
          `${config.label} custom`,
          customZoom,
          customDuration,
          DEFAULT_PAN_DISTANCE,
        );
      }
    }
  }

  // Test 2: moveToLeft with custom zoom, duration, and panDistance
  {
    const effectType: EffectType = "moveToLeft";
    const testLabel = `${effectType} custom (${config.label})`;
    console.log(`\n    --- ${testLabel} ---`);

    const beatIndex = EFFECT_TYPES.indexOf(effectType);
    const applied = await applyEffect(page, effectType, beatIndex, lang, config.label);
    if (applied) {
      await toBeatTab(page);
      await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

      const zoomSet = await setEffectInput(page, IMAGE_EFFECT_SELECTORS.zoomInput, beatIndex, customZoom);
      record(`${testLabel} set zoom`, zoomSet ? "PASS" : "FAIL", `zoom=${customZoom}`);

      const durSet = await setEffectInput(page, IMAGE_EFFECT_SELECTORS.durationInput, beatIndex, customDuration);
      record(`${testLabel} set duration`, durSet ? "PASS" : "FAIL", `duration=${customDuration}`);

      const panSet = await setEffectInput(page, IMAGE_EFFECT_SELECTORS.panDistanceInput, beatIndex, customPanDistance);
      record(`${testLabel} set panDistance`, panSet ? "PASS" : "FAIL", `panDistance=${customPanDistance}`);

      await page.waitForTimeout(300);
      const setOk = await clickSetButton(page, beatIndex);
      record(`${testLabel} click Set`, setOk ? "PASS" : "FAIL", "Re-applied with custom values");

      if (setOk) {
        await page.waitForTimeout(CONFIG.EFFECT_APPLY_DELAY_MS);
        await verifyEffectJson(
          page,
          effectType,
          beatIndex,
          `${config.label} custom`,
          customZoom,
          customDuration,
          customPanDistance,
        );
      }
    }
  }
}

async function generateContentsIfEnabled(page: Page, configLabel: string): Promise<void> {
  if (!SHOULD_RUN_GENERATE) return;
  const testName = `Generate contents (${configLabel})`;
  const generateButton = page.locator('[data-testid="generate-contents-button"]').first();
  if ((await generateButton.count()) === 0) {
    record(testName, "FAIL", "Generate button not found");
    return;
  }

  await generateButton.click();
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  const generatingIndicator = page.locator('[data-testid="generating-indicator"]');
  const timeoutMs = 10 * 60 * 1000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const indicatorVisible =
      (await generatingIndicator.count()) > 0 &&
      (await generatingIndicator
        .first()
        .isVisible()
        .catch(() => false));
    const disabled = await generateButton.isDisabled().catch(() => false);
    if (!indicatorVisible && !disabled) {
      record(testName, "PASS", "Generation completed");
      return;
    }
    await page.waitForTimeout(2000);
  }

  record(testName, "WARN", "Timed out waiting for generation completion");
}

// =====================================================================
// Main
// =====================================================================

(async () => {
  console.log("=".repeat(60));
  console.log("  Image Effect QA Test Suite");
  console.log(`  Run: ${runId} | ${timestamp}`);
  console.log("=".repeat(60));

  try {
    const browser = await connectCDP();
    const page = findAppPage(browser.contexts());
    const monitor = createConsoleMonitor(page);
    monitor.start();

    const lang = await detectLanguage(page);
    console.log(`  Language detected: ${lang}`);

    // Phase 1: Ensure Pro mode (required for JSON tab access)
    console.log("\n--- Phase 1: Setup ---");
    await ensureProMode(page);

    // Phase 2–4: For each canvas/image config, create project + test effects
    for (let configIdx = 0; configIdx < CANVAS_CONFIGS.length; configIdx++) {
      const config = CANVAS_CONFIGS[configIdx];

      console.log("\n" + "=".repeat(60));
      console.log(`  Project ${configIdx + 1}/4: ${config.label}`);
      console.log("=".repeat(60));

      // Phase 2: Navigate to dashboard and create project
      console.log("\n  Phase 2: Create Project");
      await navigateToDashboard(page);
      await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

      const created = await createTestProject(page, config.label);
      if (!created) continue;

      // Phase 3: Upload test image + setup JSON
      console.log("\n  Phase 3: Upload Image & Setup JSON");
      const uploadedPath = await uploadTestImage(page, config.imageKey);
      if (!uploadedPath) {
        record(`Skip project (${config.label})`, "WARN", "Image upload failed, skipping");
        continue;
      }

      const projectTitle = `[QA] ImageEffect ${config.width}x${config.height} ${config.imageKey} ${timestamp}`;
      const projectDescription = `Auto-generated by manual_no_api_image_effect_qa.ts (run ${runId}) – safe to delete`;
      const setupOk = await setupProjectViaJson(
        page,
        projectTitle,
        projectDescription,
        config.width,
        config.height,
        uploadedPath,
      );
      if (!setupOk) {
        record(`Skip project (${config.label})`, "WARN", "JSON setup failed, skipping");
        continue;
      }

      // Phase 4: Apply all 6 effects with default values and verify JSON
      console.log("\n  Phase 4: Apply Effects (defaults) & Verify JSON");
      await testAllEffectsDefaults(page, config, lang);

      // Phase 5: Test custom values (zoom/duration/panDistance) on zoomIn + moveToLeft
      console.log("\n  Phase 5: Custom Values & Verify JSON");
      await testCustomValues(page, config, lang);

      if (SHOULD_RUN_GENERATE) {
        console.log("\n  Phase 5.5: Generate Contents");
      }
      await generateContentsIfEnabled(page, config.label);
    }

    // Phase 6: Console Health
    console.log("\n" + "=".repeat(60));
    console.log("  Phase 6: Console Health Check");
    console.log("=".repeat(60));

    monitor.stop();
    record(
      "Console errors",
      monitor.errors.length === 0 ? "PASS" : "WARN",
      monitor.errors.length === 0 ? "No errors" : `${monitor.errors.length} error(s)`,
    );
    if (monitor.errors.length > 0) {
      monitor.errors.slice(0, 10).forEach((e) => {
        console.log(`    ERROR: ${e.substring(0, 200)}`);
      });
    }
    record("Console warnings", monitor.warnings.length <= 5 ? "PASS" : "WARN", `${monitor.warnings.length} warning(s)`);
  } catch (error) {
    console.error("Fatal error:", error);
    record("Fatal", "FAIL", String(error));
  }

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Results: ${passed} PASS / ${failed} FAIL / ${warned} WARN (${results.length} total)`);
  console.log(`${"=".repeat(60)}`);

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
