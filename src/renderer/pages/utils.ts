import { type MulmoScript } from "mulmocast/browser";

// instruction フィールドをサポートするか (OpenAI, Gemini)
export const providerSupportsInstruction = (provider: string | undefined): boolean => {
  return provider === "openai" || provider === "gemini";
};

// ElevenLabs の speechOptions (stability, similarity_boost) をサポートするか
export const providerSupportsElevenLabsOptions = (provider: string | undefined): boolean => {
  return provider === "elevenlabs";
};

// speed パラメータをサポートするか (OpenAI, Google, ElevenLabs)
export const providerSupportsSpeed = (provider: string | undefined): boolean => {
  return provider === "openai" || provider === "google" || provider === "elevenlabs";
};

// プロバイダーごとの speed 設定
export type SpeedConfig = {
  min: number;
  max: number;
  step: number;
  placeholderKey: string;
};

const speedConfigs: Record<string, SpeedConfig> = {
  openai: { min: 0.25, max: 4.0, step: 0.25, placeholderKey: "parameters.speechParams.speedPlaceholderOpenai" },
  google: { min: 0.25, max: 2.0, step: 0.25, placeholderKey: "parameters.speechParams.speedPlaceholderGoogle" },
  elevenlabs: { min: 0.7, max: 1.2, step: 0.1, placeholderKey: "parameters.speechParams.speedPlaceholderElevenlabs" },
};

export const getSpeedConfig = (provider: string | undefined): SpeedConfig => {
  return speedConfigs[provider ?? ""] ?? speedConfigs.openai;
};

// 何らかの Speech Options をサポートするか（セクション全体の表示判定用）
export const providerSupportsSpeechOptions = (provider: string | undefined): boolean => {
  return (
    providerSupportsInstruction(provider) ||
    providerSupportsElevenLabsOptions(provider) ||
    providerSupportsSpeed(provider)
  );
};

export const insertSpeakers = (data: MulmoScript) => {
  const existsSpeakersOnBeats = data.beats.reduce((speakers, beat) => {
    if (beat.speaker && !speakers.has(beat.speaker)) {
      speakers.add(beat.speaker);
    }
    return speakers;
  }, new Set());
  Object.keys(data?.speechParams?.speakers ?? {}).map((speaker) => {
    existsSpeakersOnBeats.delete(speaker);
  });
  existsSpeakersOnBeats.forEach((speaker: string) => {
    data.speechParams.speakers[speaker] = {
      displayName: {
        en: speaker,
      },
      voiceId: "shimmer",
    };
  });
};
