<template>
  <Toaster richColors expand />
  <div>
    <router-view />
    <SettingModal />
    <ViewerModal />
    <OnboardingModal :is-open="globalStore.isOpenOnboardingModal" @complete="globalStore.toggleOnboardingModal" />
    <ApiKeyModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useMulmoEventStore, useGraphAIDebugLogStore, useZodErrorStore, useMulmoGlobalStore } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import SettingModal from "@/components/setting_modal.vue";
import ViewerModal from "@/components/mulmo_viewer_modal.vue";
import OnboardingModal from "@/components/onboarding_modal.vue";
import ApiKeyModal from "@/components/api_key_modal.vue";
// import { useTheme } from "@/composables/use_theme";

import "vue-sonner/style.css";
import type { MulmoProgressLog } from "@/types";
import type { SessionProgressEvent } from "mulmocast/browser";

import { notifyError } from "@/lib/notification";
import { useI18n } from "vue-i18n";
import { convCauseToErrorMessage } from "./lib/error";

const { t } = useI18n();

const mulmoEventStore = useMulmoEventStore();
const graphAIDebugStore = useGraphAIDebugLogStore();
const zodErrorStore = useZodErrorStore();
const globalStore = useMulmoGlobalStore();

const isDevelopment = import.meta.env.DEV;
// Initialize theme
// useTheme();

onMounted(async () => {
  try {
    const settings = await window.electronAPI.settings.get();
    if (settings) {
      globalStore.updateSettings(settings);
    }

    if (globalStore.needsOnboarding) {
      globalStore.toggleOnboardingModal();
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  window.electronAPI.onProgress(async (_event, message) => {
    if (message.type === "mulmo") {
      mulmoEventStore.mulmoLogCallback(message as MulmoProgressLog<SessionProgressEvent>);
    }
    if (message.type === "graphai" && isDevelopment) {
      graphAIDebugStore.graphaiLogCallback(message);
    }
    if (message.type === "error") {
      const errorData = message.data as { message?: string };
      if (message.cause) {
        const data = convCauseToErrorMessage(message.cause);
        const params = data[1] ?? {};

        // Add link button if link is provided
        const action =
          params && typeof params === "object" && "link" in params && typeof params.link === "string"
            ? {
                label: t("ui.actions.viewDetails"),
                onClick: () => window.electronAPI.openExternal(params.link as string),
              }
            : undefined;

        notifyError("", t(data[0], params), action);
      } else if (errorData?.message) {
        notifyError("Error", errorData.message);
      }
    }

    if (message.type === "zod_error") {
      zodErrorStore.zodErrorLogCallback(message);
    }
  });

  window.electronAPI.onNavigate((path: string) => {
    if (path === "/settings") {
      globalStore.toggleSettingModal();
    }
    if (path === "/upadteInstall") {
      globalStore.upadteInstall();
    }
  });
});
</script>
