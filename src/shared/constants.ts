import { type MulmoImageParams, provider2LLMAgent } from "mulmocast/browser";
import { bgmAssets } from "mulmocast/data";
export { pdf_modes, languages } from "mulmocast/browser";

// Define all valid feature keys as a readonly tuple
export const FEATURE_KEYS = [
  "llmChat",
  "llmTranslation",
  "tts",
  "tts-jp",
  "imageGeneration",
  "videoGeneration",
  "webSearch",
  "soundEffects",
  "lipSync",
  "bgmGeneration",
  "voiceCloning",
] as const;

// Create a union type from the tuple for type safety
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const ENV_KEYS = {
  OPENAI_API_KEY: {
    title: "OpenAI API Key",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
    features: ["llmChat", "llmTranslation", "tts", "imageGeneration"] as FeatureKey[],
  },
  REPLICATE_API_TOKEN: {
    title: "Replicate API Token",
    placeholder: "r8_...",
    url: "https://replicate.com/account/api-tokens",
    features: ["videoGeneration", "soundEffects", "lipSync"] as FeatureKey[],
  },
  GEMINI_API_KEY: {
    title: "Gemini API Key",
    placeholder: "AI...",
    url: "https://aistudio.google.com/app/apikey",
    features: ["llmChat", "tts", "imageGeneration", "videoGeneration"] as FeatureKey[],
  },
  ELEVENLABS_API_KEY: {
    title: "ElevenLabs API Key",
    placeholder: "el_...",
    url: "https://elevenlabs.io/app/settings/api-keys",
    features: ["tts", "bgmGeneration", "voiceCloning"] as FeatureKey[],
  },
  KOTODAMA_API_KEY: {
    title: "Kotodama API Key",
    placeholder: "kt_...",
    url: "https://kotodama.go-spiral.ai/",
    features: ["tts"] as FeatureKey[],
  },
  ANTHROPIC_API_KEY: {
    title: "Anthropic API Key",
    placeholder: "sk-...",
    url: "https://console.anthropic.com/settings/keys",
    features: ["llmChat"] as FeatureKey[],
  },
  GROQ_API_KEY: {
    title: "GROQ API Key",
    placeholder: "gsk-...",
    url: "https://console.groq.com/keys",
    features: ["llmChat"] as FeatureKey[],
  },
  TAVILY_API_KEY: {
    title: "Tavily API Key",
    placeholder: "tvly-...",
    url: "https://app.tavily.com/home",
    features: ["webSearch"] as FeatureKey[],
  },
  EXA_API_KEY: {
    title: "EXA API Key",
    placeholder: "xxx...",
    url: "https://dashboard.exa.ai/api-keys",
    features: ["webSearch"] as FeatureKey[],
  },
} as const;

export type EnvKey = keyof typeof ENV_KEYS;

// Azure OpenAI environment variable names
export const AZURE_OPENAI_ENV_KEYS = {
  IMAGE_OPENAI_API_KEY: "IMAGE_OPENAI_API_KEY",
  IMAGE_OPENAI_BASE_URL: "IMAGE_OPENAI_BASE_URL",
  TTS_OPENAI_API_KEY: "TTS_OPENAI_API_KEY",
  TTS_OPENAI_BASE_URL: "TTS_OPENAI_BASE_URL",
  LLM_OPENAI_API_KEY: "LLM_OPENAI_API_KEY",
  LLM_OPENAI_BASE_URL: "LLM_OPENAI_BASE_URL",
} as const;

export const llms = [
  {
    id: "openAIAgent",
    apiKey: "OPENAI_API_KEY",
  },
  {
    id: "anthropicAgent",
    apiKey: "ANTHROPIC_API_KEY",
  },
  {
    id: "azureOpenAIAgent",
    apiKey: null, // API Key is configured in Azure OpenAI settings section
  },
  /*
  {
    id: "ollamaAgent",
  },
  {
    id: "geminiAgent",
    apiKey: "GEMINI_API_KEY",
  },
  {
    id: "groqAgent",
    apiKey: "GROQ_API_KEY",
   },
   */
];

export const LLM_DEFAULT_AGENT = "openAIAgent";
export const LLM_OLLAMA_DEFAULT_CONFIG = {
  url: "http://localhost:11434/v1",
  model: "gpt-oss:20b",
};
export const LLM_OPENAI_DEFAULT_CONFIG = {
  model: provider2LLMAgent.openai.defaultModel,
};
export const LLM_ANTHROPIC_DEFAULT_CONFIG = {
  model: provider2LLMAgent.anthropic.defaultModel,
};
export const LLM_GEMINI_DEFAULT_CONFIG = {
  model: provider2LLMAgent.gemini.defaultModel,
};
export const LLM_GROQ_DEFAULT_MODEL = provider2LLMAgent.groq.defaultModel;

export const LLM_GROQ_DEFAULT_CONFIG = {
  model: provider2LLMAgent.groq.defaultModel,
};

export const LLM_AZURE_OPENAI_DEFAULT_CONFIG = {
  model: "", // Azure requires explicit deployment name
};

export type AppSettingKey = "APP_LANGUAGE" | "VIEW_MODE" | "SORT_BY" | "SORT_ORDER" | "DARK_MODE";

export const VOICE_LISTS = {
  openai: [
    { id: "shimmer", description: "Bright, light, and youthful tone" },
    { id: "alloy", description: "Calm mid-low register, persuasive tone" },
    { id: "ash", description: "Deep, mature, slightly rough tone" },
    { id: "ballad", description: "Gentle, soothing voice suited for narration" },
    { id: "coral", description: "Soft and friendly voice quality" },
    { id: "echo", description: "Clear, neutral, and easy to understand" },
    { id: "fable", description: "Expressive, great for storytelling" },
    { id: "nova", description: "Energetic, modern, and crisp tone" },
    { id: "onyx", description: "Strong, deep, and powerful voice" },
    { id: "sage", description: "Calm, thoughtful, and intellectual tone" },
  ],
  google: [
    { id: "ja-JP-Standard-A" },
    { id: "ja-JP-Standard-B" },
    { id: "ja-JP-Standard-C" },
    { id: "ja-JP-Standard-D" },
    { id: "en-US-Standard-A" },
    { id: "en-US-Standard-B" },
    { id: "en-US-Standard-C" },
    { id: "en-US-Standard-D" },
    { id: "en-US-Standard-E" },
  ],
  gemini: [
    { id: "Zephyr" },
    { id: "Puck" },
    { id: "Charon" },
    { id: "Kore" },
    { id: "Fenrir" },
    { id: "Leda" },
    { id: "Orus" },
    { id: "Aoede" },
    { id: "Callirrhoe" },
    { id: "Autonoe" },
    { id: "Enceladus" },
    { id: "Iapetus" },
    { id: "Umbriel" },
    { id: "Algieba" },
    { id: "Despina" },
    { id: "Erinome" },
    { id: "Algenib" },
    { id: "Rasalgethi" },
    { id: "Laomedeia" },
    { id: "Achernar" },
    { id: "Alnilam" },
    { id: "Schedar" },
    { id: "Gacrux" },
    { id: "Pulcherrima" },
    { id: "Achird" },
    { id: "Zubenelgenubi" },
    { id: "Vindemiatrix" },
    { id: "Sadachbia" },
    { id: "Sadaltager" },
    { id: "Sulafat" },
  ],
  elevenlabs: [
    { id: "3JDquces8E8bkmvbh6Bc", key: "otan" },
    { id: "c6SfcYrb2t09NHXiT80T", key: "janathan" },
    { id: "Mv8AjrYZCBkdsmDHNwcB", key: "ishibashi" },
    { id: "8EkOjt4xTPGMclNlh1pk", key: "morioki" },
    { id: "j210dv0vWm7fCknyQpbA", key: "hinata" },
    { id: "QEj0heL4nQHjaGrihlr0", key: "steven_casteel" },
    { id: "l39JidvAMB3s85XyNSRd", key: "sayuri" },
  ],
  kotodama: [
    { id: "Atla", key: "atla" },
    { id: "Poporo", key: "poporo" },
    { id: "jikkyo_baby", key: "jikkyo_baby" },
    { id: "Chunta", key: "chunta" },
    { id: "Mikko", key: "mikko" },
    { id: "Shion", key: "shion" },
    { id: "President", key: "president" },
    { id: "Kodama", key: "kodama" },
    { id: "Kyusuke", key: "kyusuke" },
    { id: "Kamiyama", key: "kamiyama" },
    { id: "Cammy", key: "cammy" },
    { id: "Marlo", key: "marlo" },
    { id: "Kitahara", key: "kitahara" },
    { id: "Ishigaki", key: "ishigaki" },
    { id: "Suginaka", key: "suginaka" },
  ],
} as const;

export const DECORATION_LISTS = {
  kotodama: [
    { id: "angry", key: "angry" },
    { id: "angry_en", key: "angry_en" },
    { id: "confused", key: "confused" },
    { id: "confused_en", key: "confused_en" },
    { id: "crying", key: "crying" },
    { id: "crying_en", key: "crying_en" },
    { id: "disgusted", key: "disgusted" },
    { id: "disgusted_en", key: "disgusted_en" },
    { id: "friendly", key: "friendly" },
    { id: "friendly_en", key: "friendly_en" },
    { id: "happy", key: "happy" },
    { id: "happy_en", key: "happy_en" },
    { id: "interested", key: "interested" },
    { id: "interested_en", key: "interested_en" },
    { id: "laughing", key: "laughing" },
    { id: "laughing_en", key: "laughing_en" },
    { id: "neutral", key: "neutral" },
    { id: "neutral_en", key: "neutral_en" },
    { id: "sad", key: "sad" },
    { id: "sad_en", key: "sad_en" },
    { id: "scared", key: "scared" },
    { id: "scared_en", key: "scared_en" },
    { id: "surprised", key: "surprised" },
    { id: "surprised_en", key: "surprised_en" },
    { id: "laughing_speech", key: "laughing_speech" },
    { id: "laughing_speech_en", key: "laughing_speech_en" },
    { id: "crying_speech", key: "crying_speech" },
    { id: "crying_speech_en", key: "crying_speech_en" },
    { id: "very_happy", key: "very_happy" },
    { id: "very_happy_en", key: "very_happy_en" },
  ],
} as const;

export const SCRIPT_EDITOR_TABS = {
  TEXT: "text",
  YAML: "yaml",
  JSON: "json",
  MEDIA: "media",
  STYLE: "style",
  REFERENCE: "reference",
} as const;

export type ScriptEditorTab = (typeof SCRIPT_EDITOR_TABS)[keyof typeof SCRIPT_EDITOR_TABS];

export const MULMO_VIEWER_TABS = {
  MOVIE: "movie",
  PDF: "pdf",
  PODCAST: "podcast",
  SLIDE: "slide",
} as const;

export type MulmoViewerTab = (typeof MULMO_VIEWER_TABS)[keyof typeof MULMO_VIEWER_TABS];

export const LANGUAGE_IDS = [
  "en",
  "es",
  "de",
  "ru",
  "fr",
  "ja",
  "pt",
  "tr",
  "it",
  "fa",
  "nl",
  "pl",
  "zh",
  "vi",
  "id",
  "cs",
  "ko",
  "ar",
  "uk",
  "el",
] as const;

export const LANGUAGES = [...LANGUAGE_IDS.map((key) => ({ id: key }))] as const;

export const I18N_SUPPORTED_LANGUAGES = [{ id: "en" }, { id: "ja" }] as const;

export const defaultSpeechProvider = "openai";
export const SPEECH_LANGUAGES = [{ id: "en" }, { id: "ja" }] as const;
export const SPEECH_DEFAULT_LANGUAGE = "en";

export const SORT_BY = {
  updatedAt: "updatedAt",
  title: "title",
} as const;

export const SORT_ORDER = {
  desc: "desc",
  asc: "asc",
} as const;

export const VIEW_MODE = {
  list: "list",
  grid: "grid",
} as const;

export const INITIAL_DESCRIPTION = "mulmocast";

export const IMAGE_PARAMS_DEFAULT_VALUES: MulmoImageParams = {
  provider: "openai",
  model: undefined,
  style: undefined,
  moderation: undefined,
};

// Image model display name mappings for i18n
export const IMAGE_MODEL_DISPLAY_KEYS: Record<string, string> = {
  "gemini-3-pro-image-preview": "nanoBananaPro",
  "gemini-2.5-flash-image": "nanoBanana",
};

export const AUDIO_PARAMS_DEFAULT_VALUES = {
  padding: 0.3,
  introPadding: 1.0,
  closingPadding: 0.8,
  outroPadding: 1.0,
  bgmVolume: 0.2,
  audioVolume: 1.0,
  bgm: {
    kind: "url",
    url: bgmAssets.bgms[1].url, // Default BGM configured in mulmocast-cli. https://github.com/receptron/mulmocast-cli/blob/main/src/utils/file.ts
  },
} as const;

export const SILENT_BGM = {
  kind: "url",
  url: "https://github.com/receptron/mulmocast-media/raw/refs/heads/main/bgms/silent001.mp3",
} as const;

export const PRESET_CANVAS_SIZE_DEFAULT_VALUE = "1024x1024";
export const PRESET_CANVAS_SIZE = {
  "1792x1024": { width: 1792, height: 1024 },
  "1024x1792": { width: 1024, height: 1792 },
  "1024x1024": { width: 1024, height: 1024 },
  "1536x1024": { width: 1536, height: 1024 },
  "1024x1536": { width: 1024, height: 1536 },
} as const;

export const userLevels = [
  {
    id: "beginner",
    mode: 1,
  },
  {
    id: "semiPro",
    mode: 50,
  },
  {
    id: "pro",
    mode: 100,
  },
];

// Media file extensions for file dialogs and validation
export const MEDIA_FILE_EXTENSIONS = {
  image: ["jpg", "jpeg", "png"] as const,
  video: ["mp4", "mov", "webm"] as const,
  audio: ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"] as const,
};

export type ImageExtension = (typeof MEDIA_FILE_EXTENSIONS.image)[number];
export type VideoExtension = (typeof MEDIA_FILE_EXTENSIONS.video)[number];
export type AudioExtension = (typeof MEDIA_FILE_EXTENSIONS.audio)[number];
export type MediaExtension = ImageExtension | VideoExtension | AudioExtension;

// MIME type mappings for file extensions
export const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export const MOVIE_MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
} as const;

export const AUDIO_MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  webm: "audio/webm",
} as const;

export const MIME_TYPES = {
  ...IMAGE_MIME_TYPES,
  ...MOVIE_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
} as const;

export const IMAGE_MIME = [...new Set(Object.values(IMAGE_MIME_TYPES))];
export const MOVIE_MIME = [...new Set(Object.values(MOVIE_MIME_TYPES))];
export const AUDIO_MIME = [...new Set(Object.values(AUDIO_MIME_TYPES))];

export const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/flac": ".flac",
  "audio/webm": ".webm",
};

// Default transition duration in seconds
export const DEFAULT_TRANSITION_DURATION = 0.3;

// Transition types for movie transitions
export const TRANSITION_TYPES: ReadonlyArray<{
  value: string;
  label: string;
  group: "slide" | "wipe" | null;
}> = [
  { value: "__undefined__", label: "typeNone", group: null },
  { value: "fade", label: "typeFade", group: null },
  // Slide Transitions
  { value: "slideout_left", label: "typeSlideoutLeft", group: "slide" },
  { value: "slideout_right", label: "typeSlideoutRight", group: "slide" },
  { value: "slideout_up", label: "typeSlideoutUp", group: "slide" },
  { value: "slideout_down", label: "typeSlideoutDown", group: "slide" },
  { value: "slidein_left", label: "typeSlideinLeft", group: "slide" },
  { value: "slidein_right", label: "typeSlideinRight", group: "slide" },
  { value: "slidein_up", label: "typeSlideinUp", group: "slide" },
  { value: "slidein_down", label: "typeSlideinDown", group: "slide" },
  // Wipe Transitions
  { value: "wipeleft", label: "typeWipeleft", group: "wipe" },
  { value: "wiperight", label: "typeWiperight", group: "wipe" },
  { value: "wipeup", label: "typeWipeup", group: "wipe" },
  { value: "wipedown", label: "typeWipedown", group: "wipe" },
  { value: "wipetl", label: "typeWipetl", group: "wipe" },
  { value: "wipetr", label: "typeWipetr", group: "wipe" },
  { value: "wipebl", label: "typeWipebl", group: "wipe" },
  { value: "wipebr", label: "typeWipebr", group: "wipe" },
];
