import { ref } from "vue";
import { defineStore } from "pinia";
import { ENV_KEYS } from "../../shared/constants";

export const useModalStore = defineStore("modal", () => {
  const isOpenApiKeyModal = ref(false);
  const apiKeyModalTarget = ref<keyof typeof ENV_KEYS | null>(null);

  // Update modal state
  const isOpenUpdateModal = ref(false);
  const updateReleaseName = ref<string>("");
  const updateReleaseNotes = ref<string>("");

  const showApiKeyModal = (keyName: keyof typeof ENV_KEYS) => {
    apiKeyModalTarget.value = keyName;
    isOpenApiKeyModal.value = true;
  };

  const hideApiKeyModal = () => {
    isOpenApiKeyModal.value = false;
    apiKeyModalTarget.value = null;
  };

  const showUpdateModal = (params: { releaseName?: string; releaseNotes?: string } = {}) => {
    updateReleaseName.value = params.releaseName ?? "";
    updateReleaseNotes.value = params.releaseNotes ?? "";
    isOpenUpdateModal.value = true;
  };

  const hideUpdateModal = () => {
    isOpenUpdateModal.value = false;
    updateReleaseName.value = "";
    updateReleaseNotes.value = "";
  };

  return {
    isOpenApiKeyModal,
    apiKeyModalTarget,
    showApiKeyModal,
    hideApiKeyModal,
    isOpenUpdateModal,
    updateReleaseName,
    updateReleaseNotes,
    showUpdateModal,
    hideUpdateModal,
  };
});
