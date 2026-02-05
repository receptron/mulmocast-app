import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { ENV_KEYS, LANGUAGE_IDS, I18N_SUPPORTED_LANGUAGES } from "../shared/constants";
import { Settings } from "../types/index";

const getSettingsPath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "settings.json");
};

export const loadSettings = async (): Promise<Settings> => {
  const settingsPath = getSettingsPath();
  const defaultUseLanguageSet = new Set(I18N_SUPPORTED_LANGUAGES.map((l) => l.id));
  const defaultSettings: Settings = {
    APIKEY: {},
    USE_LANGUAGES: LANGUAGE_IDS.reduce(
      (acc, lang) => {
        if (defaultUseLanguageSet.has(lang as (typeof I18N_SUPPORTED_LANGUAGES)[number]["id"])) {
          acc[lang] = true;
        } else {
          acc[lang] = false;
        }
        return acc;
      },
      {} as Record<string, boolean>,
    ),
    USER_LEVEL: "beginner",
    onboardProject: 0,
    llmConfigs: {},
  };

  try {
    if (!fs.existsSync(settingsPath)) {
      return defaultSettings;
    }

    const data = await fs.promises.readFile(settingsPath, "utf-8");
    const settings = { ...defaultSettings, ...JSON.parse(data) };

    // Set environment variables from loaded settings
    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings?.APIKEY?.[envKey as keyof typeof ENV_KEYS];
      if (value) {
        process.env[envKey] = value;
      }
    }

    // Azure OpenAI settings to environment variables
    if (settings.AZURE_OPENAI) {
      const { image, tts, llm } = settings.AZURE_OPENAI;
      if (image?.apiKey) process.env.IMAGE_OPENAI_API_KEY = image.apiKey;
      if (image?.baseUrl) process.env.IMAGE_OPENAI_BASE_URL = image.baseUrl;
      if (tts?.apiKey) process.env.TTS_OPENAI_API_KEY = tts.apiKey;
      if (tts?.baseUrl) process.env.TTS_OPENAI_BASE_URL = tts.baseUrl;
      if (llm?.apiKey) process.env.LLM_OPENAI_API_KEY = llm.apiKey;
      if (llm?.baseUrl) process.env.LLM_OPENAI_BASE_URL = llm.baseUrl;
    }

    return settings;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return defaultSettings;
  }
};

export const loadAppLanguage = (): string => {
  const DEFAULT_LANGUAGE = "en";
  const settingsPath = getSettingsPath();
  try {
    if (!fs.existsSync(settingsPath)) {
      return DEFAULT_LANGUAGE;
    }

    const data = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(data);
    return settings.APP_LANGUAGE || DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Failed to load app language:", error);
    return DEFAULT_LANGUAGE;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  const settingsPath = getSettingsPath();

  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");

    // Dynamically set environment variables based on constants
    for (const envKey of Object.keys(ENV_KEYS)) {
      const value = settings?.APIKEY?.[envKey as keyof typeof ENV_KEYS];
      if (value) {
        process.env[envKey] = value;
      }
    }

    // Azure OpenAI settings to environment variables
    if (settings.AZURE_OPENAI) {
      const { image, tts, llm } = settings.AZURE_OPENAI;
      if (image?.apiKey) process.env.IMAGE_OPENAI_API_KEY = image.apiKey;
      if (image?.baseUrl) process.env.IMAGE_OPENAI_BASE_URL = image.baseUrl;
      if (tts?.apiKey) process.env.TTS_OPENAI_API_KEY = tts.apiKey;
      if (tts?.baseUrl) process.env.TTS_OPENAI_BASE_URL = tts.baseUrl;
      if (llm?.apiKey) process.env.LLM_OPENAI_API_KEY = llm.apiKey;
      if (llm?.baseUrl) process.env.LLM_OPENAI_BASE_URL = llm.baseUrl;
    }
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
};
