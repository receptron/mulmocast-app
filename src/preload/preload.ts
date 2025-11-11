// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  openFile: () => Promise<string | null>;
  mulmoHandler: (method: string, ...args: unknown[]) => Promise<unknown>;
  onProgress: (callback: (...args: unknown[]) => void) => void;
  getEnv: () => Promise<unknown>;
  project: {
    list: () => Promise<unknown>;
    create: (title: string, lang: string, onboardProject: number) => Promise<unknown>;
    getProjectMetadata: (name: string) => Promise<unknown>;
    getProjectMulmoScript: (name: string) => Promise<unknown>;
    delete: (name: string) => Promise<unknown>;
    getPath: (name: string) => Promise<unknown>;
    saveProjectMetadata: (id: string, data: unknown) => Promise<unknown>;
    saveProjectScript: (id: string, data: unknown) => Promise<unknown>;
    openProjectFolder: (id: string) => Promise<unknown>;
  };
  updateInstall: () => Promise<unknown>;
  settings: {
    get: () => Promise<unknown>;
    set: (settings: unknown) => Promise<unknown>;
  };
  writeClipboardText: (text: string) => Promise<unknown>;
  onNavigate: (callback: (path: string) => void) => void;
}

const api: ElectronAPI = {
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  mulmoHandler: (method: string, ...args: unknown[]) => ipcRenderer.invoke("mulmoHandler", method, ...args),
  onProgress: (callback: (...args: unknown[]) => void) => ipcRenderer.on("progress-update", callback),
  getEnv: () =>
    new Promise((resolve) => {
      ipcRenderer.once("response-env", (_event, data) => resolve(data));
      ipcRenderer.send("request-env");
    }),
  project: {
    list: () => ipcRenderer.invoke("project:list"),
    create: (title: string, lang: string, onboardProject: number) =>
      ipcRenderer.invoke("project:create", title, lang, onboardProject),
    getProjectMetadata: (name: string) => ipcRenderer.invoke("project:getProjectMetadata", name),
    getProjectMulmoScript: (name: string) => ipcRenderer.invoke("project:getProjectMulmoScript", name),
    delete: (name: string) => ipcRenderer.invoke("project:delete", name),
    getPath: (name: string) => ipcRenderer.invoke("project:getPath", name),
    saveProjectMetadata: (id: string, data: unknown) => ipcRenderer.invoke("project:saveProjectMetadata", id, data),
    saveProjectScript: (id: string, data: unknown) => ipcRenderer.invoke("project:saveProjectScript", id, data),
    openProjectFolder: (id: string) => ipcRenderer.invoke("project:openProjectFolder", id),
  },
  updateInstall: () => ipcRenderer.invoke("updateInstall"),
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    set: (settings: unknown) => ipcRenderer.invoke("settings:set", settings),
  },
  writeClipboardText: (text: string) => ipcRenderer.invoke("writeClipboardText", text),
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on("navigate", (_, path) => callback(path));
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);
