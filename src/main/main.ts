import { app, BrowserWindow, ipcMain, shell, type IpcMainEvent } from "electron";
import path from "node:path";
import os from "node:os";
import started from "electron-squirrel-startup";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

import { registerIPCHandler } from "./ipc_handler";
import * as projectManager from "./project_manager";
import * as settingsManager from "./settings_manager";
import { ENV_KEYS } from "../shared/constants";
import { getWindowState, saveWindowState } from "./utils/windw_state";

// Cross-platform icon path
const iconPath =
  os.platform() === "darwin"
    ? path.join(__dirname, "../../images/mulmocast_icon.icns")
    : path.join(__dirname, "../../images/mulmocast_credit_1024x1024.png");

const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

const openExternalUrl = async (targetUrl: string, errorMessage: string) => {
  try {
    await shell.openExternal(targetUrl);
  } catch (error) {
    console.error(errorMessage, error);
  }
};

const loadBrowserWindowFile = (window: BrowserWindow, filePath: string, errorMessage: string) => {
  void window.loadFile(filePath).catch((error) => {
    console.error(errorMessage, error);
  });
};

const loadBrowserWindowUrl = (window: BrowserWindow, targetUrl: string, errorMessage: string) => {
  void window.loadURL(targetUrl).catch((error) => {
    console.error(errorMessage, error);
  });
};

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

const createSplashWindow = () => {
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
  const splashFilePath = isDev ? path.join(__dirname, "../../splash.html") : path.join(__dirname, "splash.html");

  loadBrowserWindowFile(splashWindow, splashFilePath, "Failed to load splash screen:");
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
    loadBrowserWindowUrl(mainWindow, MAIN_WINDOW_VITE_DEV_SERVER_URL, "Failed to load renderer from dev server:");
  } else {
    loadBrowserWindowFile(
      mainWindow,
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      "Failed to load renderer from file system:",
    );
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
      void openExternalUrl(url, "Failed to open external URL:");
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
          void openExternalUrl(url, "Failed to open external URL during navigation:");
        }
      }
    } catch (error) {
      // If URL parsing fails, prevent navigation for safety
      event.preventDefault();
      console.error("Failed to parse URL for navigation:", error);
    }
  });

  const sendEnvironmentVariables = async (event: IpcMainEvent) => {
    const settings = await settingsManager.loadSettings();
    const envData: Record<string, string | undefined> = {};

    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings[envKey as keyof settingsManager.Settings];
      envData[envKey] = value || process.env[envKey];
    }

    event.reply("response-env", envData);
  };

  ipcMain.on("request-env", (event) => {
    void sendEnvironmentVariables(event).catch((error) => {
      console.error("Failed to handle request-env IPC message:", error);
    });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const handleAppReady = async () => {
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

  const splashWindow = createSplashWindow();

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
};

app.on("ready", () => {
  void handleAppReady().catch((error) => {
    console.error("Failed to initialise the application:", error);
  });
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
