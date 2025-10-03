import { app, BrowserWindow, ipcMain, shell, Menu } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import started from "electron-squirrel-startup";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import log from "electron-log/main";

import { ENV_KEYS } from "../shared/constants";
import { resolveTargetFromVersion } from "../shared/version";
import { getWindowState, saveWindowState } from "./utils/windw_state";
import config from "../renderer/i18n/index";

import { menu } from "./menu";
import { makeUserNotifier } from "./update";

import packageJSON from "../../package.json" with { type: "json" };

log.initialize();

// --- Puppeteer Path Resolution ---
// This must be done BEFORE any other modules that might import puppeteer are loaded.
(() => {
  // In development, we don't need to do anything.
  if (process.env.NODE_ENV === "development") {
    console.log(`[PUPPETEER_DEBUG] Development environment detected. Skipping Puppeteer path override.`);
    return;
  }
  console.log(`[PUPPETEER_DEBUG] Configuring Puppeteer path for production environment.`);

  try {
    // Prevent Puppeteer from trying to find a browser, which can fail inside an asar.
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";

    // Get the required Chromium version from our own package.json config.
    // This is the single source of truth.
    const chromeVersion = (packageJSON as { config: { chromiumVersion: string } }).config.chromiumVersion;
    console.log(`[PUPPETEER_DEBUG] Using configured Chrome version: ${chromeVersion}`);

    // Construct the path to the bundled Chromium executable.
    const platform = os.platform() === "win32" ? "win64" : "mac-arm64"; // Adjust for your target platforms
    console.log(`[PUPPETEER_DEBUG] Detected platform: ${platform}`);
    const subDir = os.platform() === "win32" ? "chrome-win64" : "chrome-mac-arm64";
    const executableName = os.platform() === "win32" ? "chrome.exe" : "chrome";

    const finalPath = path.join(
      process.resourcesPath,
      "chromium",
      "chrome",
      `${platform}-${chromeVersion}`,
      subDir,
      executableName,
    );
    console.log(`[PUPPETEER_DEBUG] Constructed final path: ${finalPath}`);

    if (fs.existsSync(finalPath)) {
      // Set the environment variable for all subsequent Puppeteer launches.
      process.env.PUPPETEER_EXECUTABLE_PATH = finalPath;
      console.log(`[PUPPETEER] Overriding executable path globally to: ${finalPath}`);
    } else {
      console.error(`[PUPPETEER_ERROR] Bundled Chromium not found at: ${finalPath}`);
    }
  } catch (error) {
    console.error("[PUPPETEER_ERROR] Failed to configure Puppeteer path:", error);
  }
})();

// Now that the environment variable is set, we can import other modules.
import * as projectManager from "./project_manager";
import * as settingsManager from "./settings_manager";

// Cross-platform icon path
const iconPath =
  os.platform() === "darwin"
    ? path.join(__dirname, "../../images/mulmocast_icon.icns")
    : path.join(__dirname, "../../images/mulmocast_icon.ico");

const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

// Development environment configuration
if (isDev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222"); // Enable Playwright debugging
}

// CI環境でサンドボックスを無効化
if (isCI || process.env.ELECTRON_DISABLE_SANDBOX === "1") {
  app.commandLine.appendSwitch("no-sandbox");
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const versionData = resolveTargetFromVersion(packageJSON.version, isDev);
console.log({ versionData });

const createSplashWindow = async () => {
  const splashWindow = new BrowserWindow({
    width: 400,
    height: 275,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: iconPath,
  });

  // Load splash.html - in dev mode it's in root, in prod it's in build directory
  if (isDev) {
    await splashWindow.loadFile(path.join(__dirname, "../../splash.html"));
  } else {
    await splashWindow.loadFile(path.join(__dirname, "splash.html"));
  }
  splashWindow.center();
  return splashWindow;
};

const createWindow = (splashWindow?: BrowserWindow) => {
  // Create the browser window.
  const windowState = getWindowState();
  const mainWindow = new BrowserWindow({
    ...windowState,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    icon: iconPath,
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  if (isDev) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  // Show main window when it's ready and close splash
  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow?.show();
    }, 2000);
  });

  // Save window state when closed
  mainWindow.on("close", () => saveWindowState(mainWindow));

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Default deny all new window creation for security
    // Only open trusted protocols (http/https) in external browser
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Use void to explicitly ignore the promise and add error handling
      shell.openExternal(url).catch((error) => {
        console.error("Failed to open external URL:", error);
      });
    }
    // Always deny new window creation in Electron
    return { action: "deny" };
  });

  // Handle navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      const parsedUrl = new URL(url);

      // Define allowed protocols and hosts
      const allowedProtocols = ["file:"];
      const allowedHosts = ["localhost", "127.0.0.1", "::1"];

      // Check if navigation should be allowed
      const isAllowedProtocol = allowedProtocols.includes(parsedUrl.protocol);
      const isAllowedHost = allowedHosts.includes(parsedUrl.hostname);

      // Only allow navigation for file protocol or whitelisted hosts
      if (!isAllowedProtocol && !isAllowedHost) {
        event.preventDefault();

        // Open external URLs (http/https) in default browser
        if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
          shell.openExternal(url).catch((error) => {
            console.error("Failed to open external URL during navigation:", error);
          });
        }
      }
    } catch (error) {
      // If URL parsing fails, prevent navigation for safety
      event.preventDefault();
      console.error("Failed to parse URL for navigation:", error);
    }
  });

  ipcMain.on("request-env", (event) => {
    void (async () => {
      const settings = await settingsManager.loadSettings();
      const envData: Record<string, string | undefined> = {};

      for (const envKey of Object.keys(ENV_KEYS)) {
        const value = settings[envKey as keyof settingsManager.Settings];
        envData[envKey] = value || process.env[envKey];
      }

      event.reply("response-env", envData);
    })();
  });

  const updateCallBack = (response: number) => {
    if (response === 1) {
      mainWindow.webContents.send("navigate", "/upadteInstall");
    }
  };

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.StaticStorage,
      baseUrl: `https://s3.aws.mulmocast.com/releases/${versionData}/${process.platform}/${process.arch}`,
    },
    logger: log,
    notifyUser: true,
    onNotifyUser: (info) => {
      const lang = settingsManager.loadAppLanguage();
      const notifyProps = config.messages[lang as keyof typeof config.messages].updater;
      return makeUserNotifier(notifyProps)(info, updateCallBack);
    },
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  void (async () => {
    // In development mode, configure app appearance
    if (isDev) {
      // On macOS, force set the Dock icon for reliable display in dev mode
      if (os.platform() === "darwin") {
        try {
          // Use a PNG file for the Dock icon, as it's more reliable in dev mode.
          const dockIconPath = path.join(__dirname, "../../images/mulmocast_credit_1024x1024.png");
          app.dock.setIcon(dockIconPath);
        } catch (error) {
          console.error("Failed to set dock icon:", error);
        }
      }

      // Set About panel options to match build configuration
      app.setAboutPanelOptions({
        iconPath: path.join(__dirname, "../../images/mulmocast_credit_1024x1024.png"),
        applicationName: "MulmoCast",
        applicationVersion: app.getVersion(),
      });
    }

    const splashWindow = await createSplashWindow();

    // Install Vue.js DevTools in development mode
    if (isDev) {
      await installExtension(VUEJS_DEVTOOLS);
    }

    // Dynamically import IPC handlers AFTER Puppeteer path is configured.
    console.log("[MAIN] Attempting to dynamically import IPC handlers...");
    const { registerIPCHandler } = await import("./ipc_handler");
    console.log("[MAIN] IPC handlers module imported successfully.");
    registerIPCHandler();
    console.log("[MAIN] IPC handlers registered.");

    await projectManager.ensureProjectBaseDirectory();

    const settings = await settingsManager.loadSettings();

    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings[envKey as keyof settingsManager.Settings];
      if (value) {
        process.env[envKey] = value;
      }
    }
    Menu.setApplicationMenu(menu);
    createWindow(splashWindow);
  })();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
