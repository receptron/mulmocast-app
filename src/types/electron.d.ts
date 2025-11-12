import type { Project, ProjectMetadata, MulmoProgressLog } from "./index";
import type { MulmoScript } from "mulmocast";
import type { IpcRendererEvent } from "electron";
import type { Settings } from "../types/index";
import type { ProjectScriptMedia } from "../main/project_manager";

export interface ElectronAPI {
  mulmoTest: (option: unknown) => Promise<void>;
  mulmoHandler: (method: string, ...args: unknown[]) => Promise<unknown>;
  onProgress: (callback: (event: IpcRendererEvent, data: MulmoProgressLog) => void) => void;
  dialog: {
    openFile: (fileType?: "image" | "video" | "media") => Promise<string | null>;
  };
  file: {
    readBinary: (filePath: string) => Promise<{ name: string; size: number; type: string; buffer: ArrayBuffer } | null>;
  };
  project: {
    list: () => Promise<Project[]>;
    create: (title: string, lang: string, onboardProject: number) => Promise<Project>;
    getProjectMetadata: (name: string) => Promise<ProjectMetadata>;
    getProjectMulmoScript: (name: string) => Promise<MulmoScript | null>;
    delete: (name: string) => Promise<boolean>;
    getPath: (name: string) => Promise<string>;
    listScriptImages: (name: string) => Promise<ProjectScriptMedia[]>;
    saveProjectMetadata: (id: string, data: unknown) => Promise<boolean>;
    saveProjectScript: (id: string, data: unknown) => Promise<boolean>;
    openProjectFolder: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<Settings>;
    set: (settings: Settings) => Promise<void>;
  };
  onNavigate: (callback: (path: string) => void) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
