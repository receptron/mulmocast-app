import { ref } from "vue";
import { defineStore } from "pinia";
import { ENV_KEYS } from "../../shared/constants";

export const useModalStore = defineStore("modal", () => {
  const isOpenApiKeyModal = ref(false);
  const apiKeyModalTarget = ref<keyof typeof ENV_KEYS | null>(null);

  const showApiKeyModal = (keyName: keyof typeof ENV_KEYS) => {
    apiKeyModalTarget.value = keyName;
    isOpenApiKeyModal.value = true;
  };

  const hideApiKeyModal = () => {
    isOpenApiKeyModal.value = false;
    apiKeyModalTarget.value = null;
  };

  return {
    isOpenApiKeyModal,
    apiKeyModalTarget,
    showApiKeyModal,
    hideApiKeyModal,
  };
});
