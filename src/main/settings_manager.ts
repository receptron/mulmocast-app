import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { ENV_KEYS, type EnvKey, type AppSettingKey, LANGUAGE_IDS, I18N_SUPPORTED_LANGUAGES } from "../shared/constants";

// Dynamically build the Settings type from ENV_KEYS and APP_SETTINGS
export type Settings = {
  [K in EnvKey]?: string;
} & {
  [K in AppSettingKey]?: string;
} & {
  USE_LANGUAGES: Record<string, boolean>;
};

const getSettingsPath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "settings.json");
};

export const loadSettings = async (): Promise<Settings> => {
  const settingsPath = getSettingsPath();
  const defaultUseLanguageSet = new Set(I18N_SUPPORTED_LANGUAGES.map((l) => l.id));
  const defaultSettings: Settings = {
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
  };

  try {
    if (!fs.existsSync(settingsPath)) {
      return defaultSettings;
    }

    const data = await fs.promises.readFile(settingsPath, "utf-8");
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return defaultSettings;
  }
};

export const loadAppLanguageSync = (): string => {
  const settingsPath = getSettingsPath();
  try {
    if (!fs.existsSync(settingsPath)) {
      return "en";
    }

    const data = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(data);
    return settings.APP_LANGUAGE || "en";
  } catch (error) {
    console.error("Failed to load app language:", error);
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
      const value = settings[envKey as keyof typeof ENV_KEYS];
      if (value) {
        process.env[envKey] = value;
      }
    }
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
};
