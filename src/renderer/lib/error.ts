import type { ZodError, ZodIssue } from "zod";
import type { MulmoError } from "../../types/index.js";
import { unknownMediaType } from "mulmocast/browser";

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
  return current.code === "invalid_type" && current.message === "Required";
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
            tmp[key].push(unrecognizedKeysError(current.path, current.keys));
          }
        }
        if (current.code === "invalid_type") {
          if (Array.isArray(tmp[key])) {
            tmp[key].push(invalidKeysError(current.path, current.message));
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
          if (!tmp["beats"][String(index)]) {
            tmp["beats"][String(index)] = [];
          }
          if (current.code === "unrecognized_keys") {
            tmp["beats"][index].push(unrecognizedKeysError(paths, current.keys));
          } else if (current.code === "invalid_type") {
            tmp["beats"][index].push(invalidKeysError(paths, current.message));
          } else if (current.code === "invalid_union") {
            tmp["beats"][index].push("invalid_union: something broken.");
          } else if (current.code === "invalid_string") {
            if (current.validation === "url") {
              tmp["beats"][index].push("invalid string: " + paths.join(".") + ". url must be a valid URL.");
            } else {
              tmp["beats"][index].push("invalid string: " + paths.join(".") + ".");
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
          if (current.code === "unrecognized_keys") {
            tmp[key].push(unrecognizedKeysError(paths, current.keys));
          } else if (current.code === "invalid_type") {
            tmp[key].push(invalidKeysError(paths, current.message));
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
}) => {
  // notify.error.{action}.{type}
  /*
  if (cause.action === "images" && cause.type === "FileNotExist") {
    return ["notify.error.image.fileNotExist", { beat_index: cause.beat_index + 1 }];
    }
  */

  if (cause?.target) {
    const { beatIndex, url, key } = cause;
    // beatIndex, url
    return [
      ["notify.error", cause.action, cause.type, cause.target].join("."),
      { url, key, beatIndex: beatIndex !== undefined ? beatIndex + 1 : null },
    ];
  }
  if (unknownMediaType === cause.type) {
    return [["notify.error", cause.action, cause.type].join(".")];
  }
  // console.log(cause);
  return ["notify.error.unknownError"];
};
