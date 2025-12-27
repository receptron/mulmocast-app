import type { MulmoPresentationStyle } from "mulmocast";

export interface CustomPromptTemplate {
  description: string;
  filename: string;
  presentationStyle: MulmoPresentationStyle;
  scriptName: string;
  systemPrompt: string;
  title: string;
}

export const customPromptTemplates: CustomPromptTemplate[] = [
  {
    description: "Vertical short video with nano banana style (5 beats, Gemini TTS)",
    filename: "vertical_short_nano",
    title: "Vertical Short (Nano Banana)",
    scriptName: "vertical_short_template.json",
    systemPrompt: `Create a 5-beat presentation script optimized for vertical short-form video (9:16 aspect ratio).
- IMPORTANT: Generate EXACTLY 5 beats, no more, no less.
- Each beat should be concise and engaging (10-15 seconds of speech per beat).
- Image prompts should be simple and visual, avoiding Japanese text elements.
- Focus on clear, compelling visuals that work well in vertical format.
Use the JSON below as a template.`,
    presentationStyle: {
      $mulmocast: {
        version: "1.1",
        credit: "closing",
      },
      canvasSize: {
        width: 1080,
        height: 1920,
      },
      imageParams: {
        provider: "google",
        model: "gemini-2.5-flash-image",
        style: "nano banana",
      },
      speechParams: {
        speakers: {
          Presenter: {
            provider: "google",
            voiceId: "en-US-Journey-D",
            displayName: {
              en: "Presenter",
              ja: "プレゼンター",
            },
          },
        },
      },
      audioParams: {
        audioVolume: 1,
        bgmVolume: 0.15,
        padding: 0.2,
        introPadding: 0.5,
        outroPadding: 0.5,
        closingPadding: 0.5,
        suppressSpeech: false,
        bgm: {
          kind: "url",
          url: "https://github.com/receptron/mulmocast-media/raw/refs/heads/main/bgms/theme001.mp3"
        },
      },
      movieParams: {
        provider: "replicate",
      },
      soundEffectParams: {
        provider: "replicate",
      },
    },
  },
];
