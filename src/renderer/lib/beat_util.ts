import type { MulmoBeat } from "mulmocast/browser";
import { isNull } from "graphai/lib/utils/utils";

export const getBadge = (beat: MulmoBeat) => {
  if (beat?.image) {
    if (["image", "movie"].includes(beat.image.type)) {
      if ("source" in beat.image && beat.image?.source?.kind === "path") {
        return "mediaFile";
      }
    }
    return beat?.image?.type;
  }
  if (beat.htmlPrompt) {
    return "htmlPrompt";
  }
  return "imagePrompt";
};

export const isMediaBeat = (beat: MulmoBeat) => {
  return beat.image.type === "image" || beat.image.type === "movie";
};

export const isURLSourceMediaBeat = (beat: MulmoBeat) => {
  return "source" in beat.image && beat.image?.source?.kind === "url";
};

export const isLocalSourceMediaBeat = (beat: MulmoBeat) => {
  return "source" in beat.image && beat.image?.source?.kind === "path";
};

export const setRandomBeatId = (beat: MulmoBeat) => {
  if (isNull(beat.id)) {
    beat.id = crypto.randomUUID();
  }
  return beat;
};

export const getBeatType = (beat: MulmoBeat) => {
  if (beat.image) {
    if (beat.image.type === "image") {
      return "mediaFile";
    }
    return beat.image.type;
  }
  if (beat.htmlPrompt) {
    return "htmlPrompt";
  }
  return "imagePrompt";
};

// html (htmlPrompt)
// beat (reference)
// movie (image.type movie)
// image (image.type other)
// imagePrompt
export const enableMovieType = (beat: MulmoBeat) => {
  if (beat.image?.type) {
    if (beat.image.type === "movie") {
      return false;
    }
    if (beat.image.type === "beat") {
      return false;
    }
  }
  return !beat.htmlPrompt;
};
export const enableLipSyncType = (beat: MulmoBeat) => {
  if (beat.image?.type) {
    if (beat.image.type === "beat") {
      return false;
    }
  }
  return !beat.htmlPrompt;
};
