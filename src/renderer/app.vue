<template>
  <Toaster richColors expand />
  <div>
    <router-view />
    <SettingModal />
    <ViewerModal />
    <OnboardingModal :is-open="globalStore.isOpenOnboardingModal" @complete="globalStore.toggleOnboardingModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useMulmoEventStore, useGraphAIDebugLogStore, useZodErrorStore, useMulmoGlobalStore } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import SettingModal from "@/components/setting_modal.vue";
import ViewerModal from "@/components/mulmo_viewer_modal.vue";
import OnboardingModal from "@/components/onboarding_modal.vue";
import { useTheme } from "@/composables/use_theme";

import "vue-sonner/style.css";
import type { MulmoProgressLog } from "@/types";
import type { SessionProgressEvent } from "mulmocast/browser";

import { notifyError } from "@/lib/notification";

import { availableNewVersion } from "./lib/utils";

export default defineComponent({
  components: {
    Toaster,
    SettingModal,
    ViewerModal,
    OnboardingModal,
  },
  setup() {
    const mulmoEventStore = useMulmoEventStore();
    const graphAIDebugStore = useGraphAIDebugLogStore();
    const zodErrorStore = useZodErrorStore();
    const globalStore = useMulmoGlobalStore();

    const isDevelopment = import.meta.env.DEV;
    // Initialize theme
    useTheme();

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

      const newVersion = await availableNewVersion();
      if (newVersion) {
        console.log(newVersion);
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
          console.log(errorData);
          if (errorData?.message) {
            notifyError("Error", errorData.message);
          }
        }

        if (message.type === "zod_error") {
          zodErrorStore.zodErrorLogCallback(message);
        }
      });
    });

    return {
      globalStore,
    };
  },
});
</script>
