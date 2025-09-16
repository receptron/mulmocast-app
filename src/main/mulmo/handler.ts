import {
  updateNpmRoot,
  getAudioArtifactFilePath,
  movieFilePath,
  pdfFilePath,
  addSessionProgressCallback,
  removeSessionProgressCallback,
  setFfmpegPath,
  setFfprobePath,
  getImageRefs,
  beatId,
  MulmoStudioContextMethods,
  getMultiLingual,
  getOutputMultilingualFilePathAndMkdir,
  mulmoStudioMultiLingualFileSchema,
  currentMulmoScriptVersion,
  hashSHA256,
  type MultiLingualTexts,
} from "mulmocast";
import { GraphAILogger } from "graphai";
import { app, WebContents } from "electron";
import path from "path";
import fs from "fs";

import { createMulmoScript } from "./scripting";
import {
  mulmoActionRunner,
  mulmoGenerateBeatImage,
  mulmoGenerateBeatAudio,
  mulmoReferenceImage,
  mulmoTranslateBeat,
  mulmoTranslate,
} from "./handler_generator";
import {
  mulmoAudioFiles,
  mulmoAudioFile,
  mulmoImageFile,
  mulmoImageFiles,
  mulmoReferenceImagesFiles,
  mulmoReferenceImagesFile,
  mulmoMultiLinguals,
  mulmoBGM,
} from "./handler_contents";
import { mulmoImageFetchURL, mulmoReferenceImageFetchURL } from "./handler_image_fetch";
import { mulmoReferenceImageUpload, mulmoImageUpload } from "./handler_image_upload";
import { mulmoAudioBgmUpload, mulmoAudioBgmGet } from "./handler_audio_upload";
import { graphaiPuppeteerAgent } from "./handler_graphai";
import { mulmoCallbackGenerator, getContext } from "./handler_common";

const isDev = !app.isPackaged;

if (isDev) {
  updateNpmRoot(path.resolve(__dirname, "../../node_modules/mulmocast"));
} else {
  updateNpmRoot(process.resourcesPath);
}
const ffmpegPath = path.resolve(__dirname, "../../node_modules/ffmpeg-ffprobe-static/ffmpeg");
const ffprobePath = path.resolve(__dirname, "../../node_modules/ffmpeg-ffprobe-static/ffprobe");

setFfmpegPath(isDev ? ffmpegPath : path.join(process.resourcesPath, "ffmpeg", "ffmpeg"));
setFfprobePath(isDev ? ffprobePath : path.join(process.resourcesPath, "ffmpeg", "ffprobe"));

// generate all reference
export const mulmoReferenceImages = async (projectId: string, webContents: WebContents) => {
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId);
    const imageProjectDirPath = MulmoStudioContextMethods.getImageProjectDirPath(context);
    fs.mkdirSync(imageProjectDirPath, { recursive: true });
    const images = await getImageRefs(context);
    removeSessionProgressCallback(mulmoCallback);
    return images;
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
    });
    return null;
  }
};

// TODO pdf
const mediaFilePath = async (projectId: string, actionName: string) => {
  const context = await getContext(projectId);
  if (actionName === "audio") {
    return getAudioArtifactFilePath(context);
    // return audioFilePath(context);
  }
  if (actionName === "movie") {
    return movieFilePath(context);
  }
  if (actionName === "pdf") {
    // return pdfFilePath(context, "slide");
    return pdfFilePath(context, "handout");
  }
  throw Error("no download file");
};
const mulmoDownload = async (projectId: string, actionName: string) => {
  const fileName = await mediaFilePath(projectId, actionName);
  if (!fs.existsSync(fileName)) {
    GraphAILogger.info(`mulmoDownload: ${fileName} not exists`);
    return null;
  }
  const buffer = fs.readFileSync(fileName);
  return buffer.buffer;
};

const mulmoUpdateMultiLingual = async (projectId: string, index: number, data: MultiLingualTexts) => {
  const context = await getContext(projectId);
  const { outputMultilingualFilePath } = getOutputMultilingualFilePathAndMkdir(context);
  const multiLingual = getMultiLingual(outputMultilingualFilePath, context.studio.beats);

  const beat = context.studio.script?.beats?.[index];
  for (const text of Object.values(data)) {
    if (!text.cacheKey) {
      text.cacheKey = hashSHA256(beat?.text ?? "");
    }
  }
  const key = beatId(beat?.id, index);
  multiLingual[key].multiLingualTexts = data;
  if (!multiLingual[key].cacheKey) {
    const beat = context.studio.script.beats[index];
    multiLingual[key].cacheKey = hashSHA256(beat.text ?? "");
  }
  const savedData = {
    version: currentMulmoScriptVersion,
    multiLingual: multiLingual,
  };
  mulmoStudioMultiLingualFileSchema.parse(savedData);
  fs.writeFileSync(outputMultilingualFilePath, JSON.stringify(savedData, null, 2), "utf8");
};

export const mulmoHandler = async (method: string, webContents: WebContents, ...args) => {
  console.log(`handler ${method} run`);
  try {
    switch (method) {
      case "mulmoActionRunner":
        return await mulmoActionRunner(args[0], args[1], args[2], webContents);
      case "mulmoGenerateBeatImage":
        return await mulmoGenerateBeatImage(args[0], args[1], args[2], webContents);
      case "mulmoGenerateBeatAudio":
        return await mulmoGenerateBeatAudio(args[0], args[1], webContents);
      case "mulmoTranslateBeat":
        return await mulmoTranslateBeat(args[0], args[1], args[2], webContents);
      case "mulmoTranslate":
        return await mulmoTranslate(args[0], args[1], webContents);
      case "downloadFile":
        return await mulmoDownload(args[0], args[1]);
      case "mediaFilePath":
        return await mediaFilePath(args[0], args[1]);
      case "mulmoAudioFiles":
        return await mulmoAudioFiles(args[0], args[1]);
      case "mulmoAudioFile":
        return await mulmoAudioFile(args[0], args[1]);
      case "mulmoImageFiles":
        return await mulmoImageFiles(args[0]);
      case "mulmoImageFile":
        return await mulmoImageFile(args[0], args[1]);
      case "mulmoReferenceImagesFiles":
        return await mulmoReferenceImagesFiles(args[0]);
      case "mulmoReferenceImagesFile":
        return await mulmoReferenceImagesFile(args[0], args[1]);
      case "createMulmoScript":
        return await createMulmoScript(args[0], args[1]);
      case "mulmoImageUpload":
        return await mulmoImageUpload(args[0], args[1], args[2], args[3]);
      case "mulmoReferenceImageUpload":
        return await mulmoReferenceImageUpload(args[0], args[1], args[2], args[3]);
      case "mulmoImageFetchURL":
        return await mulmoImageFetchURL(args[0], args[1], args[2], webContents);
      case "mulmoReferenceImageFetchURL":
        return await mulmoReferenceImageFetchURL(args[0], args[1], args[2], webContents);
      case "mulmoAudioBgmUpload":
        return await mulmoAudioBgmUpload(args[0], args[1], args[2]);
      case "mulmoAudioBgmGet":
        return await mulmoAudioBgmGet(args[0], args[1]);
      case "mulmoReferenceImage":
        return await mulmoReferenceImage(args[0], args[1], args[2], args[3], webContents);
      case "mulmoReferenceImages":
        return await mulmoReferenceImages(args[0], webContents);
      case "mulmoMultiLinguals":
        return await mulmoMultiLinguals(args[0], webContents);
      case "mulmoBGM":
        return await mulmoBGM(args[0], webContents);
      case "mulmoUpdateMultiLingual":
        return await mulmoUpdateMultiLingual(args[0], args[1], args[2]);
      case "graphaiPuppeteerAgent":
        return await graphaiPuppeteerAgent(args[0]);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    console.log(error);
    return { error };
  }
};
