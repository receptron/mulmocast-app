import { WebContents } from "electron";
import { mulmoCallbackGenerator, getContext, sendProgressUpdateFiltered } from "./handler_common";
import type { TransactionLog } from "graphai";
import {
  images,
  audio,
  movie,
  pdf,
  captions,
  generateBeatImage,
  generateBeatAudio,
  generateReferenceImage,
  getBeatAudioPath,
  addSessionProgressCallback,
  translateBeat,
  translate,
  removeSessionProgressCallback,
  MulmoStudioContextMethods,
  type MulmoStudioContext,
  type MulmoImagePromptMedia,
} from "mulmocast";
import { z } from "zod";
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
    const graphAICallbacks = [
      (log: TransactionLog) => {
        if (webContents) {
          sendProgressUpdateFiltered(webContents, projectId, "graphai", log);
        }
      },
    ];
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
    const args = { settings: settings.APIKEY ?? {}, callbacks: graphAICallbacks };
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
    console.log(error);
    if (error instanceof z.ZodError) {
      if (error.issues) {
        error.issues.map((e) => {
          sendProgressUpdateFiltered(webContents, projectId, "zod_error", e);
        });
      }
    } else {
      sendProgressUpdateFiltered(webContents, projectId, "error", error);
    }
    return {
      result: false,
      error,
    };
  }
};

const beatAudioPath = (context: MulmoStudioContext, beat) => {
  const { text } = beat;
  return getBeatAudioPath(text, context, beat, context.studio.script?.lang ?? "en");
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
    const context = await getContext(projectId);

    const beat = context.studio.script.beats[index];
    const { id } = beat;
    const forceImage = target === "image";
    const forceMovie = target === "movie";
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
      beat.moviePrompt = "";
      context.studio.beats[index].audioFile = beatAudioPath(context, beat);
    }
    const graphaiCallbacks = ({ nodeId, state }) => {
      if (nodeId === "preprocessor" && state === "executing") {
        sendProgressUpdateFiltered(webContents, projectId, "mulmo", {
          kind: "beatGenerate",
          sessionType: "image",
          inSession: true,
          index,
          id,
        });
      }
      if (nodeId === "output" && state === "completed") {
        sendProgressUpdateFiltered(webContents, projectId, "mulmo", {
          kind: "beatGenerate",
          sessionType: "image",
          inSession: false,
          index,
          id,
        });
      }
    };

    await generateBeatImage({
      index,
      context,
      args: {
        settings: settings.APIKEY ?? {},
        forceImage,
        forceMovie,
        callbacks: [graphaiCallbacks],
      },
    });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    sendProgressUpdateFiltered(webContents, projectId, "error", error);
    return {
      result: false,
      error,
    };
  }
};

export const mulmoGenerateBeatAudio = async (projectId: string, index: number, webContents: WebContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId);
    // context.force = true;
    //await generateBeatAudio(index, context, { settings: settings.APIKEY ?? {}, langs: ["de", "fr"] });
    await generateBeatAudio(index, context, { settings: settings.APIKEY ?? {} });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    sendProgressUpdateFiltered(webContents, projectId, "error", error);
    return {
      result: false,
      error,
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
    sendProgressUpdateFiltered(webContents, projectId, "error", error);
    return null;
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
    const context = await getContext(projectId);
    // context.force = true;
    await translateBeat(index, context, targetLangs, { settings: settings.APIKEY ?? {} });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    sendProgressUpdateFiltered(webContents, projectId, "error", error);
    return {
      result: false,
      error,
    };
  }
};

export const mulmoTranslate = async (projectId: string, targetLangs: string[], webContents: WebContents) => {
  const settings = await loadSettings();
  const mulmoCallback = mulmoCallbackGenerator(projectId, webContents);
  try {
    addSessionProgressCallback(mulmoCallback);
    const context = await getContext(projectId);

    await translate(context, { settings: settings.APIKEY ?? {}, targetLangs });
    removeSessionProgressCallback(mulmoCallback);
  } catch (error) {
    removeSessionProgressCallback(mulmoCallback);
    sendProgressUpdateFiltered(webContents, projectId, "error", error);
    return {
      result: false,
      error,
    };
  }
};
