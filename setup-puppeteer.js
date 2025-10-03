/* eslint-disable @typescript-eslint/no-var-requires */
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

// This script is executed before the main process starts, using the --require flag.
// It ensures that the Puppeteer executable path is set before any other module
// can import and initialize Puppeteer.

if (process.env.NODE_ENV !== "development") {
  console.log(`[PUPPETEER_SETUP] Configuring Puppeteer path for production environment.`);

  try {
    const packageJSON = require("../package.json");
    console.log(`[PUPPETEER_SETUP] Loaded package.json config:`, packageJSON.config);

    // This prevents Puppeteer from trying to find a browser in a default location.
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
    console.log(`[PUPPETEER_SETUP] Set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD to 'true'`);

    // Get the required Chromium version from our own package.json config.
    const chromeVersion = packageJSON.config.chromiumVersion;
    console.log(`[PUPPETEER_SETUP] Using configured Chrome version: ${chromeVersion}`);

    // Construct the path to the bundled Chromium executable.
    const platform = os.platform() === "win32" ? "win64" : "mac-arm64";
    console.log(`[PUPPETEER_SETUP] Detected platform: ${platform}`);
    const subDir = os.platform() === "win32" ? "chrome-win64" : "chrome-mac-arm64";
    console.log(`[PUPPETEER_SETUP] Using sub-directory: ${subDir}`);
    const executableName = os.platform() === "win32" ? "chrome.exe" : "chrome";
    console.log(`[PUPPETEER_SETUP] Using executable name: ${executableName}`);

    const finalPath = path.join(
      process.resourcesPath,
      "chromium",
      "chrome",
      `${platform}-${chromeVersion}`,
      subDir,
      executableName,
    );
    console.log(`[PUPPETEER_SETUP] Constructed final path: ${finalPath}`);

    if (fs.existsSync(finalPath)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = finalPath;
      console.log(`[PUPPETEER_SETUP] Overriding executable path globally to: ${finalPath}`);
    } else {
      console.error(`[PUPPETEER_SETUP_ERROR] Bundled Chromium not found at: ${finalPath}`);
    }
  } catch (error) {
    console.error("[PUPPETEER_SETUP_ERROR] Failed to configure Puppeteer path:", error);
  }
}
