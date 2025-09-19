import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { ENV_KEYS } from "../../shared/constants";

type SETTINGS = {
  MAIN_LANGUAGE?: string;
  USE_LANGUAGES?: Record<string, boolean>;
  CHAT_LLM?: string;
  llmConfigs?: Record<string, Record<string, string>>;
  APIKEY?: Record<string, string>;
};

export const useMulmoGlobalStore = defineStore("mulmoGlobal", () => {
  const settings = ref<SETTINGS>({});
  const updateSettings = (data: SETTINGS) => {
    const { MAIN_LANGUAGE, USE_LANGUAGES, CHAT_LLM, llmConfigs, APIKEY } = data;
    const newData = { MAIN_LANGUAGE, USE_LANGUAGES, CHAT_LLM, llmConfigs, APIKEY };
    settings.value = newData;
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

  return {
    settings,
    updateSettings,
    settingPresence,

    isOpenSettingModal,
    toggleSettingModal,

    mulmoViewerProjectId,
    setMulmoViewerProjectId,

    isOpenOnboardingModal,
    toggleOnboardingModal,
    needsOnboarding,

    useLanguages,

    hasApiKey,
  };
});
