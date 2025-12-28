import { type MulmoScript } from "mulmocast/browser";

// instruction フィールドをサポートするか (OpenAI, Gemini)
export const providerSupportsInstruction = (provider: string | undefined): boolean => {
  return provider === "openai" || provider === "gemini";
};

// ElevenLabs の speechOptions (speed, stability, similarity_boost) をサポートするか
export const providerSupportsElevenLabsOptions = (provider: string | undefined): boolean => {
  return provider === "elevenlabs";
};

// 何らかの Speech Options をサポートするか（セクション全体の表示判定用）
export const providerSupportsSpeechOptions = (provider: string | undefined): boolean => {
  return providerSupportsInstruction(provider) || providerSupportsElevenLabsOptions(provider);
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
