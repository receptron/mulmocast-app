import { autoUpdater, BrowserWindow, ipcMain } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import log from "electron-log/main";

export const registerUpdater = () => {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.StaticStorage,
      baseUrl: `https://s3.aws.mulmocast.com/releases/test/${process.platform}/${process.arch}`,
    },
    logger: log,
    notifyUser: false,
  });

  const broadcastUpdaterEvent = (payload: unknown) => {
    for (const win of BrowserWindow.getAllWindows()) {
      try {
        win.webContents.send("updater:event", payload);
      } catch (e) {
        console.error("Failed to send updater:event:", e);
      }
    }
  };

  autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    broadcastUpdaterEvent({ type: "downloaded", releaseNotes, releaseName });
  });

  autoUpdater.on("error", (err) => {
    const message = err instanceof Error ? err.message : String(err);
    broadcastUpdaterEvent({ type: "error", message });
  });

  ipcMain.handle("updater:restart", () => {
    try {
      autoUpdater.quitAndInstall();
    } catch (e) {
      console.error("quitAndInstall failed:", e);
    }
  });

  ipcMain.handle("updater:check", () => {
    try {
      autoUpdater.checkForUpdates();
    } catch (e) {
      console.error("checkForUpdates failed:", e);
    }
  });
};
