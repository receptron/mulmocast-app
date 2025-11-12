import type { Project, ProjectMetadata, MulmoProgressLog } from "./index";
import type { MulmoScript } from "mulmocast";
import type { IpcRendererEvent } from "electron";
import type { Settings } from "../types/index";

export interface ElectronAPI {
  openFile: () => Promise<string | null>;
  mulmoTest: (option: unknown) => Promise<void>;
  mulmoHandler: (method: string, ...args: unknown[]) => Promise<unknown>;
  onProgress: (callback: (event: IpcRendererEvent, data: MulmoProgressLog) => void) => void;
  project: {
    list: () => Promise<Project[]>;
    create: (title: string, lang: string, onboardProject: number) => Promise<Project>;
    getProjectMetadata: (name: string) => Promise<ProjectMetadata>;
    getProjectMulmoScript: (name: string) => Promise<MulmoScript | null>;
    delete: (name: string) => Promise<boolean>;
    getPath: (name: string) => Promise<string>;
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
