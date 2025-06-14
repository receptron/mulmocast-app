import {
  images,
  audio,
  movie,
  captions,
  initializeContext,
  updateNpmRoot,
  readTemplatePrompt,
  getAvailableTemplates,
  audioFilePath,
  movieFilePath,
} from "mulmocast";
import type { TransactionLog } from "graphai";
import { getProjectPath, SCRIPT_FILE_NAME } from "../project_manager";
import path from "path";
import fs from "fs";

updateNpmRoot(path.resolve(__dirname, "../../node_modules/mulmocast"));

const getContext = async (projectId: string) => {
  const projectPath = getProjectPath(projectId);
  const argv = {
    v: true,
    b: projectPath,
    o: path.join(projectPath, "output"),
    file: SCRIPT_FILE_NAME,
  };
  return await initializeContext(argv);
};

export const mulmoActionRunner = async (projectId: string, actionName: string, webContents) => {
  try {
    const context = await getContext(projectId);
    const callbacks = [
      (log: TransactionLog) => {
        if (webContents) {
          webContents.send("progress-update", {
            projectId,
            type: "progress",
            data: log,
          });
        }
      },
    ];
    // await runTranslateIfNeeded(context, argv);
    if (actionName === "audio") {
      await audio(context, callbacks);
    }
    if (actionName === "image") {
      await images(context, callbacks);
    }
    if (actionName === "movie") {
      await audio(context, callbacks);
      await images(context, callbacks);
      if (context.caption) {
        await captions(context);
      }
      await movie(context);
    }
    if (actionName === "pdf") {
      await images(context, callbacks);
      // await pdf(context, argv.pdf_mode, argv.pdf_size);
    }

    return {
      result: true,
    };
  } catch (error) {
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
    });
    return {
      result: false,
      error,
    };
  }
};
const mediaFilePath = async (projectId: string, actionName: string) => {
  const context = await getContext(projectId);
  if (actionName === "audio") {
    return audioFilePath(context);
  }
  if (actionName === "movie") {
    return movieFilePath(context);
  }
  throw Error("no download file");
};
const mulmoDownload = async (projectId: string, actionName: string) => {
  const path = await mediaFilePath(projectId, actionName);
  const buffer = fs.readFileSync(path);
  return buffer.buffer;
};

export const mulmoReadTemplatePrompt = (templateName: string) => {
  return readTemplatePrompt(templateName);
};

export const mulmoHandler = async (method, webContents, ...args) => {
  try {
    switch (method) {
      case "readTemplatePrompt":
        return mulmoReadTemplatePrompt(args[0]);
      case "getAvailableTemplates":
        return getAvailableTemplates();
      case "mulmoActionRunner":
        return await mulmoActionRunner(args[0], args[1], webContents);
      case "downloadFile":
        return await mulmoDownload(args[0], args[1]);
      case "mediaFilePath":
        return await mediaFilePath(args[0], args[1]);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    return { error };
  }
};
