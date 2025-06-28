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
  addSessionProgressCallback,
  removeSessionProgressCallback,
  getBeatAudioPath,
  imagePreprocessAgent,
  generateBeatImage,
  generateBeatAudio,
  MulmoPresentationStyleMethods,
} from "mulmocast";
import type { MulmoStudioContext } from "mulmocast";
import type { TransactionLog } from "graphai";
import path from "path";
import fs from "fs";
import { getProjectPath, SCRIPT_FILE_NAME, getProjectMetadata } from "../project_manager";
import { loadSettings } from "../settings_manager";
import { createMulmoScript } from "./scripting";
import { mergePresentationStyleToScript } from "../../shared/helpers";

import { z } from "zod";

updateNpmRoot(path.resolve(__dirname, "../../node_modules/mulmocast"));

const getContext = async (projectId: string): Promise<MulmoStudioContext | null> => {
  const projectPath = getProjectPath(projectId);
  const projectMetadata = await getProjectMetadata(projectId);

  const argv = {
    v: true,
    b: projectPath,
    o: path.join(projectPath, "output"),
    file: SCRIPT_FILE_NAME,
    f: projectMetadata?.useCache ? false : true,
  };

  const context = await initializeContext(argv, true);
  const script = mergePresentationStyleToScript(context.studio.script, projectMetadata);

  return {
    ...context,
    studio: {
      ...context.studio,
      script,
    },
  };
};

const mulmoCallbackGenerator = (projectId: string, webContents) => {
  return (data) => {
    if (webContents) {
      webContents.send("progress-update", {
        projectId,
        type: "mulmo",
        data,
      });
    }
  };
};

export const mulmoGenerateImage = async (projectId: string, index: number, webContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  addSessionProgressCallback(mulmoCallback);
  try {
    const context = await getContext(projectId);
    context.force = true;
    await generateBeatImage(index, context, settings);
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
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

export const mulmoGenerateAudio = async (projectId: string, index: number, webContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId, true);
    context.force = true;
    await generateBeatAudio(index, context, settings);
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
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

export const mulmoActionRunner = async (projectId: string, actionName: string, webContents) => {
  const settings = await loadSettings();
  try {
    const context = await getContext(projectId);
    const graphAICallbacks = [
      (log: TransactionLog) => {
        if (webContents) {
          webContents.send("progress-update", {
            projectId,
            type: "graphai",
            data: log,
          });
        }
      },
    ];
    const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
    addSessionProgressCallback(mulmoCallback);
    // await runTranslateIfNeeded(context, argv);
    if (actionName === "audio") {
      await audio(context, settings, graphAICallbacks);
    }
    if (actionName === "image") {
      await images(context, settings, graphAICallbacks);
    }
    if (actionName === "movie") {
      const audioContext = await audio(context, settings, graphAICallbacks);
      const imageContext = await images(audioContext, settings, graphAICallbacks);
      if (imageContext.caption) {
        const captionCoontext = await captions(imageContext);
        await movie(captionCoontext);
      } else {
        await movie(imageContext);
      }
    }
    if (actionName === "pdf") {
      await images(context, settings, graphAICallbacks);
      // await pdf(context, argv.pdf_mode, argv.pdf_size);
    }
    removeSessionProgressCallback(mulmoCallback);

    return {
      result: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (error.issues) {
        error.issues.map((e) => {
          webContents.send("progress-update", {
            projectId,
            type: "zod_error",
            data: e,
          });
        });
      }
    } else {
      webContents.send("progress-update", {
        projectId,
        type: "error",
        data: error,
      });
    }
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

const beatAudio = (context) => {
  return (beat) => {
    try {
      const { text } = beat; // TODO: multiLingual
      const fileName = getBeatAudioPath(text, context, beat);
      if (fs.existsSync(fileName)) {
        const buffer = fs.readFileSync(fileName);
        return buffer.buffer;
        // return fileName;
      }
      return;
    } catch (e) {
      console.log(e);
      return "";
    }
  };
};

export const mulmoAudioFiles = async (projectId: string) => {
  try {
    const context = await getContext(projectId);
    return context.studio.script.beats.map(beatAudio(context));
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const mulmoAudioFile = async (projectId: string, index: number) => {
  try {
    const context = await getContext(projectId);
    const beat = context.studio.script.beats[index];
    return beatAudio(context)(beat);
  } catch (error) {
    console.log(error);
  }
};

const beatImage = (context, imageAgentInfo) => {
  return async (beat, index) => {
    try {
      const res = await imagePreprocessAgent({ context, beat, index, imageAgentInfo, imageRefs: {} });
      if (res.imagePath) {
        if (res.imagePath.startsWith("http")) {
          const response = await fetch(res.imagePath);
          if (!response.ok) {
            throw new Error(`Failed to download image: ${res.imagePath}`);
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          res.imageData = buffer.buffer;
        } else if (fs.existsSync(res.imagePath)) {
          const buffer = fs.readFileSync(res.imagePath);
          res.imageData = buffer.buffer;
        }
      }
      // console.log(res);
      return res;
    } catch (e) {
      console.log(e);
      return "";
    }
  };
};

export const mulmoImageFiles = async (projectId: string) => {
  try {
    const context = await getContext(projectId);
    const imageAgentInfo = MulmoPresentationStyleMethods.getImageAgentInfo(context.presentationStyle);
    return Promise.all(context.studio.script.beats.map(beatImage(context, imageAgentInfo)));
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const mulmoImageFile = async (projectId: string, index: number) => {
  try {
    const context = await getContext(projectId);
    const imageAgentInfo = MulmoPresentationStyleMethods.getImageAgentInfo(context.presentationStyle);
    const beat = context.studio.script.beats[index];
    return await beatImage(context, imageAgentInfo)(beat, index);
  } catch (error) {
    console.log(error);
  }
};

export const mulmoImageUpload = async (projectId: string, index: number, bufferArray, extention: string) => {
  const projectPath = getProjectPath(projectId);
  const dir = path.resolve(projectPath, "upload_image", String(index));
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}.${extention}`;
  fs.writeFileSync(path.join(dir, filename), Buffer.from(bufferArray));

  return path.join("upload_image", String(index), filename);
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
      case "mulmoImageGenerate":
        return await mulmoGenerateImage(args[0], args[1], webContents);
      case "mulmoAudioGenerate":
        return await mulmoGenerateAudio(args[0], args[1], webContents);
      case "downloadFile":
        return await mulmoDownload(args[0], args[1]);
      case "mediaFilePath":
        return await mediaFilePath(args[0], args[1]);
      case "mulmoAudioFiles":
        return await mulmoAudioFiles(args[0]);
      case "mulmoAudioFile":
        return await mulmoAudioFile(args[0], args[1]);
      case "mulmoImageFiles":
        return await mulmoImageFiles(args[0]);
      case "mulmoImageFile":
        return await mulmoImageFile(args[0], args[1]);
      case "createMulmoScript":
        return await createMulmoScript(args[0], args[1]);
      case "mulmoImageUpload":
        return await mulmoImageUpload(args[0], args[1], args[2], args[3]);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    console.log(error);
    return { error };
  }
};
