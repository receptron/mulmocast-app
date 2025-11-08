import {
  getBeatAudioPathOrUrl,
  MulmoPresentationStyleMethods,
  MulmoMediaSourceMethods,
  imagePreprocessAgent,
  getReferenceImagePath,
  getMultiLingual,
  getOutputMultilingualFilePathAndMkdir,
  localizedText,
  beatId,
  listLocalizedAudioPaths,
  defaultBGMPath,
  resolveAssetPath,
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

  const script = (await getProjectMulmoScript(projectId)) ?? {};
  return getMultiLingual(path.join(outdir, "script_lang.json"), script.beats ?? []);
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
