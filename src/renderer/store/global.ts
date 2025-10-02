import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { ENV_KEYS, userLevels } from "../../shared/constants";
import { type UserLevel } from "../../types/index";

type SETTINGS = {
  APP_LANGUAGE?: string;
  MAIN_LANGUAGE?: string;
  USE_LANGUAGES?: Record<string, boolean>;
  CHAT_LLM?: string;
  llmConfigs?: Record<string, Record<string, string>>;
  APIKEY?: Record<string, string>;
  USER_LEVEL?: UserLevel;
};

export const useMulmoGlobalStore = defineStore("mulmoGlobal", () => {
  const settings = ref<SETTINGS>({});
  const userMode = ref<{ id?: string; mode?: number }>(userLevels[0]);
  const hasUpdateInstall = ref(false);

  const updateSettings = (data: SETTINGS) => {
    const { MAIN_LANGUAGE, USE_LANGUAGES, CHAT_LLM, llmConfigs, APIKEY, USER_LEVEL, APP_LANGUAGE } = data;
    const newData = { MAIN_LANGUAGE, USE_LANGUAGES, CHAT_LLM, llmConfigs, APIKEY, USER_LEVEL, APP_LANGUAGE };
    settings.value = newData;
    userMode.value = userLevels.find((userLevel) => userLevel.id === settings.value.USER_LEVEL) ?? userLevels[0];
  };

  const isOpenSettingModal = ref(false);
  const toggleSettingModal = () => {
    isOpenSettingModal.value = !isOpenSettingModal.value;
  };

  const mulmoViewerProjectId = ref<string | null>(null);
  const setMulmoViewerProjectId = (projectId: string | null) => {
    mulmoViewerProjectId.value = projectId;
  };

  const isOpenOnboardingModal = ref(false);
  const toggleOnboardingModal = () => {
    isOpenOnboardingModal.value = !isOpenOnboardingModal.value;
  };
  const needsOnboarding = computed(() => {
    const currentSettings = settings.value;
    return !currentSettings.CHAT_LLM;
  });

  const useLanguages = computed(() => {
    return Object.keys(settings.value?.USE_LANGUAGES ?? {})
      .map((lang) => {
        return settings.value?.USE_LANGUAGES[lang] ? lang : null;
      })
      .filter((v) => v);
  });

  const settingPresence = computed(() => {
    const tmp: Record<string, boolean> = {};
    Object.keys(ENV_KEYS).forEach((envKey) => {
      tmp[envKey] = !!(settings.value.APIKEY && settings.value.APIKEY[envKey]);
    });
    return tmp;
  });

  const hasApiKey = (keyName: string) => {
    return !!settings.value.APIKEY[keyName];
  };

  const userIsPro = computed(() => {
    return userMode.value.id === "pro";
  });

  const userIsSemiProOrAbove = computed(() => {
    return userMode.value.id === "pro" || userMode.value.id === "semiPro";
  });

  const userIsBeginner = computed(() => {
    return userMode.value.id === "beginner";
  });

  const upadteInstall = () => {
    hasUpdateInstall.value = true;
  };

  return {
    settings,
    updateSettings,
    settingPresence,

    userMode,
    userIsPro,
    userIsSemiProOrAbove,
    userIsBeginner,

    isOpenSettingModal,
    toggleSettingModal,

    mulmoViewerProjectId,
    setMulmoViewerProjectId,

    isOpenOnboardingModal,
    toggleOnboardingModal,
    needsOnboarding,

    useLanguages,

    hasApiKey,

    hasUpdateInstall,
    upadteInstall,
  };
});
