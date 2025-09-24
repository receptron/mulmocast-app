import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import started from "electron-squirrel-startup";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import log from "electron-log/main";

import { registerIPCHandler } from "./ipc_handler";
import * as projectManager from "./project_manager";
import * as settingsManager from "./settings_manager";
import { ENV_KEYS } from "../shared/constants";
import { getWindowState, saveWindowState } from "./utils/windw_state";

log.initialize();

// Cross-platform icon path
const iconPath =
  os.platform() === "darwin"
    ? path.join(__dirname, "../../images/mulmocast_icon.icns")
    : path.join(__dirname, "../../images/mulmocast_credit_1024x1024.png");

const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

const configurePackagedPuppeteer = () => {
  const platform = process.platform;
  const executableNames =
    platform === "win32"
      ? ["chrome.exe"]
      : platform === "darwin"
        ? ["Google Chrome for Testing", "Chromium"]
        : ["chrome", "chromium"];

  const searchExecutables = (dir: string): string | null => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isFile() && executableNames.includes(entry.name)) {
          return entryPath;
        }
      }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const result = searchExecutables(path.join(dir, entry.name));
        if (result) return result;
      }
    } catch (error) {
      log.warn(`Failed to inspect Puppeteer cache directory: ${dir}`, error);
    }
    return null;
  };

  const rootCandidates = [path.join(process.resourcesPath, "app.asar.unpacked"), process.resourcesPath];

  const cacheCandidates = new Set<string>();
  for (const root of rootCandidates) {
    cacheCandidates.add(path.join(root, ".cache", "puppeteer"));
    cacheCandidates.add(path.join(root, ".puppeteer-cache"));
    cacheCandidates.add(path.join(root, "puppeteer"));
    cacheCandidates.add(path.join(root, "node_modules", "puppeteer", ".local-chromium"));
  }
  cacheCandidates.add(path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "puppeteer", ".local-chromium"));
  if (process.env.PUPPETEER_CACHE_DIR) {
    cacheCandidates.add(process.env.PUPPETEER_CACHE_DIR);
  }

  for (const cacheDir of cacheCandidates) {
    if (!cacheDir) continue;
    if (!fs.existsSync(cacheDir)) {
      log.debug?.(`Puppeteer cache not found: ${cacheDir}`);
      continue;
    }

    const executable = searchExecutables(cacheDir);
    if (executable) {
      process.env.PUPPETEER_CACHE_DIR = cacheDir;
      process.env.PUPPETEER_EXECUTABLE_PATH = executable;
      log.info(`Puppeteer executable resolved at ${executable}`);
      return;
    }
  }

  log.warn("Puppeteer executable could not be resolved from bundled caches");
};

// Development environment configuration
if (isDev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222"); // Enable Playwright debugging
} else {
  configurePackagedPuppeteer();
}

// CI環境でサンドボックスを無効化
if (isCI || process.env.ELECTRON_DISABLE_SANDBOX === "1") {
  app.commandLine.appendSwitch("no-sandbox");
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

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
};

updateElectronApp({
  updateSource: {
    type: UpdateSourceType.StaticStorage,
    baseUrl: `https://s3.aws.mulmocast.com/releases/test/${process.platform}/${process.arch}`,
  },
  logger: log,
});

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

    await projectManager.ensureProjectBaseDirectory();

    const settings = await settingsManager.loadSettings();

    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings[envKey as keyof settingsManager.Settings];
      if (value) {
        process.env[envKey] = value;
      }
    }

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
