import { createWriteStream, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { createHash } from "crypto";
import { extname } from "path";
import fetch from "node-fetch";

import {
  MEDIA_FILE_EXTENSIONS,
  IMAGE_MIME,
  MOVIE_MIME,
  MIME_EXT_MAP,
  type ImageExtension,
  type VideoExtension,
} from "../../shared/constants";

const guessTypeByMime = (mime: string): "image" | "movie" | undefined => {
  if (IMAGE_MIME.includes(mime)) {
    return "image";
  }
  if (MOVIE_MIME.includes(mime)) {
    return "movie";
  }
  return undefined;
};

const isImageExtension = (ext: string): ext is ImageExtension => {
  return MEDIA_FILE_EXTENSIONS.image.includes(ext as ImageExtension);
};

const isVideoExtension = (ext: string): ext is VideoExtension => {
  return MEDIA_FILE_EXTENSIONS.video.includes(ext as VideoExtension);
};

const guessTypeByExt = (ext: string): "image" | "movie" | undefined => {
  const lowered = ext.toLowerCase();
  if (isImageExtension(lowered)) {
    return "image";
  }
  if (isVideoExtension(lowered)) {
    return "movie";
  }
  return undefined;
};

const getHash = (str: string): string => createHash("sha256").update(str).digest("hex");

export const fetchAndSave = async (
  url: string,
  outDir = "./downloads",
): Promise<
  | { result: true; imageType: "image" | "movie"; path: string; filename?: string }
  | { result: false; error?: { message: string } }
> => {
  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) {
      console.log("not ok");
      console.log(res, url);
      return {
        result: false,
        error: {
          message: res.status + " " + res.statusText,
        },
      };
    }

    const mime = res.headers.get("content-type")?.split(";")[0] ?? "";
    const extFromUrl = extname(new URL(url).pathname) || "";
    const imageType = guessTypeByMime(mime) ?? guessTypeByExt(extFromUrl);

    if (!imageType) {
      console.log("no image type");
      return {
        error: {
          message: "invalid image type",
        },
        result: false,
      };
    }
    const ext = extFromUrl || MIME_EXT_MAP[mime] || "";
    if (!ext) {
      console.log("no ext");
      return {
        result: false,
        error: {
          message: "invalid image ext",
        },
      };
    }

    mkdirSync(outDir, { recursive: true });

    const hash = getHash(url);
    const filename = `${hash}${ext}`;
    const path = `${outDir}/${filename}`;

    await pipeline(res.body, createWriteStream(path));

    return {
      result: true,
      imageType,
      path,
      filename,
    };
  } catch (error) {
    console.log(error);
    return { result: false, error: { message: String(error) } };
  }
};

/*
const main = async () => {
  const url = "https://raw.githubusercontent.com/receptron/mulmocast-media/refs/heads/main/characters/jk_anime.png";
  const res = await fetchAndSave(url);
  console.log(res);
};
*/
//main();
