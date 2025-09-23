<template>
  <div class="border-border bg-muted/50 rounded-lg border p-8 text-center">
    <template v-if="!audioUrl">
      <Volume2 :size="64" class="text-muted-foreground mx-auto mb-4" />
      <p class="mb-2 text-lg font-medium">{{ t("project.productTabs.podcast.title") }}</p>
      <p class="text-muted-foreground mb-4 text-sm">{{ t("project.productTabs.podcast.description") }}</p>
    </template>
    <div class="flex flex-col items-center justify-center gap-4">
      <audio :src="audioUrl" v-if="!!audioUrl" controls ref="audioRef" @loadedmetadata="updateAudioMetadata" />
      <Button variant="outline" @click="downloadMp3" :disabled="!audioUrl">
        <Volume2 :size="16" class="mr-2" />
        {{ t("project.productTabs.podcast.download") }}
      </Button>
    </div>
    <div class="text-muted-foreground mt-2 text-xs" v-if="audioUrl">
      {{
        t("project.productTabs.podcast.details", {
          duration: audioMetadata.duration || "-",
          size: audioMetadata.fileSize || "-",
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Volume2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { formatFileSize, formatDuration } from "@/lib/format";
import { useMulmoEventStore } from "@/store";

import { downloadFile, useMediaContents } from "./utils";

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);

const downloadMp3 = async () => {
  downloadFile(props.projectId, "audio", "audio/mp3", "audio.mp3");
};

const audioMetadata = ref({
  duration: "",
  fileSize: "",
});
const updateMetadata = () => {
  if (!audioRef.value) return;

  const audio = audioRef.value;
  audioMetadata.value.fileSize = formatFileSize(bufferLength.value);
  if (!isNaN(audio.duration)) {
    audioMetadata.value.duration = formatDuration(audio.duration);
  }
};

const {
  mediaUrl: audioUrl,
  bufferLength,
  updateResources,
} = useMediaContents("audio", "audio/mp3", async () => {
  await nextTick();
  updateMetadata();
});

watch(
  () => props.projectId,
  async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
      await updateResources(newProjectId);
    }
  },
  { immediate: true },
);

const mulmoEventStore = useMulmoEventStore();
const currentEvent = computed(() => mulmoEventStore.mulmoEvent[props.projectId]);
watch(currentEvent, async (mulmoEvent) => {
  if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "audio" && !mulmoEvent.inSession) {
    await updateResources(props.projectId);
  }
});
</script>
