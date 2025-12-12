import type { ZodError, ZodIssue } from "zod";
import type { MulmoError } from "../../types/index.js";
import { unknownMediaType, apiKeyInvalidType, apiRateLimitErrorType, apiKeyMissingType } from "mulmocast/browser";

const prioritizedApiErrorTargets = new Set(["videoDuration", "unsupportedModel", "multiLingualFile"]);

const unrecognizedKeysError = (paths: (string | number)[], keys: string[]) => {
  const pathStr = paths
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : `.${segment}`))
    .join("")
    .replace(/^\./, "");

  const formattedKeys = keys.map((k) => `'${k}'`).join(", ");
  return `The object at '${pathStr}' contains unrecognized key(s): ${formattedKeys}.`;
};

const invalidKeysError = (paths: (string | number)[], message: string) => {
  const pathStr = paths
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : `.${segment}`))
    .join("")
    .replace(/^\./, "");
  return `'${pathStr}' contains invalid data: ${message}.`;
};

const isRequiredElement = (current: ZodIssue) => {
  return current.code === "invalid_type" && current.message.includes("received undefined") && "expected" in current;
};

export const zodError2MulmoError = (error: ZodError) => {
  return (error.issues ?? []).reduce(
    (tmp: MulmoError, current) => {
      if (current.path.length === 0) {
        if (current.code === "unrecognized_keys") {
          tmp["script"]["script"] = [unrecognizedKeysError(["mulmoScript"], current.keys)];
        }
      }
      if (current.path.length === 1) {
        const key = current.path[0] as keyof MulmoError;
        if (current.code === "unrecognized_keys") {
          if (Array.isArray(tmp[key])) {
            tmp[key].push(
              unrecognizedKeysError(
                current.path.filter((p): p is string | number => typeof p !== "symbol"),
                current.keys,
              ),
            );
          }
        }
        if (current.code === "invalid_type") {
          if (Array.isArray(tmp[key])) {
            tmp[key].push(
              invalidKeysError(
                current.path.filter((p): p is string | number => typeof p !== "symbol"),
                current.message,
              ),
            );
          }
        }
      }

      // for beat
      if (current.path[0] === "beats") {
        if (current.path.length === 1) {
          if (current.code === "too_small") {
            tmp["script"]["beats"] = ["Beats must contain at least 1 beat(s)."];
          }
          if (isRequiredElement(current)) {
            tmp["script"]["beats"] = ["Beats must set."];
          }
        } else {
          const [__, index, ...paths] = current.path;
          const indexStr = String(index);
          if (!tmp["beats"][indexStr]) {
            tmp["beats"][indexStr] = [];
          }
          const filteredPaths = paths.filter((p): p is string | number => typeof p !== "symbol");
          if (current.code === "unrecognized_keys") {
            tmp["beats"][indexStr].push(unrecognizedKeysError(filteredPaths, current.keys));
          } else if (current.code === "invalid_type") {
            tmp["beats"][indexStr].push(invalidKeysError(filteredPaths, current.message));
          } else if (current.code === "invalid_union") {
            tmp["beats"][indexStr].push("invalid_union: something broken.");
          } else if (current.code === "invalid_format") {
            if ("format" in current && current.format === "url") {
              tmp["beats"][indexStr].push("invalid string: " + filteredPaths.join(".") + ". url must be a valid URL.");
            } else {
              tmp["beats"][indexStr].push("invalid string: " + filteredPaths.join(".") + ".");
            }
          } else {
            console.log(current);
          }
        }
      }
      if (
        [
          "canvasSize",
          "speechParams",
          "imageParams",
          "movieParams",
          "soundEffectParams",
          "lipSyncParams",
          "htmlImageParams",
          "textSlideParams",
          "captionParams",
          "audioParams",
        ].includes(String(current.path[0])) &&
        current.path.length > 1
      ) {
        const [__, ...paths] = current.path;
        const key = current.path[0] as keyof MulmoError;
        if (Array.isArray(tmp[key])) {
          const filteredPaths = paths.filter((p): p is string | number => typeof p !== "symbol");
          if (current.code === "unrecognized_keys") {
            tmp[key].push(unrecognizedKeysError(filteredPaths, current.keys));
          } else if (current.code === "invalid_type") {
            tmp[key].push(invalidKeysError(filteredPaths, current.message));
          }
        }
      }
      if (current.path[0] === "$mulmocast") {
        if (isRequiredElement(current)) {
          tmp["script"]["mulmocast"] = ["$mulmocast must set."];
        }
      }
      return tmp;
    },
    {
      script: {},
      beats: {},
      lang: [],
      canvasSize: [],
      speechParams: [],
      imageParams: [],
      movieParams: [],
      soundEffectParams: [],
      lipSyncParams: [],
      htmlImageParams: [],
      textSlideParams: [],
      captionParams: [],
      audioParams: [],
    },
  );
};

// for throw Error. convert error cause to notify
// refere: mulmocast-cli/src/utils/error_cause.ts
export const convCauseToErrorMessage = (cause: {
  action: string;
  type: string;
  target?: string;
  beatIndex?: number;
  url?: string;
  key?: string;
  agentName?: string;
  envVarName?: string;
  errorCode?: string;
  errorType?: string;
}) => {
  // notify.error.{action}.{type}

  // agentGenerationError(apiError)  -> agentName
  // agentInvalidResponseError(invalidResponse) -> agentName
  if (apiKeyInvalidType === cause.type) {
    return [["notify.error", cause.type, cause.agentName].join(".")];
  }
  if (apiRateLimitErrorType === cause.type) {
    return [["notify.error", cause.type, cause.agentName].join(".")];
  }

  if (cause?.target) {
    const { beatIndex, url, key } = cause;
    // beatIndex, url
    if (cause.type === "invalidResponse") {
      return [["notify.error", cause.action, cause.type, cause.agentName].join(".")];
    }
    if (cause.type === "voice_limit_reached") {
      return [["notify.error", cause.action, cause.type, cause.agentName].join(".")];
    }
    if (cause.type === "apiError") {
      if (prioritizedApiErrorTargets.has(cause.target)) {
        return [
          ["notify.error", cause.action, cause.type, cause.target].join("."),
          { url, key, beatIndex: beatIndex !== undefined ? beatIndex + 1 : null },
        ];
      }
      if (cause.errorCode && cause.errorType) {
        return [["notify.error", cause.action, cause.type, "openAIError", cause.errorCode].join("."), {}];
      }
      return [["notify.error", cause.action, cause.type, cause.agentName].join(".")];
    }

    return [
      ["notify.error", cause.action, cause.type, cause.target].join("."),
      { url, key, beatIndex: beatIndex !== undefined ? beatIndex + 1 : null },
    ];
  }
  if (unknownMediaType === cause.type) {
    return [["notify.error", cause.action, cause.type].join(".")];
  }
  if (apiKeyMissingType === cause.type) {
    return [["notify.error", apiKeyMissingType, cause.envVarName].join("."), {}];
  }
  if (cause.errorCode && cause.errorType) {
    return [["notify.error", cause.action, cause.type, "openAIError", cause.errorCode].join("."), {}];
  }
  if (cause.type === "badPrompt") {
    const errorKey = ["notify.error", cause.action, cause.type, cause.agentName].join(".");
    // Add link for ElevenLabs BGM bad prompt error
    if (errorKey === "notify.error.music.badPrompt.bgmElevenlabsAgent") {
      return [errorKey, { link: "https://elevenlabs.io/ja/music-terms" }];
    }
    return [errorKey, {}];
  }
  //  notify.error.music.badPrompt.bgmElevenlabsAgent

  console.log(cause);
  return ["notify.error.unknownError"];
};
