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
  return beat.image?.type === "image" || beat.image?.type === "movie";
};

export const isURLSourceMediaBeat = (beat: MulmoBeat) => {
  return !!beat.image && "source" in beat.image && beat.image?.source?.kind === "url";
};

export const isLocalSourceMediaBeat = (beat: MulmoBeat) => {
  return !!beat.image && "source" in beat.image && beat.image?.source?.kind === "path";
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

/**
 * Beatが持つコンテンツの種類を判定
 */
export interface BeatContentType {
  // 何を持っているか
  hasImagePrompt: boolean; // AI画像生成プロンプト
  hasMoviePrompt: boolean; // AI動画生成プロンプト
  hasHtmlPrompt: boolean; // HTMLプロンプト
  hasImageMedia: boolean; // アップロードした画像
  hasMovieMedia: boolean; // アップロードした動画
  hasRefBeat: boolean; // 参照beat
  hasOtherImageType: boolean; // textSlide, markdown, chart等

  // 総合判定
  hasImageContent: boolean; // 画像系コンテンツがある
  hasMovieContent: boolean; // 動画系コンテンツがある
}

export const getBeatContentType = (beat: MulmoBeat): BeatContentType => {
  const hasImagePrompt = !beat.image && !beat.htmlPrompt && !!beat.imagePrompt;
  const hasMoviePrompt = !!beat.moviePrompt;
  const hasHtmlPrompt = !!beat.htmlPrompt;
  const hasImageMedia = beat.image?.type === "image";
  const hasMovieMedia = beat.image?.type === "movie";
  const hasRefBeat = beat.image?.type === "beat";
  const hasOtherImageType = beat.image?.type ? !["image", "movie", "beat"].includes(beat.image.type) : false;

  const hasImageContent = hasImagePrompt || hasImageMedia || hasOtherImageType || hasRefBeat;
  const hasMovieContent = hasMoviePrompt || hasMovieMedia;

  return {
    hasImagePrompt,
    hasMoviePrompt,
    hasHtmlPrompt,
    hasImageMedia,
    hasMovieMedia,
    hasRefBeat,
    hasOtherImageType,
    hasImageContent,
    hasMovieContent,
  };
};

/**
 * Beatで利用可能なUI機能を判定
 */
export interface BeatUICapabilities {
  // UI表示可否
  canShowMoviePromptUI: boolean; // 動画プロンプト入力欄を表示できるか
  shouldDisableMoviePrompt: boolean; // 動画プロンプト入力を無効化するか
  canShowLipSyncUI: boolean; // リップシンク設定欄を表示できるか

  // 生成ボタン有効化
  canGenerateMovie: boolean; // 動画生成ボタンを有効にできるか

  // Duration tooltip種別
  durationType: "generatedVideo" | "uploadedVideo" | "stillImage";
}

export const getBeatUICapabilities = (
  beat: MulmoBeat,
  lipSyncTargetInfo?: { supportsVideo: boolean; supportsImage: boolean },
): BeatUICapabilities => {
  const content = getBeatContentType(beat);

  // 動画プロンプトUIを表示できるか
  // = movie mediaとref beat以外
  const canShowMoviePromptUI = !content.hasMovieMedia && !content.hasRefBeat;

  // 動画プロンプト入力を無効化するか
  // = 画像リップシンクモデルで、かつリップシンクが有効な場合
  const shouldDisableMoviePrompt = !!(lipSyncTargetInfo?.supportsImage && beat.enableLipSync);

  // リップシンクUIを表示できるか
  // = 画像または動画コンテンツがあり、モデルがサポートしている
  let canShowLipSyncUI = false;
  if (lipSyncTargetInfo) {
    const canApplyToVideo = lipSyncTargetInfo.supportsVideo && content.hasMovieContent;
    const canApplyToImage = lipSyncTargetInfo.supportsImage && content.hasImageContent;
    canShowLipSyncUI = canApplyToVideo || canApplyToImage;
  }

  // 動画生成ボタンを有効にできるか
  const canGenerateMovie = !!beat.moviePrompt;

  // Duration tooltipの種別
  let durationType: "generatedVideo" | "uploadedVideo" | "stillImage";
  if (content.hasMoviePrompt) {
    durationType = "generatedVideo";
  } else if (content.hasMovieMedia) {
    durationType = "uploadedVideo";
  } else {
    durationType = "stillImage";
  }

  return {
    canShowMoviePromptUI,
    shouldDisableMoviePrompt,
    canShowLipSyncUI,
    canGenerateMovie,
    durationType,
  };
};
