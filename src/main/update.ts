import { type MessageBoxOptions, dialog, autoUpdater } from "electron";
import { GraphAILogger } from "graphai";

import type { IUpdateDialogStrings, IUpdateInfo } from "update-electron-app";

let isInstallingUpdate = false;
let updateDownloaded = false;

autoUpdater.on("update-downloaded", () => {
  updateDownloaded = true;
});

/**
 * Guarded wrapper around autoUpdater.quitAndInstall().
 * Prevents re-entry when quitAndInstall() triggers before-quit.
 */
export function safeQuitAndInstall(): void {
  if (isInstallingUpdate) return;
  isInstallingUpdate = true;
  GraphAILogger.log("[AutoUpdate] Invoking quitAndInstall");
  autoUpdater.quitAndInstall();
}

/**
 * If an update was downloaded, apply it via quitAndInstall().
 * Intended to be called from app "before-quit" handler.
 */
export function applyUpdateOnQuit(): void {
  if (updateDownloaded && !isInstallingUpdate) {
    GraphAILogger.log("[AutoUpdate] Applying downloaded update on quit");
    safeQuitAndInstall();
  }
}

// copy from update-electron-app.
/**
 * Helper function that generates a callback for use with {@link IUpdateElectronAppOptions.onNotifyUser}.
 *
 * @param dialogProps - Text to display in the dialog.
 */
export function makeUserNotifier(
  dialogProps?: IUpdateDialogStrings,
): (info: IUpdateInfo, callback?: (response: number) => void) => void {
  const defaultDialogMessages = {
    title: "Application Update",
    detail: "A new version has been downloaded. Restart the application to apply the updates.",
    restartButtonText: "Restart",
    laterButtonText: "Later",
  };

  const assignedDialog = Object.assign({}, defaultDialogMessages, dialogProps);

  return (info: IUpdateInfo, callback?: (response: number) => void) => {
    const { releaseNotes, releaseName } = info;
    const { title, restartButtonText, laterButtonText, detail } = assignedDialog;

    const dialogOpts: MessageBoxOptions = {
      type: "info",
      buttons: [restartButtonText, laterButtonText],
      title,
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail,
    };

    const noteLog = Array.isArray(releaseNotes) ? releaseNotes.join("\n") : releaseNotes;

    GraphAILogger.log("[AutoUpdate] Prompting user about available update", {
      releaseName,
      releaseNotes: noteLog,
    });

    void (async () => {
      try {
        const { response } = await dialog.showMessageBox(dialogOpts);

        if (response === 0) {
          GraphAILogger.log("[AutoUpdate] User chose restart");
          safeQuitAndInstall();
        } else {
          GraphAILogger.log("[AutoUpdate] User deferred update");
        }

        if (callback) {
          callback(response);
        }
      } catch (error) {
        GraphAILogger.error("[AutoUpdate] Failed to present update dialog", error);
      }
    })();
  };
}
