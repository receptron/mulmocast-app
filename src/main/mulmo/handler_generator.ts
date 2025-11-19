import { WebContents } from "electron";
import { NodeState, GraphAILogger, type CallbackFunction } from "graphai";

import { mulmoCallbackGenerator, getContext } from "./handler_common";
import {
  images,
  audio,
  movie,
  pdf,
  captions,
  generateBeatImage,
  generateBeatAudio,
  generateReferenceImage,
  getBeatAudioPathOrUrl,
  addSessionProgressCallback,
  translateBeat,
  translate,
  removeSessionProgressCallback,
  MulmoStudioContextMethods,
  type MulmoStudioContext,
  type MulmoImagePromptMedia,
  type MulmoBeat,
} from "mulmocast";
import z from "zod";
import fs from "fs";
import { loadSettings } from "../settings_manager";

export const mulmoActionRunner = async (
  projectId: string,
  actionName: string | string[],
  targetLang: string | undefined,
  webContents: WebContents,
) => {
  const settings = await loadSettings();
  try {
    const context = await getContext(projectId, targetLang);
    if (!context) {
      return { result: false, noContext: true };
    }

    const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
    addSessionProgressCallback(mulmoCallback);

    const hasMatchingAction = (actions: string[], targets: string[]) =>
      actions.some((action) => targets.includes(action));

    const actionNames = Array.isArray(actionName) ? actionName : [actionName];
    const enables = {
      audio: hasMatchingAction(["audio", "movie"], actionNames),
      image: hasMatchingAction(["image", "movie", "pdf", "pdfSlide", "pdfHandout"], actionNames),
      movie: hasMatchingAction(["movie"], actionNames),
      pdfSlide: hasMatchingAction(["pdfSlide", "pdf"], actionNames),
      pdfHandout: hasMatchingAction(["pdfHandout", "pdf"], actionNames),
    };
    const args = { settings: settings.APIKEY ?? {} };
    const audioContext = enables.audio ? await audio(context, args) : context;
    const imageContext = enables.image ? await images(audioContext, args) : audioContext;
    if (enables.movie) {
      // const captioncontext = imageContext.caption ? await captions(imageContext) : imageContext;
      const captioncontext = await captions(imageContext);
      await movie(captioncontext);
    }
    if (enables.pdfSlide) {
      // sizes = ["letter", "a4"];
      await pdf(imageContext, "slide", "a4");
    }
    if (enables.pdfHandout) {
      await pdf(imageContext, "handout", "a4");
    }
    removeSessionProgressCallback(mulmoCallback);

    return {
      result: true,
    };
  } catch (error) {
    GraphAILogger.log(error);
    if (error instanceof z.ZodError) {
      if (error.issues) {
        error.issues.forEach((e) => {
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
        cause: error?.cause,
      });
    }
    return {
      result: false,
    };
  }
};

const beatAudioPath = (context: MulmoStudioContext, beat: MulmoBeat) => {
  const { text } = beat;
  return getBeatAudioPathOrUrl(text, context, beat, context.studio.script?.lang ?? "en");
};

export const mulmoGenerateBeatImage = async (
  projectId: string,
  index: number,
  target: string,
  webContents: WebContents,
) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  addSessionProgressCallback(mulmoCallback);
  try {
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }

    const beat: MulmoBeat & { audioFile?: string } = context.studio.script.beats[0];
    const { id } = beat;
    const forceImage = target === "image";
    const forceMovie = target === "movie";
    const forceLipSync = target === "lipSync";
    if (forceImage) {
      beat.moviePrompt = "";
    }
    if (target === "all") {
      context.force = true;
    }
    if ((target === "movie" || target === "all") && !beat.moviePrompt) {
      beat.moviePrompt = " ";
    }
    if (target === "lipSync") {
      // beat.moviePrompt = "";
      beat.audioFile = beatAudioPath(context, beat);
    }
    const graphaiCallbacks: CallbackFunction = ({ nodeId, state }) => {
      if (nodeId === "preprocessor" && state === NodeState.Executing) {
        webContents.send("progress-update", {
          projectId,
          type: "mulmo",
          data: {
            kind: "beatGenerate",
            sessionType: "image",
            inSession: true,
            index,
            id,
          },
        });
      }
      if (nodeId === "output" && state === NodeState.Completed) {
        webContents.send("progress-update", {
          projectId,
          type: "mulmo",
          data: {
            kind: "beatGenerate",
            sessionType: "image",
            inSession: false,
            index,
            id,
          },
        });
      }
    };

    await generateBeatImage({
      index: 0,
      context,
      args: {
        settings: settings.APIKEY ?? {},
        forceImage,
        forceMovie,
        forceLipSync,
        withBackup: true,
        callbacks: [graphaiCallbacks],
      },
    });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    GraphAILogger.log(error);
    removeSessionProgressCallback(mulmoCallback);

    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
      cause: error?.cause,
    });
    return {
      result: false,
    };
  }
};

export const mulmoGenerateBeatAudio = async (projectId: string, index: number, webContents: WebContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }
    //await generateBeatAudio(index, context, { settings: settings.APIKEY ?? {}, langs: ["de", "fr"] });
    await generateBeatAudio(0, context, { settings: settings.APIKEY ?? {}, langs: [context.lang] });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
      cause: error?.cause,
    });
    return {
      result: false,
    };
  }
};

// generate image by prompt
export const mulmoReferenceImage = async (
  projectId: string,
  index: number,
  key: string,
  image: MulmoImagePromptMedia,
  webContents: WebContents,
) => {
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId);
    if (!context) {
      return { result: false, noContext: true };
    }

    const imageProjectDirPath = MulmoStudioContextMethods.getImageProjectDirPath(context);
    fs.mkdirSync(imageProjectDirPath, { recursive: true });
    const returnImage = await generateReferenceImage({
      context,
      index,
      key,
      image,
      force: true,
    });
    removeSessionProgressCallback(mulmoCallback);
    return returnImage;
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
      cause: error?.cause,
    });
    return {
      result: false,
    };
  }
};

export const mulmoTranslateBeat = async (
  projectId: string,
  index: number,
  targetLangs: string[],
  webContents: WebContents,
) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId, null, index);
    if (!context) {
      return { result: false, noContext: true };
    }

    await translateBeat(0, context, targetLangs, { settings: settings.APIKEY ?? {} });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    GraphAILogger.log(error);
    removeSessionProgressCallback(mulmoCallback);
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
      cause: error?.cause,
    });
    return {
      result: false,
    };
  }
};

export const mulmoTranslate = async (projectId: string, targetLangs: string[], webContents: WebContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId);
    if (!context) {
      return { result: false, noContext: true };
    }

    await translate(context, { settings: settings.APIKEY ?? {}, targetLangs });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    webContents.send("progress-update", {
      projectId,
      type: "error",
      data: error,
      cause: error?.cause,
    });
    return {
      result: false,
    };
  }
};
