import { ipcMain, dialog, shell, clipboard, autoUpdater, type IpcMainInvokeEvent } from "electron";
import { mulmoHandler } from "./mulmo/handler";
import * as projectManager from "./project_manager";
import * as settingsManager from "./settings_manager";
import type { ProjectMetadata } from "../types";

export const registerIPCHandler = () => {
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.

  ipcMain.handle("dialog:openFile", async () => {
    // console.log(app.getPath('userData'));
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
    });
    if (canceled) return null;
    return filePaths[0];
  });

  ipcMain.handle("mulmoHandler", async (event: IpcMainInvokeEvent, method, ...args) => {
    const webContents = event.sender;
    return await mulmoHandler(method, webContents, ...args);
  });

  // Project management handlers
  ipcMain.handle("project:list", () => projectManager.listProjects());

  ipcMain.handle("project:create", (_event: IpcMainInvokeEvent, title: string, lang: string, onboardProject: number) =>
    projectManager.createProject(title, lang, onboardProject),
  );

  ipcMain.handle("project:getProjectMetadata", (_event: IpcMainInvokeEvent, id: string) =>
    projectManager.getProjectMetadata(id),
  );

  ipcMain.handle("project:getProjectMulmoScript", (_event: IpcMainInvokeEvent, id: string) =>
    projectManager.getProjectMulmoScript(id),
  );

  ipcMain.handle("project:delete", (_event: IpcMainInvokeEvent, id: string) => projectManager.deleteProject(id));

  ipcMain.handle("project:saveProjectMetadata", (_event: IpcMainInvokeEvent, id: string, metaData: ProjectMetadata) =>
    projectManager.saveProjectMetadata(id, metaData),
  );

  ipcMain.handle("project:saveProjectScript", (_event: IpcMainInvokeEvent, id: string, data: unknown) =>
    projectManager.saveProjectScript(id, data),
  );

  ipcMain.handle("settings:get", () => settingsManager.loadSettings());

  ipcMain.handle("settings:set", async (_event: IpcMainInvokeEvent, settings: settingsManager.Settings) => {
    await settingsManager.saveSettings(settings);
  });

  ipcMain.handle("project:openProjectFolder", async (_event: IpcMainInvokeEvent, id: string) => {
    const projectPath = projectManager.getProjectPath(id);
    await shell.openPath(projectPath);
  });

  ipcMain.handle("writeClipboardText", (_event: IpcMainInvokeEvent, text: string) => {
    clipboard.writeText(text ?? "");
  });

  ipcMain.handle("updateInstall", (__event: IpcMainInvokeEvent) => {
    autoUpdater.quitAndInstall();
  });
};
