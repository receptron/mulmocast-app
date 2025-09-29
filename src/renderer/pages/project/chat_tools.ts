import type { MulmoScript, MulmoBeat } from "mulmocast/browser";

type UpdateBeatOnMulmoScript = {
  func: "updateBeatOnMulmoScript";
  arg: {
    index: number;
    beat: MulmoBeat;
  };
};

type ReplaceBeatOnMulmoScript = {
  func: "replaceBeatOnMulmoScript";
  arg: {
    index: number;
    beat: MulmoBeat;
  };
};

type AddBeatToMulmoScript = {
  func: "addBeatToMulmoScript";
  arg: {
    beat: MulmoBeat | string;
  };
};

type InsertAtBeatToMulmoScript = {
  func: "insertAtBeatToMulmoScript";
  arg: {
    index: number;
    beat: MulmoBeat | string;
  };
};

type DeleteBeatOnMulmoScript = {
  func: "deleteBeatOnMulmoScript";
  arg: {
    index: number;
  };
};

type SetImagePromptOnBeat = {
  func: "setImagePromptOnBeat";
  arg: {
    index: number;
    imagePrompt: string;
  };
};

type AddSpeaker = {
  func: "addSpeaker";
  arg: {
    name: string;
    imagePrompt?: string;
    voiceId?: string;
  };
};

export type FuncNamedInput =
  | UpdateBeatOnMulmoScript
  | ReplaceBeatOnMulmoScript
  | AddBeatToMulmoScript
  | InsertAtBeatToMulmoScript
  | DeleteBeatOnMulmoScript
  | SetImagePromptOnBeat
  | AddSpeaker;

export const mulmoScriptTools = (namedInputs: FuncNamedInput, script: MulmoScript) => {
  const { arg, func } = namedInputs;

  if (func === "updateBeatOnMulmoScript") {
    const { beat, index } = arg;
    const newBeat = { ...(script.beats[index] ?? {}), ...beat };
    script.beats[index] = newBeat;
    return script;
  }
  if (func === "replaceBeatOnMulmoScript") {
    const { beat, index } = arg;
    script.beats[index] = beat;
    return script;
  }
  if (func === "addBeatToMulmoScript") {
    const { beat } = arg;
    const newBeat = typeof beat === "string" ? JSON.parse(beat) : beat;
    script.beats.push(newBeat);
    return script;
  }
  if (func === "insertAtBeatToMulmoScript") {
    const { beat, index } = arg;
    const newBeat = typeof beat === "string" ? JSON.parse(beat) : beat;
    script.beats.splice(index, 0, newBeat);
    return script;
  }
  if (func === "deleteBeatOnMulmoScript") {
    const { index } = arg;
    if (script.beats[index]) {
      script.beats.splice(index, 1);
      return script;
    }
    return;
  }
  if (func === "setImagePromptOnBeat") {
    const { index, imagePrompt } = arg;
    if (script.beats[index]) {
      script.beats[index]["imagePrompt"] = imagePrompt;
      return script;
    }
    return;
  }
  if (func === "addSpeaker") {
    const { name, imagePrompt, voiceId } = arg;
    if (!script.speechParams) {
      script.speechParams = { speakers: {} };
    }
    if (!script.speechParams.speakers) {
      script.speechParams.speakers = {};
    }
    script.speechParams.speakers[name] = {
      displayName: {
        en: name,
      },
      voiceId: voiceId ?? "shimmer",
      provider: "openai",
    };
    // image
    if (imagePrompt) {
      if (!script.imageParams) {
        script.imageParams = {};
      }
      if (!script.imageParams.images) {
        script.imageParams.images = {};
      }
      script.imageParams.images[name] = {
        type: "imagePrompt",
        prompt: imagePrompt,
      };
    }
    return script;
  }
};
