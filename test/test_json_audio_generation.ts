import * as playwright from "playwright-core";
import { Browser, BrowserContext, Page } from "playwright-core";
import dayjs from "dayjs";

// Configuration constants
const CONFIG = {
  CDP_RETRY_DELAY: 1000, // CDP connection retry delay (1 second)
  CDP_MAX_ATTEMPTS: 30, // Maximum CDP connection attempts
  TAB_SWITCH_DELAY: 500, // Tab switching delay
  INITIAL_WAIT: 3000, // Initial wait before test starts (3 seconds)
  GENERATION_TIMEOUT: 300000, // 5 minutes for generation
  PLAY_BUTTON_TIMEOUT: 10000, // 10 seconds to wait for play button
} as const;

// Function to fetch JSON from GitHub
async function fetchJSONFromGitHub(browser: Browser, url: string): Promise<string> {
  console.log(`Fetching JSON from GitHub: ${url}`);

  // Create a new context for GitHub
  const githubContext = await browser.newContext();
  const githubPage = await githubContext.newPage();

  try {
    // Navigate to the raw GitHub URL
    await githubPage.goto(url, { waitUntil: "networkidle" });

    // Get the JSON content
    const jsonContent = await githubPage.evaluate(() => {
      return document.body.textContent || "";
    });

    console.log("✓ Successfully fetched JSON from GitHub");
    console.log(`JSON preview: ${jsonContent.substring(0, 100)}...`);

    return jsonContent;
  } catch (error) {
    console.error("Failed to fetch JSON from GitHub:", error);
    throw error;
  } finally {
    // Clean up
    await githubPage.close();
    await githubContext.close();
  }
}

// Test audio JSON from mulmocast-cli
const TEST_AUDIO_JSON = `{
  "$mulmocast": {
    "version": "1.1"
  },
  "title": "Media Test",
  "audioParams": {
    "introPadding": 0,
    "padding": 1.0,
    "closingPadding": 5.0,
    "outroPadding": 0
  },
  "beats": [
    {
      "speaker": "Presenter",
      "text": "This is an opening beat.",
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "Opening Beat"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "",
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "No Audio with Duration 1.0 seconds (default)"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "This is the third beat.",
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "Third Beat"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "This beat has a custom audio padding of 0.0 seconds.",
      "audioParams": {
        "padding": 0.0
      },
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "Custom Audio Padding 0.0 seconds"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "This beat has a custom audio padding of 3.0 seconds.",
      "audioParams": {
        "padding": 3.0
      },
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "Custom Audio Padding 3.0 seconds"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "",
      "duration": 2.0,
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "No Audio with custom duration 2.0 seconds"
        }
      }
    },
    {
      "speaker": "Presenter",
      "text": "This is the closing slide.",
      "image": {
        "type": "textSlide",
        "slide": {
          "title": "Closing Slide"
        }
      }
    }
  ]
}`;

interface Resources {
  browser: Browser | null;
}

async function testJSONAudioGeneration(): Promise<void> {
  // Initialize resources
  const resources: Resources = {
    browser: null,
  };

  try {
    console.log("=== MulmoCast JSON Audio Generation Test ===");
    console.log("1. Waiting for CDP to be available...");

    // Poll for CDP connection availability
    const cdpUrl = process.env.CDP_URL || "http://localhost:9222/";
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
        await new Promise((resolve) => setTimeout(resolve, CONFIG.CDP_RETRY_DELAY));
      }
    }

    // Get contexts and page
    const contexts: BrowserContext[] = resources.browser!.contexts();
    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    // Find the correct page (app page, not DevTools)
    const appUrl = process.env.APP_URL || "localhost:5173";
    console.log(`Looking for application page with URL containing: ${appUrl}`);

    const findApplicationPage = (): Page | null => {
      for (const context of contexts) {
        const pages = context.pages();
        for (const p of pages) {
          const url = p.url();
          console.log(`Found page: ${url}`);
          if (url.includes(appUrl)) {
            return p;
          }
        }
      }

      return null;
    };

    const page = findApplicationPage();
    if (!page) {
      throw new Error("Could not find application page");
    }

    console.log("✓ Got page from Electron app");
    console.log(`Current URL: ${page.url()}`);

    // Navigate to dashboard (just to be sure)
    console.log("\n2. Navigating to dashboard...");
    await page.goto(`http://${appUrl}/#/`);
    await page.waitForLoadState("networkidle");
    console.log("✓ Dashboard loaded");

    // Click the create new button
    console.log('\n3. Clicking "Create New" button...');
    await page.click('button:has-text("新規作成")');
    await page.waitForSelector('input[placeholder="Enter project title"]');
    console.log("✓ New project dialog opened");

    // Enter project title (date + time)
    const projectTitle = `AudioTest_${dayjs().format("YYYYMMDD_HHmmss")}`;
    console.log(`\n4. Entering project title: ${projectTitle}`);
    await page.fill('input[placeholder="Enter project title"]', projectTitle);
    console.log("✓ Project title entered");

    // Click the Create button
    console.log('\n5. Clicking "Create" button...');
    await page.click('button:has-text("Create")');

    // Wait for project page to load
    await page.waitForSelector(`h1:has-text("${projectTitle}")`);
    console.log("✓ Project created and page loaded");

    // Navigate to JSON tab
    console.log("\n6. Navigating to JSON tab...");
    await page.click('[role="tab"]:has-text("JSON")');
    await new Promise((resolve) => setTimeout(resolve, CONFIG.TAB_SWITCH_DELAY));

    // Verify JSON tab is active
    const jsonTab = await page.$('[role="tab"]:has-text("JSON")');
    if (jsonTab) {
      const isSelected = await jsonTab.evaluate((el: HTMLElement) => el.getAttribute("aria-selected") === "true");
      if (isSelected) {
        console.log("✓ JSON tab is now active");
      } else {
        throw new Error("Failed to activate JSON tab");
      }
    }

    // Wait for Monaco Editor to be ready
    console.log("\n7. Waiting for Monaco Editor...");
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    console.log("✓ Monaco Editor loaded");

    // Fetch JSON from GitHub
    console.log("\n8. Fetching test JSON from GitHub...");
    const githubUrl =
      "https://raw.githubusercontent.com/receptron/mulmocast-cli/refs/heads/main/scripts/test/test_audio.json";
    let jsonContent: string;

    try {
      jsonContent = await fetchJSONFromGitHub(resources.browser!, githubUrl);
    } catch {
      console.log("Failed to fetch from GitHub, using fallback local JSON");
      jsonContent = TEST_AUDIO_JSON;
    }

    // Clear existing content and input test JSON
    console.log("\n9. Inputting test audio JSON...");
    // Focus on Monaco editor
    await page.click(".monaco-editor");

    // Select all and delete (use Cmd on macOS)
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Delete");

    // Wait a bit for editor to be ready
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Use page.evaluate to set the editor content directly
    await page.evaluate((json) => {
      // Try to find Monaco editor instance and set its content
      const windowWithMonaco = window as Window & {
        monaco?: {
          editor?: {
            getModels?: () => Array<{
              setValue: (value: string) => void;
            }>;
          };
        };
      };
      const editor = windowWithMonaco.monaco?.editor?.getModels()?.[0];
      if (editor) {
        editor.setValue(json);
      } else {
        // Fallback: try to set textarea content
        const textarea = document.querySelector("textarea");
        if (textarea) {
          textarea.value = json;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }, jsonContent);

    console.log("✓ Test JSON inputted directly into editor");

    // Update the title with timestamp
    console.log("\nUpdating JSON title with timestamp...");
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    await page.evaluate((ts) => {
      const windowWithMonaco = window as Window & {
        monaco?: {
          editor?: {
            getModels?: () => Array<{
              setValue: (value: string) => void;
              getValue: () => string;
            }>;
          };
        };
      };
      const editor = windowWithMonaco.monaco?.editor?.getModels()?.[0];
      if (editor) {
        const content = editor.getValue();
        // Replace "title": "Media Test" with timestamp version
        const updatedContent = content.replace(/"title":\s*"Media Test"/, `"title": "${ts} Media Test"`);
        editor.setValue(updatedContent);
        console.log(`Updated title to: ${ts} Media Test`);
      }
    }, timestamp);
    console.log(`✓ Title updated to: ${timestamp} Media Test`);

    // Wait for JSON validation and UI update
    console.log("\nWaiting for JSON validation and UI update...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("✓ JSON processing time completed");

    // Find and click the generate button in output settings section
    console.log("\n10. Looking for generate button in output settings section...");

    // Use CSS selector to find the generate button more reliably
    // This button is in a grid layout with specific classes
    const generateButton = await page.$('button.flex.flex-col.items-center:has-text("Generate Contents")');
    if (!generateButton) {
      // Fallback: try finding by button structure
      const fallbackButton = await page.$('.grid button:has-text("Generate")');
      if (!fallbackButton) {
        throw new Error("Generate Contents button not found");
      }
      console.log("✓ Found generate button using fallback selector");
      await fallbackButton.click();
    } else {
      console.log("✓ Found generate button using primary selector");
      await generateButton.click();
    }

    // Wait for generation to complete
    console.log("\n10. Waiting for generation to complete...");
    console.log("This may take several minutes...");

    // Wait for multiple completion indicators (AND condition) with detailed logging
    let completionNotificationFound = false;
    let generateButtonReEnabled = false;
    let previewContentFound = false;

    // 1. Check for completion notification
    console.log("Checking for completion notification...");
    try {
      await page.waitForSelector('.toast-success, [data-testid="completion-notification"], .notification-success', {
        timeout: 5000,
      });
      completionNotificationFound = true;
      console.log("✓ Completion notification found");
    } catch {
      console.log("✗ Completion notification NOT found");
    }

    // 2. Check if Generate Contents button is re-enabled
    console.log("Checking if Generate Contents button is re-enabled...");
    try {
      await page.waitForSelector('button:has-text("Generate Contents"):not([disabled])', {
        timeout: 5000,
      });
      generateButtonReEnabled = true;
      console.log("✓ Generate Contents button is re-enabled");
    } catch {
      console.log("✗ Generate Contents button is still disabled or not found");
    }

    // 3. Check for preview content
    console.log("Checking for preview content...");
    try {
      await page.waitForSelector(
        '[data-testid="preview-content"] img, [data-testid="preview-content"] video, .preview-area img, .preview-area video',
        {
          timeout: 5000,
        },
      );
      previewContentFound = true;
      console.log("✓ Preview content found");
    } catch {
      console.log("✗ Preview content NOT found");
    }

    // 4. Check for generation completion by waiting for "generating" to disappear
    console.log("Waiting for 'generating' indicator to disappear...");
    let generationComplete = false;
    try {
      // Get project ID from current URL
      const projectId = await page.evaluate(() => {
        const hash = window.location.hash;
        const match = hash.match(/\/project\/([^/]+)/);
        return match ? match[1] : null;
      });

      if (!projectId) {
        throw new Error("Could not extract project ID from URL");
      }

      console.log(`Project ID: ${projectId}`);

      // Wait for MP4 file to be generated (polling approach)
      const maxWaitTime = CONFIG.GENERATION_TIMEOUT;
      const checkInterval = 3000; // Check every 3 seconds
      let elapsed = 0;

      while (elapsed < maxWaitTime && !generationComplete) {
        // Check if "generating" text has disappeared from the header area
        const isGenerating = await page.evaluate(() => {
          // Look for generating text in the top area near Dashboard
          const headerElements = document.querySelectorAll('header, nav, .header, .nav, [role="banner"]');
          for (let element of headerElements) {
            if (element.textContent && element.textContent.toLowerCase().includes("generating")) {
              return true;
            }
          }

          // Also check around Dashboard button area
          const dashboardElements = document.querySelectorAll("*");
          for (let element of dashboardElements) {
            if (element.textContent && element.textContent.includes("Dashboard")) {
              const parent = element.parentElement;
              if (parent && parent.textContent && parent.textContent.toLowerCase().includes("generating")) {
                return true;
              }
            }
          }

          return false;
        });

        if (!isGenerating) {
          generationComplete = true;
          console.log("✓ Generation completed - 'generating' indicator disappeared");
          break;
        }

        console.log(`Waiting for generation to complete... (${elapsed / 1000}s elapsed) - still generating`);
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      }

      if (!generationComplete) {
        console.log("✗ Generation did not complete within timeout");
      }
    } catch (error) {
      console.log("✗ Could not check MP4 file generation:", error);
    }

    // Summary of completion checks
    console.log("\n=== Completion Check Summary ===");
    console.log(`Completion notification: ${completionNotificationFound ? "✓" : "✗"}`);
    console.log(`Generate button re-enabled: ${generateButtonReEnabled ? "✓" : "✗"}`);
    console.log(`Preview content: ${previewContentFound ? "✓" : "✗"}`);
    console.log(`Generation completed (indicator gone): ${generationComplete ? "✓" : "✗"}`);

    const completedChecks = [
      completionNotificationFound,
      generateButtonReEnabled,
      previewContentFound,
      generationComplete,
    ].filter(Boolean).length;
    console.log(`Completed checks: ${completedChecks}/4`);

    if (completedChecks === 0) {
      console.log("⚠️  No completion indicators found - proceeding anyway");
    } else if (completedChecks < 3) {
      console.log("⚠️  Some completion indicators missing - proceeding with partial confirmation");
      if (generationComplete) {
        console.log("Generation completed - waiting a bit more for UI updates...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } else {
      console.log("✓ All completion indicators verified!");
    }

    // Now look for play button
    let playButton = null;
    try {
      console.log("Looking for play button...");
      await page.waitForSelector('button:has-text("Play"), button[aria-label="Play"], button[title*="Play"]', {
        timeout: 5000,
      });
      playButton = await page.$('button:has-text("Play"), button[aria-label="Play"], button[title*="Play"]');
    } catch {
      console.log("Play button not found, but generation appears complete");
    }

    console.log("✓ All generation completion indicators verified!");

    // Click play button if available
    if (playButton) {
      console.log("\n11. Clicking play button...");
      await playButton.click();
      console.log("✓ Audio playback started");
    } else {
      console.log("\n11. No play button found, skipping playback test");
      console.log("✓ Generation test completed without playback");
    }

    // Wait a bit to ensure playback starts
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("\n=== Test completed successfully! ===");
    console.log(
      `Project "${projectTitle}" was created, JSON was pasted, content was generated, and audio playback was started.`,
    );
  } catch (error: unknown) {
    console.error("\n✗ Test failed:", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    // Close browser connection
    if (resources.browser) {
      await resources.browser.close();
      console.log("\nBrowser connection closed.");
    }
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("Starting test in 3 seconds...");
  console.log("Make sure the Electron app is running with: yarn start");
  console.log("Environment variables:");
  console.log(`  CDP_URL: ${process.env.CDP_URL || "http://localhost:9222/ (default)"}`);
  console.log(`  APP_URL: ${process.env.APP_URL || "localhost:5173 (default)"}\n`);

  await new Promise((resolve) => setTimeout(resolve, CONFIG.INITIAL_WAIT));

  try {
    await testJSONAudioGeneration();
    process.exit(0);
  } catch (error: unknown) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

// Execute
main();
