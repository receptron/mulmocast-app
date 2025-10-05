import { Project, ProjectMetadata } from "@/types";
import type { MulmoScript } from "mulmocast/browser";

export type { Project, ProjectMetadata };

export const projectApi = {
  async list(): Promise<Project[]> {
    return await window.electronAPI.project.list();
  },

  async create(title: string, lang: string, onboardProject: number): Promise<Project> {
    return await window.electronAPI.project.create(title, lang, onboardProject);
  },

  async getProjectMetadata(id: string): Promise<ProjectMetadata> {
    return await window.electronAPI.project.getProjectMetadata(id);
  },
  async getProjectMulmoScript(id: string): Promise<MulmoScript> {
    return await window.electronAPI.project.getProjectMulmoScript(id);
  },

  async delete(id: string): Promise<boolean> {
    return await window.electronAPI.project.delete(id);
  },

  async saveProjectMetadata(id: string, data: unknown): Promise<boolean> {
    return await window.electronAPI.project.saveProjectMetadata(id, JSON.parse(JSON.stringify(data)));
  },

  async saveProjectScript(id: string, data: unknown): Promise<boolean> {
    return await window.electronAPI.project.saveProjectScript(id, JSON.parse(JSON.stringify(data)));
  },

  async openProjectFolder(id: string): Promise<void> {
    return await window.electronAPI.project.openProjectFolder(id);
  },
};
