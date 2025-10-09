import { app, BrowserWindow, ipcMain, shell, Menu } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import started from "electron-squirrel-startup";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import log from "electron-log/main";
import puppeteer from "puppeteer";
import { GraphAILogger } from "graphai";

import { registerIPCHandler } from "./ipc_handler";
import * as projectManager from "./project_manager";
import * as settingsManager from "./settings_manager";
import { ENV_KEYS } from "../shared/constants";
import { resolveTargetFromVersion } from "../shared/version";
import { getWindowState, saveWindowState } from "./utils/windw_state";
import config from "../renderer/i18n/index";

import { getMenu } from "./menu";
import { makeUserNotifier } from "./update";
import { setupLogger } from "./logger";

import packageJSON from "../../package.json" with { type: "json" };

log.initialize();
setupLogger();

// --- Runtime Puppeteer Patch ---
const originalLaunch = puppeteer.launch.bind(puppeteer);
puppeteer.launch = function (options = {}) {
  const finalOptions = {
    ...options,
    executablePath: options.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  };

  if (process.env.NODE_ENV !== "development") {
    GraphAILogger.log(
      `[PUPPETEER_PATCH] Intercepting launch with executablePath: ${finalOptions.executablePath || "default"}`,
    );
  }

  return originalLaunch(finalOptions);
};

GraphAILogger.log("[PUPPETEER_PATCH] Runtime patch applied");
// end of Patch

// Production環境でのChromiumパス設定
if (!app.isPackaged) {
  GraphAILogger.log("[PUPPETEER] Development environment detected, skipping Chromium path configuration");
} else {
  GraphAILogger.log("[PUPPETEER] Production environment detected, configuring Chromium path");
  const chromiumDir = path.join(process.resourcesPath, "chromium", "chrome");
  GraphAILogger.log(`[PUPPETEER] Looking for Chromium in: ${chromiumDir}`);

  try {
    const versionDirs = fs
      .readdirSync(chromiumDir)
      .filter(
        (dir) =>
          dir.startsWith("win64-") ||
          dir.startsWith("mac-") ||
          dir.startsWith("mac_") ||
          dir.startsWith("mac-arm") ||
          dir.startsWith("mac_arm"),
      );
    GraphAILogger.log(`[PUPPETEER] Found version directories: ${versionDirs.join(", ")}`);

    if (versionDirs.length < 1) {
      GraphAILogger.warn("[PUPPETEER] No Chromium version directories found");
    } else {
      const platform = os.platform() === "win32" ? "win64" : "mac-arm64";
      GraphAILogger.log(`[PUPPETEER] Detected platform: ${platform}`);

      const macPrefixes = ["mac-arm64-", "mac-arm-", "mac_arm-"];
      const targetDir =
        os.platform() === "win32"
          ? versionDirs.find((dir) => dir.startsWith("win64-"))
          : versionDirs.find((dir) => macPrefixes.some((prefix) => dir.startsWith(prefix)));
      GraphAILogger.log(`[PUPPETEER] Target directory: ${targetDir || "none found"}`);

      if (!targetDir) {
        GraphAILogger.warn(`[PUPPETEER] No matching directory found for platform: ${platform}`);
      } else {
        const subDir = os.platform() === "win32" ? "chrome-win64" : "chrome-mac-arm64";
        const finalPath =
          os.platform() === "win32"
            ? path.join(chromiumDir, targetDir, subDir, "chrome.exe")
            : path.join(
                chromiumDir,
                targetDir,
                subDir,
                "Google Chrome for Testing.app",
                "Contents",
                "MacOS",
                "Google Chrome for Testing",
              );

        if (!fs.existsSync(finalPath)) {
          GraphAILogger.warn(`[PUPPETEER] Resolved path does not exist: ${finalPath}`);
        }
        process.env.PUPPETEER_EXECUTABLE_PATH = finalPath;
        GraphAILogger.log(`[PUPPETEER] Set PUPPETEER_EXECUTABLE_PATH: ${finalPath}`);
      }
    }
  } catch (error) {
    GraphAILogger.error("[PUPPETEER] Failed to auto-detect Chromium path:", error);
  }
}

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
GraphAILogger.log({ versionData });

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
        GraphAILogger.error("Failed to open external URL:", error);
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
            GraphAILogger.error("Failed to open external URL during navigation:", error);
          });
        }
      }
    } catch (error) {
      // If URL parsing fails, prevent navigation for safety
      event.preventDefault();
      GraphAILogger.error("Failed to parse URL for navigation:", error);
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
          GraphAILogger.error("Failed to set dock icon:", error);
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

    await projectManager.ensureProjectBaseDirectory();

    const settings = await settingsManager.loadSettings();

    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings[envKey as keyof settingsManager.Settings];
      if (value) {
        process.env[envKey] = value;
      }
    }
    const menu = await getMenu();
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

registerIPCHandler();
