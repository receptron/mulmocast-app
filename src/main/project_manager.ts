import { app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import dayjs from "dayjs";
import { randomUUID } from "node:crypto";
import { MulmoScriptMethods, mulmoScriptSchema, type MulmoScript } from "mulmocast";
import { GraphAILogger } from "graphai";

import type { Project, ProjectMetadata, Lang } from "../types";
import { SCRIPT_EDITOR_TABS, MULMO_VIEWER_TABS } from "../shared/constants";
import { initMulmoScript } from "../shared/beat_data";
import { onboardProjects } from "../shared/onboard";

// import { onboardMulmoScript }

const PROJECTS_DIR = "projects";
const META_DATA_FILE_NAME = "meta.json";
export const SCRIPT_FILE_NAME = "script.json";
const PROJECT_VERSION = "1.0.0";

export const getBasePath = (): string => {
  return path.join(app.getPath("userData"), PROJECTS_DIR);
};
export const getProjectPath = (projectId: string): string => {
  return path.join(getBasePath(), projectId);
};
const getProjectMetaPath = (projectId: string): string => {
  return path.join(getProjectPath(projectId), META_DATA_FILE_NAME);
};
const getProjectScriptPath = (projectId: string): string => {
  return path.join(getProjectPath(projectId), SCRIPT_FILE_NAME);
};

// Ensurer projects directory exists
export const ensureProjectBaseDirectory = async (): Promise<void> => {
  try {
    await fs.mkdir(getBasePath(), { recursive: true });
  } catch (error) {
    GraphAILogger.error("Failed to create projects directory:", error);
  }
};

const readJsonFile = async (filePath: string) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    GraphAILogger.error(`not hit: ${filePath}`);
    return null;
  }
};

const writeJsonFile = async (filePath: string, data: unknown) => {
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);

    const tmp = path.join(dir, `.${base}.${Date.now()}.${randomUUID()}.tmp`);
    const json = JSON.stringify(data, null, 2);

    await fs.writeFile(tmp, json, { encoding: "utf8", flag: "w" });
    await fs.rename(tmp, filePath);

    // await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
};
export const getProjectMetadata = async (projectId: string): Promise<ProjectMetadata> => {
  return readJsonFile(getProjectMetaPath(projectId));
};
export const getProjectMulmoScript = async (projectId: string): Promise<MulmoScript | null> => {
  const mulmo = await readJsonFile(getProjectScriptPath(projectId));
  try {
    return MulmoScriptMethods.validate(mulmo);
  } catch (__error) {
    GraphAILogger.warn("Validation failed for mulmo script:", __error);
    return mulmo;
  }
};

export const saveProjectMetadata = async (projectId: string, data: ProjectMetadata): Promise<boolean> => {
  return await writeJsonFile(getProjectMetaPath(projectId), data);
};
export const saveProjectScript = async (projectId: string, data: Partial<MulmoScript>): Promise<boolean> => {
  return await writeJsonFile(getProjectScriptPath(projectId), data);
};

export interface ProjectScriptImage {
  fileName: string;
  fullPath: string;
  projectRelativePath: string;
  fileUrl: string;
}

export const listProjectScriptImages = async (projectId: string): Promise<ProjectScriptImage[]> => {
  const imagesDirectory = path.join(getProjectPath(projectId), "output", "images", "script");

  try {
    const entries = await fs.readdir(imagesDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
      .map((entry) => {
        const fileName = entry.name;
        const fullPath = path.join(imagesDirectory, fileName);

        return {
          fileName,
          fullPath,
          projectRelativePath: `./output/images/script/${fileName}`,
          fileUrl: pathToFileURL(fullPath).toString(),
        } satisfies ProjectScriptImage;
      })
      .sort((a, b) => b.fileName.localeCompare(a.fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      GraphAILogger.error("Failed to list project script images:", error);
    }
    return [];
  }
};

const generateId = (): string => {
  const dateStr = dayjs().format("YYYYMMDD");
  const uuid = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
  return `${dateStr}-${uuid}`;
};

export const listProjects = async (): Promise<Project[]> => {
  try {
    return (
      await Promise.all(
        (await fs.readdir(getBasePath(), { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            const projectId = entry.name;
            const metadata = await getProjectMetadata(projectId);
            if (metadata === null) {
              return null;
            }
            const script = await getProjectMulmoScript(projectId);
            return {
              metadata,
              script,
            };
          }),
      )
    ).filter((project) => project !== null);
  } catch (error) {
    GraphAILogger.error("Failed to list projects:", error);
    return [];
  }
};

// Create a new project
export const createProject = async (title: string, lang: Lang, onboardProject: number): Promise<Project> => {
  const id = generateId();
  try {
    await fs.mkdir(getProjectPath(id), { recursive: true });

    const initialData: ProjectMetadata = {
      id,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      version: PROJECT_VERSION,
      sessionActive: false,
      hasErrors: false,
      chatMessages: [],
      useCache: false,
      scriptEditorActiveTab: SCRIPT_EDITOR_TABS.MEDIA,
      mulmoViewerActiveTab: MULMO_VIEWER_TABS.MOVIE,
    };

    const newScript = mulmoScriptSchema
      .strip()
      .safeParse(onboardProject < 3 ? onboardProjects[lang][onboardProject] : initMulmoScript(title, lang));
    const mulmoScript = newScript.data;

    await saveProjectMetadata(id, initialData);
    await saveProjectScript(id, mulmoScript);

    return {
      metadata: initialData,
      script: mulmoScript,
    };
  } catch (error) {
    // Cleanup on failure
    await deleteProject(id);
    GraphAILogger.error("Failed to create project:", error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    await fs.rm(getProjectPath(id), { recursive: true, force: true });
    return true;
  } catch (error) {
    GraphAILogger.error("Failed to delete project:", error);
    throw error;
  }
};
