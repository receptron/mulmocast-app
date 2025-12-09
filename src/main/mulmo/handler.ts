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
  type MulmoImagePromptMedia,
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
  mulmoGeneratedAudioFile,
  mulmoImageFile,
  mulmoImageFiles,
  mulmoReferenceImagesFiles,
  mulmoReferenceImagesFile,
  mulmoMultiLinguals,
  mulmoBGM,
  mulmoImageBackupList,
  mulmoImageRestoreBackup,
  mulmoMovieBackupList,
  mulmoMovieRestoreBackup,
} from "./handler_contents";
import { mulmoImageFetchURL, mulmoReferenceImageFetchURL } from "./handler_image_fetch";
import { mulmoReferenceImageUpload, mulmoImageUpload } from "./handler_image_upload";
import { mulmoAudioBgmUpload, mulmoAudioBgmGet, mulmoBeatAudioUpload, mulmoBeatAudioGet } from "./handler_audio_upload";
import { graphaiPuppeteerAgent } from "./handler_graphai";
import { mulmoCallbackGenerator, getContext } from "./handler_common";
import { bgmList, bgmAudioFile, bgmGenerate, bgmUpdateTitle, bgmDelete } from "./handler_bgm";
import type { ChatMessage } from "../../types";

const isDev = !app.isPackaged;

if (isDev) {
  updateNpmRoot(path.resolve(__dirname, "../../node_modules/mulmocast"));
} else {
  updateNpmRoot(process.resourcesPath);
}
const ffmpegPath = path.resolve(__dirname, "../../node_modules/ffmpeg-ffprobe-static/ffmpeg");
const ffprobePath = path.resolve(__dirname, "../../node_modules/ffmpeg-ffprobe-static/ffprobe");
const ffmpegBinary = path.basename(ffmpegPath);
const ffprobeBinary = path.basename(ffprobePath);

setFfmpegPath(isDev ? ffmpegPath : path.join(process.resourcesPath, "ffmpeg", ffmpegBinary));
setFfprobePath(isDev ? ffprobePath : path.join(process.resourcesPath, "ffmpeg", ffprobeBinary));

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
  Object.values(data).forEach((d: { cacheKey?: string; text: string; lang: string }) => {
    if (!d.cacheKey) {
      d.cacheKey = hashSHA256(beat?.text ?? "");
    }
  });
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

export const mulmoHandler = async (method: string, webContents: WebContents, ...args: unknown[]) => {
  GraphAILogger.log(`handler ${method} run`);
  try {
    // eslint-disable-next-line sonarjs/max-switch-cases
    switch (method) {
      case "mulmoActionRunner":
        return await mulmoActionRunner(
          args[0] as string,
          args[1] as string | string[],
          args[2] as string | undefined,
          webContents,
        );
      case "mulmoGenerateBeatImage":
        return await mulmoGenerateBeatImage(args[0] as string, args[1] as number, args[2] as string, webContents);
      case "mulmoGenerateBeatAudio":
        return await mulmoGenerateBeatAudio(args[0] as string, args[1] as number, webContents);
      case "mulmoTranslateBeat":
        return await mulmoTranslateBeat(args[0] as string, args[1] as number, args[2] as string[], webContents);
      case "mulmoTranslate":
        return await mulmoTranslate(args[0] as string, args[1] as string[], webContents);
      case "downloadFile":
        return await mulmoDownload(args[0] as string, args[1] as string);
      case "mediaFilePath":
        return await mediaFilePath(args[0] as string, args[1] as string);
      case "mulmoAudioFiles":
        return await mulmoAudioFiles(args[0] as string, args[1] as string | undefined);
      case "mulmoAudioFile":
        return await mulmoAudioFile(args[0] as string, args[1] as number);
      case "mulmoGeneratedAudioFile":
        return await mulmoGeneratedAudioFile(args[0] as string, args[1] as number);
      case "mulmoImageFiles":
        return await mulmoImageFiles(args[0] as string);
      case "mulmoImageFile":
        return await mulmoImageFile(args[0] as string, args[1] as number);
      case "mulmoReferenceImagesFiles":
        return await mulmoReferenceImagesFiles(args[0] as string);
      case "mulmoReferenceImagesFile":
        return await mulmoReferenceImagesFile(args[0] as string, args[1] as string);
      case "createMulmoScript":
        return await createMulmoScript(args[0] as ChatMessage[], args[1] as string);
      case "mulmoImageUpload":
        return await mulmoImageUpload(args[0] as string, args[1] as number, args[2] as Uint8Array, args[3] as string);
      case "mulmoReferenceImageUpload":
        return await mulmoReferenceImageUpload(
          args[0] as string,
          args[1] as string,
          args[2] as Uint8Array,
          args[3] as string,
        );
      case "mulmoImageFetchURL":
        return await mulmoImageFetchURL(args[0] as string, args[1] as number, args[2] as string, webContents);
      case "mulmoReferenceImageFetchURL":
        return await mulmoReferenceImageFetchURL(args[0] as string, args[1] as string, args[2] as string, webContents);
      case "mulmoAudioBgmUpload":
        return await mulmoAudioBgmUpload(args[0] as string, args[1] as string, args[2] as Uint8Array);
      case "mulmoAudioBgmGet":
        return await mulmoAudioBgmGet(args[0] as string, args[1] as string);
      case "mulmoBeatAudioUpload":
        return await mulmoBeatAudioUpload(
          args[0] as string,
          args[1] as number,
          args[2] as string,
          args[3] as Uint8Array,
        );
      case "mulmoBeatAudioGet":
        return await mulmoBeatAudioGet(args[0] as string, args[1] as string);
      case "mulmoReferenceImage":
        return await mulmoReferenceImage(
          args[0] as string,
          args[1] as number,
          args[2] as string,
          args[3] as MulmoImagePromptMedia,
          webContents,
        );
      case "mulmoReferenceImages":
        return await mulmoReferenceImages(args[0] as string, webContents);
      case "mulmoMultiLinguals":
        return mulmoMultiLinguals(args[0] as string);
      case "mulmoBGM":
        return await mulmoBGM(args[0] as string);
      case "mulmoImageBackupList":
        return await mulmoImageBackupList(args[0] as string, args[1] as string);
      case "mulmoImageRestoreBackup":
        return await mulmoImageRestoreBackup(args[0] as string, args[1] as string, args[2] as string);
      case "mulmoMovieBackupList":
        return await mulmoMovieBackupList(args[0] as string, args[1] as string);
      case "mulmoMovieRestoreBackup":
        return await mulmoMovieRestoreBackup(args[0] as string, args[1] as string, args[2] as string);
      case "mulmoUpdateMultiLingual":
        return await mulmoUpdateMultiLingual(args[0] as string, args[1] as number, args[2] as MultiLingualTexts);
      case "graphaiPuppeteerAgent":
        return await graphaiPuppeteerAgent(args[0] as { url: string });
      case "bgmList":
        return await bgmList();
      case "bgmAudioFile":
        return await bgmAudioFile(args[0] as string);
      case "bgmGenerate":
        try {
          return await bgmGenerate(args[0] as string, args[1] as string, args[2] as string);
        } catch (error) {
          // Send error via progress-update event (same pattern as audio generation)
          webContents.send("progress-update", {
            type: "error",
            data: error,
            cause: error?.cause,
          });
          return { error };
        }
      case "bgmUpdateTitle":
        return await bgmUpdateTitle(args[0] as string, args[1] as string);
      case "bgmDelete":
        return await bgmDelete(args[0] as string);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    GraphAILogger.log(error);
    return { error };
  }
};
