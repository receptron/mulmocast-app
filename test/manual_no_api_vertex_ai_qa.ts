/**
 * Vertex AI Support QA Test Suite
 *
 * Manual test script to verify Vertex AI integration in the MulmoCast app.
 * Connects to a running Electron app via CDP and validates:
 *   - Settings page: Vertex AI section expand/collapse, project & location input
 *   - Image Params: provider switch → Vertex AI toggle visibility
 *   - Image Params: toggle ON → Settings default values pre-filled
 *   - Image Params: toggle OFF → vertexai fields removed
 *   - Movie Params: same toggle behavior as Image Params
 *   - JSON Editor: vertexai_project / vertexai_location reflected in script
 *
 * Usage:
 *   1. Start the app: yarn start
 *   2. Run: npx tsx test/manual_no_api_vertex_ai_qa.ts
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
  SETTINGS_SAVE_DELAY_MS: 2000,
  PROJECT_CREATE_DELAY_MS: 3000,
} as const;

const TEST_PROJECT_ID = "qa-vertex-test-project";
const TEST_LOCATION = "asia-northeast1";
const JSON_EDIT_PROJECT_ID = "json-edited-project";
const JSON_EDIT_LOCATION = "europe-west1";

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

async function getComboboxTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selects = document.querySelectorAll('[role="combobox"]');
    return Array.from(selects).map((s) => s.textContent?.trim() || "");
  });
}

/**
 * Find the global index of the first combobox inside the card that contains the given h4 heading.
 */
async function findComboboxIndexInSection(page: Page, heading: string): Promise<number> {
  return page.evaluate((h) => {
    const h4s = document.querySelectorAll("h4");
    for (const h4 of h4s) {
      if (h4.textContent?.trim() === h) {
        // Walk up to find the Card container
        const card = h4.closest(".p-4, [class*='card']") || h4.parentElement?.parentElement;
        if (!card) continue;
        // Find first combobox inside this card
        const combo = card.querySelector('[role="combobox"]');
        if (!combo) continue;
        // Find its global index
        const allCombos = document.querySelectorAll('[role="combobox"]');
        for (let i = 0; i < allCombos.length; i++) {
          if (allCombos[i] === combo) return i;
        }
      }
    }
    return -1;
  }, heading);
}

async function clickComboboxByIndex(page: Page, index: number): Promise<void> {
  await page.locator('[role="combobox"]').nth(index).click({ force: true });
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
}

async function selectOption(page: Page, optionText: string): Promise<boolean> {
  // Wait for dropdown to appear
  await page.waitForTimeout(300);
  const option = page.locator('[role="option"]').filter({ hasText: new RegExp(`^${optionText}$`) });
  const count = await option.count();
  if (count > 0) {
    await option.first().click({ force: true });
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
    return true;
  }
  // Close dropdown if option not found
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  return false;
}

async function getSwitchStates(page: Page): Promise<Array<{ label: string; checked: boolean }>> {
  return page.evaluate(() => {
    const switches = document.querySelectorAll('[role="switch"]');
    return Array.from(switches).map((s) => {
      const label = s.closest("div")?.querySelector("label")?.textContent || "";
      return { label, checked: s.getAttribute("data-state") === "checked" };
    });
  });
}

async function clickSwitchByLabel(page: Page, label: string): Promise<boolean> {
  const clicked = await page.evaluate((lbl) => {
    const switches = document.querySelectorAll('[role="switch"]');
    for (const sw of switches) {
      const parentLabel = sw.closest("div")?.querySelector("label")?.textContent || "";
      if (parentLabel.includes(lbl)) {
        (sw as HTMLElement).click();
        return true;
      }
    }
    return false;
  }, label);
  if (clicked) {
    await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  }
  return clicked;
}

async function getInputValues(page: Page): Promise<Array<{ placeholder: string; value: string }>> {
  return page.evaluate(() => {
    const inputs = document.querySelectorAll("input[type='text'], input:not([type])");
    return Array.from(inputs).map((input) => ({
      placeholder: (input as HTMLInputElement).getAttribute("placeholder") || "",
      value: (input as HTMLInputElement).value || "",
    }));
  });
}

async function setInputByPlaceholder(page: Page, placeholder: string, value: string): Promise<boolean> {
  return page.evaluate(
    ({ ph, val }) => {
      const inputs = document.querySelectorAll("input");
      for (const input of inputs) {
        if (input.getAttribute("placeholder") === ph) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          if (setter) {
            setter.call(input, val);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }
        }
      }
      return false;
    },
    { ph: placeholder, val: value },
  );
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
  await page.waitForTimeout(1000);
  return true;
}

// --- Test Cases ---

async function testSettingsVertexAI(page: Page) {
  console.log("\n=== 1. Settings - Vertex AI Section ===");

  // Open settings modal
  const settingsBtn = await page.$('[data-testid="settings-button"]');
  if (!settingsBtn) {
    record("Settings button", "FAIL", "Settings button not found");
    return;
  }

  await settingsBtn.click();
  await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

  // Check settings modal opened
  const langSelect = await page.$('[data-testid="language-select"]');
  record("Settings modal opened", langSelect ? "PASS" : "FAIL", langSelect ? "Found" : "Not found");

  // Check Vertex AI section exists (collapsed)
  const vertexAIExists = await page.evaluate(() => {
    const buttons = document.querySelectorAll("button");
    return Array.from(buttons).some((b) => b.textContent?.includes("Vertex AI"));
  });
  record("Vertex AI section exists", vertexAIExists ? "PASS" : "FAIL", vertexAIExists ? "Found in settings" : "Not found");

  if (!vertexAIExists) return;

  // Expand Vertex AI section
  await page.evaluate(() => {
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      if (btn.textContent?.includes("Vertex AI")) {
        btn.click();
        return;
      }
    }
  });
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Check input fields appeared
  const inputs = await getInputValues(page);
  const projectInput = inputs.find((i) => i.placeholder === "your-gcp-project-id");
  const locationInput = inputs.find((i) => i.placeholder === "us-central1");

  record(
    "Project ID field",
    projectInput ? "PASS" : "FAIL",
    projectInput ? `placeholder="${projectInput.placeholder}"` : "Not found",
  );
  record(
    "Location field",
    locationInput ? "PASS" : "FAIL",
    locationInput ? `placeholder="${locationInput.placeholder}"` : "Not found",
  );

  // Set test values
  const setProject = await setInputByPlaceholder(page, "your-gcp-project-id", TEST_PROJECT_ID);
  const setLocation = await setInputByPlaceholder(page, "us-central1", TEST_LOCATION);
  record("Set project ID", setProject ? "PASS" : "FAIL", setProject ? TEST_PROJECT_ID : "Failed to set");
  record("Set location", setLocation ? "PASS" : "FAIL", setLocation ? TEST_LOCATION : "Failed to set");

  // Wait for debounced save
  await page.waitForTimeout(CONFIG.SETTINGS_SAVE_DELAY_MS);

  // Close settings modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
}

async function testImageParamsVertexAI(page: Page) {
  console.log("\n=== 2. Image Params - Vertex AI Toggle ===");

  // Navigate to style tab
  const styleTabClicked = await clickTabByText(page, "スタイル");
  if (!styleTabClicked) {
    // Try English
    const clicked = await clickTabByText(page, "Style");
    if (!clicked) {
      record("Style tab", "FAIL", "Could not find Style tab");
      return;
    }
  }

  // Scroll to image params section
  const scrolled = (await scrollToH4(page, "画像生成設定")) || (await scrollToH4(page, "Image Parameters"));
  record("Scroll to Image Params", scrolled ? "PASS" : "FAIL", scrolled ? "Found section" : "Section not found");
  if (!scrolled) return;

  // Get image provider combobox index (first combobox in 画像生成設定 section)
  const imageProviderIndex = await findComboboxIndexInSection(page, "画像生成設定");
  if (imageProviderIndex < 0) {
    // Try English
    const idx = await findComboboxIndexInSection(page, "Image Parameters");
    if (idx < 0) {
      record("Image provider combobox", "FAIL", "Could not find provider combobox in image section");
      return;
    }
  }

  const comboTexts = await getComboboxTexts(page);
  const currentProvider = imageProviderIndex >= 0 ? comboTexts[imageProviderIndex] : "";

  // Step 1: Verify Vertex AI toggle NOT visible when provider is NOT Google
  if (currentProvider && currentProvider !== "Google") {
    const switchesBefore = await getSwitchStates(page);
    const vertexToggleBefore = switchesBefore.find((s) => s.label.includes("Vertex AI"));
    record(
      "Vertex AI hidden (non-Google)",
      !vertexToggleBefore ? "PASS" : "FAIL",
      !vertexToggleBefore ? `Provider is "${currentProvider}", no toggle` : "Toggle unexpectedly visible",
    );
  }

  // Step 2: Switch provider to Google
  if (imageProviderIndex >= 0) {
    await clickComboboxByIndex(page, imageProviderIndex);
    const selected = await selectOption(page, "Google");
    record("Switch to Google provider", selected ? "PASS" : "FAIL", selected ? "Selected Google" : "Could not select");
    if (!selected) return;
  }

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  await scrollToH4(page, "画像生成設定") || (await scrollToH4(page, "Image Parameters"));

  // Step 3: Verify Vertex AI toggle IS visible
  const switchesAfter = await getSwitchStates(page);
  const vertexToggle = switchesAfter.find((s) => s.label.includes("Vertex AI"));
  record(
    "Vertex AI toggle visible (Google)",
    vertexToggle ? "PASS" : "FAIL",
    vertexToggle ? `Found, checked=${vertexToggle.checked}` : "Toggle not found with Google provider",
  );
  if (!vertexToggle) return;

  // Step 4: Verify toggle is OFF by default
  record(
    "Vertex AI toggle default OFF",
    !vertexToggle.checked ? "PASS" : "WARN",
    !vertexToggle.checked ? "Default is OFF" : "Toggle was already ON",
  );

  // Step 5: Toggle ON - check Settings defaults are pre-filled
  const toggledOn = await clickSwitchByLabel(page, "Vertex AI");
  record("Toggle Vertex AI ON", toggledOn ? "PASS" : "FAIL", toggledOn ? "Clicked" : "Could not click");
  if (!toggledOn) return;

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Check pre-filled values
  const inputsAfterToggle = await getInputValues(page);
  const projectField = inputsAfterToggle.find((i) => i.placeholder === "your-gcp-project-id");
  const locationField = inputsAfterToggle.find((i) => i.placeholder === "us-central1");

  record(
    "Project ID pre-filled from Settings",
    projectField?.value === TEST_PROJECT_ID ? "PASS" : "WARN",
    `Expected "${TEST_PROJECT_ID}", got "${projectField?.value || "(not found)"}"`,
  );
  record(
    "Location pre-filled from Settings",
    locationField?.value === TEST_LOCATION ? "PASS" : "WARN",
    `Expected "${TEST_LOCATION}", got "${locationField?.value || "(not found)"}"`,
  );

  // Step 6: Toggle OFF - fields should disappear
  const toggledOff = await clickSwitchByLabel(page, "Vertex AI");
  record("Toggle Vertex AI OFF", toggledOff ? "PASS" : "FAIL", toggledOff ? "Clicked" : "Could not click");

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  const inputsAfterOff = await getInputValues(page);
  const projectFieldGone = !inputsAfterOff.find(
    (i) => i.placeholder === "your-gcp-project-id" && i.value === TEST_PROJECT_ID,
  );
  record(
    "Vertex AI fields removed after OFF",
    projectFieldGone ? "PASS" : "FAIL",
    projectFieldGone ? "Fields removed" : "Fields still present",
  );

  // Step 7: Toggle back ON for JSON verification
  await clickSwitchByLabel(page, "Vertex AI");
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
}

async function testMovieParamsVertexAI(page: Page) {
  console.log("\n=== 3. Movie Params - Vertex AI Toggle ===");

  // Scroll to movie params section
  const scrolled = (await scrollToH4(page, "動画生成設定")) || (await scrollToH4(page, "Movie Parameters"));
  record("Scroll to Movie Params", scrolled ? "PASS" : "FAIL", scrolled ? "Found section" : "Section not found");
  if (!scrolled) return;

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Find movie provider combobox (first combobox in 動画生成設定 section)
  let movieProviderIndex = await findComboboxIndexInSection(page, "動画生成設定");
  if (movieProviderIndex < 0) {
    movieProviderIndex = await findComboboxIndexInSection(page, "Movie Parameters");
  }

  if (movieProviderIndex < 0) {
    record("Movie provider combobox", "WARN", "Could not find provider combobox in movie section");
    return;
  }

  const comboTexts = await getComboboxTexts(page);
  const movieCurrentProvider = comboTexts[movieProviderIndex] || "";

  if (movieCurrentProvider === "Google") {
    record("Movie provider", "PASS", "Already Google");
  } else {
    await clickComboboxByIndex(page, movieProviderIndex);
    const selected = await selectOption(page, "Google");
    record(
      "Movie: Switch to Google provider",
      selected ? "PASS" : "FAIL",
      selected ? "Selected Google" : "Could not select",
    );
    if (!selected) return;
  }

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);
  await scrollToH4(page, "動画生成設定") || (await scrollToH4(page, "Movie Parameters"));

  // Check Vertex AI toggle visible
  const switches = await getSwitchStates(page);
  // There should be at least 2 Vertex AI switches now (image + movie)
  const vertexSwitches = switches.filter((s) => s.label.includes("Vertex AI"));
  record(
    "Movie: Vertex AI toggle visible",
    vertexSwitches.length >= 2 ? "PASS" : "WARN",
    `Found ${vertexSwitches.length} Vertex AI toggle(s)`,
  );

  // Toggle ON the second (movie) Vertex AI switch
  const movieSwitchClicked = await page.evaluate(() => {
    const switches = document.querySelectorAll('[role="switch"]');
    let count = 0;
    for (const sw of switches) {
      const label = sw.closest("div")?.querySelector("label")?.textContent || "";
      if (label.includes("Vertex AI")) {
        count++;
        if (count === 2) {
          (sw as HTMLElement).click();
          return true;
        }
      }
    }
    return false;
  });
  record(
    "Movie: Toggle Vertex AI ON",
    movieSwitchClicked ? "PASS" : "WARN",
    movieSwitchClicked ? "Toggled movie Vertex AI" : "Could not find second Vertex AI switch",
  );

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Verify pre-filled values for movie section
  const movieInputs = await getInputValues(page);
  const movieProjectFields = movieInputs.filter((i) => i.placeholder === "your-gcp-project-id");
  const hasMovieProject = movieProjectFields.some((f) => f.value === TEST_PROJECT_ID);
  record(
    "Movie: Project ID pre-filled",
    hasMovieProject ? "PASS" : "WARN",
    hasMovieProject
      ? `Found "${TEST_PROJECT_ID}"`
      : `Values: ${movieProjectFields.map((f) => f.value).join(", ") || "(none)"}`,
  );
}

async function testJsonReflection(page: Page) {
  console.log("\n=== 4. JSON Editor - UI → JSON ===");

  // Switch to JSON tab
  const jsonClicked = await clickTabByText(page, "JSON");
  record("Switch to JSON tab", jsonClicked ? "PASS" : "FAIL", jsonClicked ? "Clicked" : "Tab not found");
  if (!jsonClicked) return;

  await page.waitForTimeout(CONFIG.EDITOR_LOAD_DELAY_MS);

  // Read JSON from editor
  const json = await readEditorJson(page);
  if (!json) {
    record("Read JSON", "FAIL", "Could not read/parse editor content");
    return;
  }
  record("Read JSON", "PASS", "Successfully parsed editor content");

  // Check imageParams - may be at top level or under presentationStyle
  const presentationStyle = json.presentationStyle as Record<string, unknown> | undefined;
  const imageParams = (presentationStyle?.imageParams || json.imageParams) as Record<string, unknown> | undefined;

  record(
    "JSON: imageParams.provider",
    imageParams?.provider === "google" ? "PASS" : "FAIL",
    `provider="${imageParams?.provider}"`,
  );
  record(
    "JSON: imageParams.vertexai_project",
    imageParams?.vertexai_project === TEST_PROJECT_ID ? "PASS" : "FAIL",
    `vertexai_project="${imageParams?.vertexai_project}"`,
  );
  record(
    "JSON: imageParams.vertexai_location",
    imageParams?.vertexai_location === TEST_LOCATION ? "PASS" : "FAIL",
    `vertexai_location="${imageParams?.vertexai_location}"`,
  );

  // Check movieParams - may be at top level or under presentationStyle
  const movieParams = (presentationStyle?.movieParams || json.movieParams) as Record<string, unknown> | undefined;
  record(
    "JSON: movieParams.provider",
    movieParams?.provider === "google" ? "PASS" : "WARN",
    `provider="${movieParams?.provider}"`,
  );
  record(
    "JSON: movieParams.vertexai_project",
    movieParams?.vertexai_project === TEST_PROJECT_ID ? "PASS" : "WARN",
    `vertexai_project="${movieParams?.vertexai_project}"`,
  );
  record(
    "JSON: movieParams.vertexai_location",
    movieParams?.vertexai_location === TEST_LOCATION ? "PASS" : "WARN",
    `vertexai_location="${movieParams?.vertexai_location}"`,
  );
}

async function testJsonToUI(page: Page) {
  console.log("\n=== 5. JSON → UI Reflection ===");

  // We should be on the JSON tab from the previous test.
  // Read current JSON
  const json = await readEditorJson(page);
  if (!json) {
    record("Read JSON for edit", "FAIL", "Could not read editor content");
    return;
  }

  // Modify imageParams via JSON: set different vertexai values
  const imageParams = (json.imageParams || {}) as Record<string, unknown>;
  imageParams.provider = "google";
  imageParams.vertexai_project = JSON_EDIT_PROJECT_ID;
  imageParams.vertexai_location = JSON_EDIT_LOCATION;
  json.imageParams = imageParams;

  // Write modified JSON back to editor
  const written = await writeEditorJson(page, json);
  record("Write modified JSON", written ? "PASS" : "FAIL", written ? "JSON written to editor" : "Failed to write");
  if (!written) return;

  // Switch to Style tab
  const styleClicked = (await clickTabByText(page, "スタイル")) || (await clickTabByText(page, "Style"));
  record("Switch to Style tab", styleClicked ? "PASS" : "FAIL", styleClicked ? "Clicked" : "Tab not found");
  if (!styleClicked) return;

  // Scroll to Image Params
  await scrollToH4(page, "画像生成設定") || (await scrollToH4(page, "Image Parameters"));
  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Check provider is Google
  let imgProvIdx = await findComboboxIndexInSection(page, "画像生成設定");
  if (imgProvIdx < 0) imgProvIdx = await findComboboxIndexInSection(page, "Image Parameters");
  const comboTexts = await getComboboxTexts(page);
  const providerText = imgProvIdx >= 0 ? comboTexts[imgProvIdx] : "";
  record(
    "JSON→UI: Provider is Google",
    providerText === "Google" ? "PASS" : "FAIL",
    `Provider="${providerText}"`,
  );

  // Check Vertex AI toggle is ON
  const switches = await getSwitchStates(page);
  const vertexToggle = switches.find((s) => s.label.includes("Vertex AI"));
  record(
    "JSON→UI: Vertex AI toggle ON",
    vertexToggle?.checked ? "PASS" : "FAIL",
    vertexToggle ? `checked=${vertexToggle.checked}` : "Toggle not found",
  );

  // Check project ID and location fields have the JSON-edited values
  const inputs = await getInputValues(page);
  const projectField = inputs.find((i) => i.placeholder === "your-gcp-project-id");
  const locationField = inputs.find((i) => i.placeholder === "us-central1");

  record(
    "JSON→UI: Project ID reflected",
    projectField?.value === JSON_EDIT_PROJECT_ID ? "PASS" : "FAIL",
    `Expected "${JSON_EDIT_PROJECT_ID}", got "${projectField?.value || "(not found)"}"`,
  );
  record(
    "JSON→UI: Location reflected",
    locationField?.value === JSON_EDIT_LOCATION ? "PASS" : "FAIL",
    `Expected "${JSON_EDIT_LOCATION}", got "${locationField?.value || "(not found)"}"`,
  );
}

async function testProviderSwitchHidesToggle(page: Page) {
  console.log("\n=== 6. Provider Switch Hides Toggle ===");

  // Switch back to Style tab
  const styleClicked = (await clickTabByText(page, "スタイル")) || (await clickTabByText(page, "Style"));
  if (!styleClicked) {
    record("Switch to Style tab", "FAIL", "Tab not found");
    return;
  }

  await scrollToH4(page, "画像生成設定") || (await scrollToH4(page, "Image Parameters"));

  // Change image provider away from Google (back to OpenAI)
  let imgProvIdx = await findComboboxIndexInSection(page, "画像生成設定");
  if (imgProvIdx < 0) imgProvIdx = await findComboboxIndexInSection(page, "Image Parameters");
  if (imgProvIdx >= 0) {
    await clickComboboxByIndex(page, imgProvIdx);
    const selected = await selectOption(page, "OpenAI");
    record(
      "Switch back to OpenAI",
      selected ? "PASS" : "FAIL",
      selected ? "Selected OpenAI" : "Could not select OpenAI",
    );
    if (!selected) return;
  }

  await page.waitForTimeout(CONFIG.ACTION_DELAY_MS);

  // Verify Vertex AI toggle is hidden for image params
  await scrollToH4(page, "画像生成設定") || (await scrollToH4(page, "Image Parameters"));
  const switches = await getSwitchStates(page);
  // Should have at most 1 Vertex AI toggle (movie, if still Google) or 0
  const imageVertexToggle = switches.find((s) => s.label.includes("Vertex AI"));
  // The first Vertex AI toggle should be gone (image section), but movie might still have one
  record(
    "Vertex AI toggle hidden (OpenAI)",
    // If there are 0 or 1 Vertex AI toggles, the image one is hidden
    switches.filter((s) => s.label.includes("Vertex AI")).length <= 1 ? "PASS" : "FAIL",
    `${switches.filter((s) => s.label.includes("Vertex AI")).length} Vertex AI toggle(s) remaining`,
  );
}

async function testConsoleHealth(monitor: ConsoleMonitor) {
  console.log("\n=== 7. Console Health ===");
  record("Console errors", monitor.errors.length === 0 ? "PASS" : "WARN", `${monitor.errors.length} error(s) total`);
  if (monitor.errors.length > 0) {
    console.log(`    Errors: ${monitor.errors.slice(0, 5).join("; ")}`);
  }
}

// --- Main ---

(async () => {
  console.log("========================================");
  console.log("  Vertex AI Support QA Test Suite");
  console.log("========================================\n");

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

    // Navigate to home first
    await page.goto(page.url().split("#")[0] + "#/");
    await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);

    // --- Test 1: Settings ---
    await testSettingsVertexAI(page);

    // --- Create/navigate to a project for style tests ---
    console.log("\n--- Setting up test project ---");
    const newBtn = await page.$('[data-testid="create-new-button"]');
    if (newBtn) {
      await newBtn.click();
      await page.waitForTimeout(CONFIG.PROJECT_CREATE_DELAY_MS);
      const url = page.url();
      record("Test project", url.includes("#/project/") ? "PASS" : "FAIL", `URL: ${url}`);
    } else {
      // Navigate to first project
      const firstProject = await page.$('a[href*="project"]');
      if (firstProject) {
        await firstProject.click();
        await page.waitForTimeout(CONFIG.NAVIGATION_DELAY_MS);
      }
    }

    // --- Test 2: Image Params ---
    await testImageParamsVertexAI(page);

    // --- Test 3: Movie Params ---
    await testMovieParamsVertexAI(page);

    // --- Test 4: JSON Reflection (UI → JSON) ---
    await testJsonReflection(page);

    // --- Test 5: JSON → UI Reflection ---
    await testJsonToUI(page);

    // --- Test 6: Provider Switch Hides Toggle ---
    await testProviderSwitchHidesToggle(page);

    // --- Test 7: Console Health ---
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
