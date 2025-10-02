import { type MessageBoxOptions, type autoUpdater, dialog, autoUpdater } from "electron";

import type { IUpdateDialogStrings, IUpdateInfo } from "update-electron-app";

// copy from update-electron-app.
/**
 * Helper function that generates a callback for use with {@link IUpdateElectronAppOptions.onNotifyUser}.
 *
 * @param dialogProps - Text to display in the dialog.
 */
export function makeUserNotifier(dialogProps?: IUpdateDialogStrings): (info: IUpdateInfo) => void {
  const defaultDialogMessages = {
    title: "Application Update",
    detail: "A new version has been downloaded. Restart the application to apply the updates.",
    restartButtonText: "Restart",
    laterButtonText: "Later",
  };

  const assignedDialog = Object.assign({}, defaultDialogMessages, dialogProps);

  return (info: IUpdateInfo, callback?: (response) => void) => {
    const { releaseNotes, releaseName } = info;
    const { title, restartButtonText, laterButtonText, detail } = assignedDialog;

    const dialogOpts: Electron.MessageBoxOptions = {
      type: "info",
      buttons: [restartButtonText, laterButtonText],
      title,
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail,
    };

    dialog.showMessageBox(dialogOpts).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
      if (callback) {
        callback(response);
      }
    });
  };
}
