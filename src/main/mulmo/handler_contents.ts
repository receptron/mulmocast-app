import {
  getBeatAudioPathOrUrl,
  MulmoPresentationStyleMethods,
  MulmoMediaSourceMethods,
  MulmoStudioContextMethods,
  imagePreprocessAgent,
  getReferenceImagePath,
  getMultiLingual,
  getOutputMultilingualFilePathAndMkdir,
  localizedText,
  beatId,
  listLocalizedAudioPaths,
  defaultBGMPath,
  resolveAssetPath,
  getAudioFilePath,
  hashSHA256,
  type MulmoStudioContext,
  type MulmoStudioMultiLingual,
  type MulmoBeat,
} from "mulmocast";
import { GraphAILogger } from "graphai";

import fs from "fs";
import path from "path";
import { getContext } from "./handler_common";
import { getProjectPath, getProjectMulmoScript } from "../project_manager";

// audio
const beatAudio = (context: MulmoStudioContext) => {
  return (beat: MulmoBeat, option?: { lang: string; multiLingual: MulmoStudioMultiLingual }) => {
    try {
      const { lang, multiLingual } = option ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = lang && multiLingual ? localizedText(beat, multiLingual as any, lang) : beat.text;

      const fileName = getBeatAudioPathOrUrl(text, context, beat, lang ?? context.studio.script?.lang ?? "en");
      if (fileExstsSync(fileName)) {
        const buffer = fs.readFileSync(fileName);
        return buffer.buffer;
      }
      return;
    } catch (e) {
      GraphAILogger.log(e);
      return;
    }
  };
};

export const mulmoAudioFiles = async (
  projectId: string,
  lang?: string,
): Promise<Record<string, ArrayBuffer> | { result: boolean; noContext: boolean } | unknown[]> => {
  try {
    const context = await getContext(projectId, lang);
    if (!context) {
      return { result: false, noContext: true };
    }
    const audios = listLocalizedAudioPaths(context);
    return context.studio.script.beats.reduce(
      (tmp, beat, index) => {
        const fileName = audios[index];
        // GraphAILogger.log(fileName);
        if (fileExstsSync(fileName)) {
          const buffer = fs.readFileSync(fileName);
          tmp[beatId(beat?.id, index)] = buffer.buffer;
        }
        return tmp;
      },
      {} as Record<string, ArrayBuffer>,
    );
  } catch (error) {
    GraphAILogger.log(error);
    return [];
  }
};
export const mulmoAudioFile = async (projectId: string, index: number) => {
  try {
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }
    const beat = context.studio.script.beats[0];
    return beatAudio(context)(beat);
  } catch (error) {
    GraphAILogger.log(error);
  }
};

// Get generated TTS audio file only (ignore beat.audio)
export const mulmoGeneratedAudioFile = async (projectId: string, index: number) => {
  try {
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }
    const beat = context.studio.script.beats[0];

    // Get TTS file path directly without checking beat.audio
    const text = beat.text;
    if (text === undefined || text === "" || context.studio.script.audioParams.suppressSpeech) {
      return undefined;
    }

    const lang = context.lang ?? context.studio.script?.lang ?? "en";
    const { voiceId, provider, speechOptions, model } = MulmoStudioContextMethods.getAudioParam(context, beat, lang);
    const audioDirPath = MulmoStudioContextMethods.getAudioDirPath(context);

    // Calculate TTS file path using hash
    const hash_string = [text, voiceId, speechOptions?.instruction ?? "", speechOptions?.speed ?? 1.0, provider, model ?? ""].join(":");
    const audioFileName = `${context.studio.filename}_${hashSHA256(hash_string)}`;
    const fileName = getAudioFilePath(audioDirPath, context.studio.filename, audioFileName, lang);

    if (fileExstsSync(fileName)) {
      const buffer = fs.readFileSync(fileName);
      return buffer.buffer;
    }
    return;
  } catch (error) {
    GraphAILogger.log(error);
  }
};

// images

export const mulmoImageFiles = async (
  projectId: string,
): Promise<Record<string, unknown> | { result: boolean; noContext: boolean } | unknown[]> => {
  try {
    const context = await getContext(projectId);
    if (!context) {
      return { result: false, noContext: true };
    }
    const dataSet = await Promise.all(context.studio.script.beats.map(beatImage(context)));
    return context.studio.script.beats.reduce(
      (tmp, beat, index) => {
        if (beat.id) {
          tmp[beat.id] = dataSet[index];
        }
        return tmp;
      },
      {} as Record<string, unknown>,
    );
  } catch (error) {
    GraphAILogger.log(error);
    return [];
  }
};
export const mulmoImageFile = async (projectId: string, index: number) => {
  try {
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }

    const beat = context.studio.script.beats[0];
    return await beatImage(context)(beat, 0);
  } catch (error) {
    GraphAILogger.log(error);
  }
};

const fileExstsSync = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  }
  return false;
};

const beatImage = (context: MulmoStudioContext) => {
  return async (beat: MulmoBeat, index: number) => {
    try {
      const imageAgentInfo = MulmoPresentationStyleMethods.getImageAgentInfo(context.presentationStyle, beat);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await imagePreprocessAgent({ context, beat, index, imageAgentInfo, imageRefs: {} } as any)) as any;
      if (res.htmlImageFile && fileExstsSync(res.htmlImageFile)) {
        const buffer = fs.readFileSync(res.htmlImageFile);
        res.imageData = buffer.buffer;
      } else if (res.imagePath) {
        if (res.imagePath.startsWith("http")) {
          const response = await fetch(res.imagePath);
          if (!response.ok) {
            throw new Error(`Failed to download image: ${res.imagePath}`);
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          res.imageData = buffer.buffer;
        } else if (fileExstsSync(res.imagePath)) {
          const buffer = fs.readFileSync(res.imagePath);
          res.imageData = buffer.buffer;
        }
      }
      if (res.movieFile && fileExstsSync(res.movieFile)) {
        const buffer = fs.readFileSync(res.movieFile);
        res.movieData = buffer.buffer;
      }
      if (res.lipSyncFile && fileExstsSync(res.lipSyncFile)) {
        const buffer = fs.readFileSync(res.lipSyncFile);
        res.lipSyncData = buffer.buffer;
      }
      return res;
    } catch (e) {
      GraphAILogger.log(e);
      return "";
    }
  };
};

// image reference

export const mulmoReferenceImagesFiles = async (projectId: string) => {
  const context = await getContext(projectId);
  if (!context) {
    return { result: false, noContext: true };
  }
  const images = context.presentationStyle.imageParams?.images;
  if (!images) {
    return {};
  }
  const imageRefs: Record<string, ArrayBuffer> = {};
  await Promise.all(
    Object.keys(images)
      .sort()
      .map(async (key) => {
        const image = images[key];
        try {
          const imagePath = (() => {
            if (image.type === "imagePrompt") {
              return getReferenceImagePath(context, key, "png");
            } else if (image.type === "image" && image.source.kind === "path") {
              return resolveAssetPath(context, image.source.path);
            }
          })();
          if (imagePath && fileExstsSync(imagePath)) {
            const buffer = fs.readFileSync(imagePath);
            imageRefs[key] = buffer.buffer;
          }
          if (image.type === "image" && image.source.kind === "url") {
            const response = await fetch(image.source.url);
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              imageRefs[key] = buffer.buffer;
            }
          }
        } catch (error) {
          GraphAILogger.log(error);
        }
      }),
  );
  return imageRefs;
};

export const mulmoReferenceImagesFile = async (projectId: string, key: string) => {
  const context = await getContext(projectId);
  if (!context) {
    return { result: false, noContext: true };
  }
  const images = context.presentationStyle.imageParams?.images;
  if (!images) {
    return {};
  }
  const image = images[key];
  try {
    const imagePath = (() => {
      if (image.type === "imagePrompt") {
        return getReferenceImagePath(context, key, "png");
      } else if (image.type === "image" && image.source.kind === "path") {
        return resolveAssetPath(context, image.source.path);
      }
    })();
    if (imagePath && fileExstsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      return buffer.buffer;
    }
  } catch (error) {
    GraphAILogger.log(error);
  }
  return null;
};

export const mulmoMultiLinguals = async (projectId: string): Promise<MulmoStudioMultiLingual> => {
  const context = await getContext(projectId);
  /*
  if (!context) {
    return { result: false, noContext: true };
    }
  */
  if (context) {
    const { outputMultilingualFilePath } = getOutputMultilingualFilePathAndMkdir(context);
    const multiLingual = getMultiLingual(outputMultilingualFilePath, context.studio.script.beats);
    return multiLingual;
  }
  const projectPath = getProjectPath(projectId);
  const outdir = path.join(projectPath, "output");
  fs.mkdirSync(outdir, { recursive: true });

  const script = await getProjectMulmoScript(projectId);
  return getMultiLingual(path.join(outdir, "script_lang.json"), script?.beats ?? []);
};

export const mulmoBGM = async (projectId: string) => {
  const context = await getContext(projectId);
  if (!context) {
    return { result: false, noContext: true };
  }
  const content =
    MulmoMediaSourceMethods.resolve(context.presentationStyle.audioParams.bgm, context) ??
    process.env.PATH_BGM ??
    defaultBGMPath();

  if (content && content.startsWith("http")) {
    const response = await fetch(content);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${content}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.buffer;
  }
};

// Generic media backup management
const getMediaDirectory = (projectPath: string, __mediaType: "image" | "movie") => {
  // Both images and movies are stored in the same directory
  return path.join(projectPath, "output", "images", "script");
};

const getMediaExtensions = (mediaType: "image" | "movie") => {
  if (mediaType === "image") {
    return "(png|jpg|jpeg)";
  }
  return "(mp4|mov|avi|webm)";
};

const mulmoMediaBackupList = async (projectId: string, beatId: string, mediaType: "image" | "movie") => {
  try {
    const projectPath = getProjectPath(projectId);
    const mediaDir = getMediaDirectory(projectPath, mediaType);

    if (!fs.existsSync(mediaDir)) {
      return [];
    }

    const files = fs.readdirSync(mediaDir);
    const beatIdEscaped = beatId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const extensions = getMediaExtensions(mediaType);
    const backupPattern = new RegExp(`^${beatIdEscaped}-(\\d+)\\.${extensions}$`, "i");

    const backups: Array<{ fileName: string; timestamp: number }> = [];

    for (const file of files) {
      const backupMatch = file.match(backupPattern);
      if (backupMatch) {
        const timestamp = parseInt(backupMatch[1], 10);
        backups.push({ fileName: file, timestamp });
      }
    }

    backups.sort((a, b) => b.timestamp - a.timestamp);

    return await Promise.all(
      backups.map(async (backup) => {
        const filePath = path.join(mediaDir, backup.fileName);
        const buffer = fs.readFileSync(filePath);
        return {
          fileName: backup.fileName,
          timestamp: backup.timestamp,
          imageData: buffer.buffer,
        };
      }),
    );
  } catch (error) {
    GraphAILogger.log(error);
    return [];
  }
};

// Image backup management (wrapper for backward compatibility)
export const mulmoImageBackupList = async (projectId: string, beatId: string) => {
  return mulmoMediaBackupList(projectId, beatId, "image");
};

// Movie backup management
export const mulmoMovieBackupList = async (projectId: string, beatId: string) => {
  return mulmoMediaBackupList(projectId, beatId, "movie");
};

const mulmoMediaRestoreBackup = async (
  projectId: string,
  beatId: string,
  backupFileName: string,
  mediaType: "image" | "movie",
) => {
  try {
    const projectPath = getProjectPath(projectId);
    const mediaDir = getMediaDirectory(projectPath, mediaType);
    const backupPath = path.join(mediaDir, backupFileName);

    if (!fs.existsSync(backupPath)) {
      return { result: false, error: "Backup file not found" };
    }

    const ext = path.extname(backupFileName);
    const currentPath = path.join(mediaDir, `${beatId}${ext}`);

    fs.copyFileSync(backupPath, currentPath);

    return { result: true };
  } catch (error) {
    GraphAILogger.log(error);
    return { result: false, error: String(error) };
  }
};

// Image restore (wrapper for backward compatibility)
export const mulmoImageRestoreBackup = async (projectId: string, beatId: string, backupFileName: string) => {
  return mulmoMediaRestoreBackup(projectId, beatId, backupFileName, "image");
};

// Movie restore
export const mulmoMovieRestoreBackup = async (projectId: string, beatId: string, backupFileName: string) => {
  return mulmoMediaRestoreBackup(projectId, beatId, backupFileName, "movie");
};
