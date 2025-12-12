import { ipcMain, shell, clipboard, autoUpdater, dialog, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { mulmoHandler } from "./mulmo/handler";
import * as projectManager from "./project_manager";
import { saveSettings, loadSettings } from "./settings_manager";
import type { ProjectMetadata, Lang, Settings } from "../types";
import { MEDIA_FILE_EXTENSIONS, MIME_TYPES } from "../shared/constants";

export const registerIPCHandler = () => {
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.

  ipcMain.handle("mulmoHandler", async (event: IpcMainInvokeEvent, method, ...args) => {
    const webContents = event.sender;
    return await mulmoHandler(method, webContents, ...args);
  });

  // Project management handlers
  ipcMain.handle("project:list", () => projectManager.listProjects());

  ipcMain.handle("project:create", (_event: IpcMainInvokeEvent, title: string, lang: Lang, onboardProject: number) =>
    projectManager.createProject(title, lang, onboardProject),
  );

  ipcMain.handle("project:getProjectMetadata", (_event: IpcMainInvokeEvent, id: string) =>
    projectManager.getProjectMetadata(id),
  );

  ipcMain.handle("project:getProjectMulmoScript", (_event: IpcMainInvokeEvent, id: string) =>
    projectManager.getProjectMulmoScript(id),
  );

  ipcMain.handle("project:getPath", (_event: IpcMainInvokeEvent, id: string) => projectManager.getProjectPath(id));

  ipcMain.handle("project:listScriptImages", (_event: IpcMainInvokeEvent, id: string) =>
    projectManager.listProjectScriptImages(id),
  );

  ipcMain.handle("project:delete", (_event: IpcMainInvokeEvent, id: string) => projectManager.deleteProject(id));

  ipcMain.handle("project:copy", (_event: IpcMainInvokeEvent, id: string) => projectManager.copyProject(id));

  ipcMain.handle(
    "project:copyBeatMediaFiles",
    (_event: IpcMainInvokeEvent, projectId: string, sourceBeatId: string, targetBeatId: string) =>
      projectManager.copyBeatMediaFiles(projectId, sourceBeatId, targetBeatId),
  );

  ipcMain.handle("project:saveProjectMetadata", (_event: IpcMainInvokeEvent, id: string, metaData: ProjectMetadata) =>
    projectManager.saveProjectMetadata(id, metaData),
  );

  ipcMain.handle("project:saveProjectScript", (_event: IpcMainInvokeEvent, id: string, data: unknown) =>
    projectManager.saveProjectScript(id, data),
  );

  ipcMain.handle("settings:get", () => loadSettings());

  ipcMain.handle("settings:set", async (_event: IpcMainInvokeEvent, settings: Settings) => {
    await saveSettings(settings);
  });

  ipcMain.handle("project:openProjectFolder", async (_event: IpcMainInvokeEvent, id: string) => {
    const projectPath = projectManager.getProjectPath(id);
    await shell.openPath(projectPath);
  });

  ipcMain.handle("writeClipboardText", (_event: IpcMainInvokeEvent, text: string) => {
    clipboard.writeText(text ?? "");
  });

  ipcMain.handle("openExternal", async (_event: IpcMainInvokeEvent, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle("updateInstall", (__event: IpcMainInvokeEvent) => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle("dialog:openFile", async (_event: IpcMainInvokeEvent, fileType?: "image" | "video" | "media") => {
    const filterMap = {
      image: [{ name: "Images", extensions: [...MEDIA_FILE_EXTENSIONS.image] }],
      video: [{ name: "Videos", extensions: [...MEDIA_FILE_EXTENSIONS.video] }],
      media: [{ name: "Media Files", extensions: [...MEDIA_FILE_EXTENSIONS.image, ...MEDIA_FILE_EXTENSIONS.video] }],
    };

    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: fileType ? filterMap[fileType] : undefined,
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle("file:readBinary", async (_event: IpcMainInvokeEvent, filePath: string) => {
    if (!filePath) {
      return null;
    }

    const [fileBuffer, stats] = await Promise.all([fs.readFile(filePath), fs.stat(filePath)]);
    const extension = path.extname(filePath).slice(1).toLowerCase();
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

    return {
      name: path.basename(filePath),
      size: stats.size,
      type: MIME_TYPES[extension] ?? "",
      buffer: arrayBuffer,
    };
  });
};
