import playwright, { Browser, BrowserContext, Page } from "playwright-core";

// Configuration constants
const CONFIG = {
  CDP_RETRY_DELAY_MS: 1000, // CDP connection retry delay (1 second)
  CDP_MAX_ATTEMPTS: 30, // Maximum CDP connection attempts
  TAB_SWITCH_DELAY_MS: 500, // Tab switching delay
  INITIAL_WAIT_MS: 3000, // Initial wait before test starts (3 seconds)
} as const;

interface Resources {
  browser: Browser | null;
}

async function testChangeLanguage(targetLanguage: "en" | "ja"): Promise<void> {
  // Initialize resources
  const resources: Resources = {
    browser: null,
  };

  try {
    console.log("=== MulmoCast Language Change Test ===");
    console.log(`Target language: ${targetLanguage}`);
    console.log("1. Waiting for CDP to be available...");

    // Poll for CDP connection availability
    const cdpUrl = process.env.CDP_URL || "http://127.0.0.1:9222/";
    let attempts = 0;

    while (attempts < CONFIG.CDP_MAX_ATTEMPTS) {
      try {
        resources.browser = await playwright.chromium.connectOverCDP(cdpUrl);
        console.log("✓ Connected successfully via CDP");
        break;
      } catch (error: unknown) {
        attempts++;
        if (attempts === CONFIG.CDP_MAX_ATTEMPTS) {
          throw new Error(
            `Failed to connect to CDP after ${CONFIG.CDP_MAX_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        if (attempts === 1) {
          console.log(`Attempting to connect to ${cdpUrl} (max ${CONFIG.CDP_MAX_ATTEMPTS} attempts)...`);
        }
        await new Promise((resolve) => setTimeout(resolve, CONFIG.CDP_RETRY_DELAY_MS));
      }
    }

    // Get contexts and page
    const contexts: BrowserContext[] = resources.browser!.contexts();
    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    const appUrl = process.env.APP_URL || "localhost:5173";
    const findApplicationPage = (): Page | null => {
      for (const context of contexts) {
        const page = context.pages().find((p) => {
          const url = p.url();
          console.log(`Found page: ${url}`);
          return url.includes(appUrl);
        });
        if (page) return page;
      }
      return null;
    };

    const page = findApplicationPage();
    if (!page) {
      throw new Error("Could not find application page");
    }

    console.log("✓ Got page from Electron app");
    console.log(`Current URL: ${page.url()}`);

    // Store current URL to return later
    const originalUrl = page.url();
    console.log(`\n2. Storing current page URL: ${originalUrl}`);

    // Open menu and navigate to Settings
    console.log("\n3. Opening menu (hamburger button)...");
    // Use data-testid for the hamburger menu button
    await page.click('[data-testid="menu-button"]');
    await page.waitForSelector('[role="menu"]', { state: "visible" });
    console.log("✓ Menu opened");

    // Click Settings using data-testid
    console.log("\n4. Clicking Settings menu item...");
    await page.click('[data-testid="menu-item-settings"]');
    await page.waitForURL("**/settings");
    console.log("✓ Navigated to Settings page");

    // Wait for Settings page to load
    await page.waitForSelector('[data-testid="language-select"]', { state: "visible" });
    console.log("✓ Settings page loaded");

    // Change language
    console.log(`\n5. Changing language to ${targetLanguage}...`);

    // Click the language dropdown using data-testid
    await page.click('[data-testid="language-select"]');
    await page.waitForSelector('[role="listbox"]', { state: "visible" });
    console.log("✓ Language dropdown opened");

    // Select the target language using data-testid
    await page.click(`[data-testid="language-option-${targetLanguage}"]`);
    console.log(`✓ Selected language: ${targetLanguage}`);

    // Wait a bit for the language change to take effect
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify language change by checking if the UI text has changed
    console.log("\n6. Verifying language change...");

    // Check the title text based on selected language
    const expectedTitle = targetLanguage === "ja" ? "設定" : "Settings";
    const titleElement = await page.waitForSelector(`h1:has-text("${expectedTitle}")`, { timeout: 5000 });

    if (titleElement) {
      console.log(`✓ Language successfully changed to ${targetLanguage}`);
    } else {
      console.log("⚠ Could not verify language change");
    }

    // Navigate back to original page
    console.log("\n7. Returning to original page...");
    await page.goto(originalUrl);
    await page.waitForLoadState("networkidle");
    console.log(`✓ Returned to: ${originalUrl}`);

    // Verify we're back on the original page
    const currentUrl = page.url();
    if (currentUrl === originalUrl) {
      console.log("✓ Successfully returned to original page");
    } else {
      console.log(`⚠ URL mismatch - Expected: ${originalUrl}, Got: ${currentUrl}`);
    }

    console.log("\n=== Test completed successfully ===");
  } catch (error: unknown) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    // Cleanup
    if (resources.browser) {
      console.log("\nDisconnecting from browser...");
      // Note: We don't close the browser since we're connecting to an existing instance
      await resources.browser.close().catch(() => {
        // Ignore close errors for CDP connection
      });
    }
  }
}

// Main execution
(async () => {
  // Get language from command line argument
  const targetLanguage = process.argv[2] as "en" | "ja";

  if (!targetLanguage || !["en", "ja"].includes(targetLanguage)) {
    console.error("Usage: npm run test:change-language <en|ja>");
    console.error("Example: npm run test:change-language ja");
    process.exit(1);
  }

  try {
    await testChangeLanguage(targetLanguage);
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
})();
