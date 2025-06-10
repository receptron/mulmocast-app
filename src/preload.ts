// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  createProject: (projectId) => ipcRenderer.invoke("mulmo:createProject", projectId),
  loadProjects: () => ipcRenderer.invoke("mulmo:loadProjects"),

  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  mulmoTest: (option) => ipcRenderer.invoke("mulmo:test", option),
  onProgress: (callback) => ipcRenderer.on("progress-update", callback),
  getEnv: () =>
    new Promise((resolve) => {
      ipcRenderer.once("response-env", (_event, data) => resolve(data));
      ipcRenderer.send("request-env");
    }),
});
