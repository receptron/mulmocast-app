import type { MulmoBeat } from "mulmocast/browser";

export const getBadge = (beat: MulmoBeat) => {
  if (beat?.image) {
    if (["image", "movie"].includes(beat.image.type)) {
      /*
      if (beat.image?.source?.kind === 'url') {
        return "Remote File";
      }
      */
      if ("source" in beat.image && beat.image?.source?.kind === "path") {
        return "Local File";
      }
    }

    return beat?.image?.type;
  }
  if (beat.htmlPrompt) {
    return "Html Prompt";
  }
  return "Image Prompt";
};
