<template>
  <Layout>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <!-- Header Section -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ t("voiceClone.title") }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">{{ t("voiceClone.description") }}</p>
          </div>
        </div>

        <!-- ElevenLabs API Key Alert -->
        <SettingsAlert provider="elevenlabs" :setting-presence="globalStore.settingPresence" class="mb-4" />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex items-center space-x-2">
            <Loader2 class="text-primary h-8 w-8 animate-spin" />
            <span class="text-muted-foreground">{{ t("ui.status.loading") }}</span>
          </div>
        </div>

        <!-- Voice List -->
        <div v-else-if="voices.length === 0" class="py-16 text-center">
          <div class="space-y-4">
            <Mic class="text-muted-foreground mx-auto h-16 w-16" />
            <h2 class="text-foreground text-xl font-semibold">{{ t("voiceClone.empty.title") }}</h2>
            <p class="text-muted-foreground">{{ t("voiceClone.empty.description") }}</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="voice in voices"
            :key="voice.voice_id"
            class="border-border hover:border-primary flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div class="flex flex-1 items-center space-x-4">
              <Mic class="text-muted-foreground h-5 w-5" />

              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ voice.name }}</span>
                  <Badge v-if="voice.category" variant="secondary" class="text-xs">{{ voice.category }}</Badge>
                </div>
                <p class="text-muted-foreground text-xs">{{ voice.voice_id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Mic, Loader2 } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import Layout from "@/components/layout.vue";
import SettingsAlert from "@/pages/project/script_editor/settings_alert.vue";
import { Badge } from "@/components/ui";
import { notifyError } from "@/lib/notification";
import { useMulmoGlobalStore } from "@/store";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();

interface ClonedVoice {
  voice_id: string;
  name: string;
  category?: string;
}

const voices = ref<ClonedVoice[]>([]);
const loading = ref(false);

const loadClonedVoices = async () => {
  loading.value = true;
  try {
    const result = (await window.electronAPI.mulmoHandler("getClonedVoices")) as ClonedVoice[];
    voices.value = result;
  } catch (error) {
    console.error("Failed to load cloned voices:", error);
    notifyError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadClonedVoices();
});
</script>
