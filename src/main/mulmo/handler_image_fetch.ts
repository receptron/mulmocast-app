import { WebContents } from "electron";
import { getProjectPath } from "../project_manager";
import path from "path";
import { fetchAndSave } from "./fetch_url";

const __mulmoImageFetchURL = async (
  projectId: string,
  dirPath: string,
  dirKey: string,
  url: string,
  webContents: WebContents,
) => {
  try {
    const projectPath = getProjectPath(projectId);
    const dir = path.resolve(projectPath, dirPath, dirKey);

    const res = await fetchAndSave(url, dir);

    if (res.result) {
      return {
        result: true,
        imageType: res.imageType,
        path: path.join(dirPath, dirKey, res.filename),
      };
    }
    if ("error" in res && res.error) {
      webContents.send("progress-update", {
        projectId,
        type: "error",
        data: res.error,
      });
    }
  } catch (error) {
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
    });
  }
  return {
    result: false,
  };
};

export const mulmoImageFetchURL = async (projectId: string, index: number, url: string, webContents: WebContents) => {
  const dirPath = "fetch_image";
  const dirKey = String(index);
  return await __mulmoImageFetchURL(projectId, dirPath, dirKey, url, webContents);
};

export const mulmoReferenceImageFetchURL = async (
  projectId: string,
  dirKey: string,
  url: string,
  webContents: WebContents,
) => {
  const dirPath = "fetch_ref_image";
  return await __mulmoImageFetchURL(projectId, dirPath, dirKey, url, webContents);
};
