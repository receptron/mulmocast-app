<template>
  <div class="border-border bg-muted/50 rounded-lg border p-8 text-center">
    <div>
      <video
        v-if="videoUrl"
        :size="64"
        class="text-muted-foreground mx-auto mb-4 max-h-[90vh]"
        controls
        :src="videoUrl"
        ref="videoRef"
        @loadedmetadata="updateVideoMetadata"
        @pause="onPause"
        @play="onPlay"
      />

      <template v-else>
        <Video :size="64" class="text-muted-foreground mx-auto mb-4" />
        <p class="mb-2 text-lg font-medium">{{ t("project.productTabs.movie.title") }}</p>
        <p class="text-muted-foreground mb-4 text-sm">{{ t("project.productTabs.movie.description") }}</p>
      </template>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <Button
          @click="playVideo"
          :disabled="!videoUrl"
          :data-testid="isPlaying ? 'movie-pause-button' : 'movie-play-button'"
        >
          <Pause v-if="isPlaying" :size="16" />
          <Play v-else :size="16" />
          {{ isPlaying ? t("project.productTabs.movie.pause") : t("project.productTabs.movie.play") }}
        </Button>
        <Button variant="outline" @click="downloadMp4" :disabled="!videoUrl" data-testid="movie-download-button">
          <Video :size="16" class="mr-2" />
          {{ t("project.productTabs.movie.download") }}
        </Button>
      </div>
      <div class="text-muted-foreground mt-2 text-xs" v-if="videoUrl">
        {{
          t("project.productTabs.movie.details", {
            duration: videoMetadata.duration || "-",
            resolution: videoMetadata.resolution || "-",
            size: videoMetadata.fileSize || "-",
          })
        }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Video, Play, Pause } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatDuration } from "@/lib/format";
import { useMulmoEventStore } from "@/store";
import { sleep } from "graphai";

import { downloadFile, useMediaContents } from "./utils";

const { t } = useI18n();

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);

const playVideo = () => {
  if (videoRef.value?.paused) {
    videoRef.value?.play();
  } else {
    videoRef.value?.pause();
  }
};

const onPause = () => {
  isPlaying.value = false;
};

const onPlay = () => {
  isPlaying.value = true;
};

const downloadMp4 = async () => {
  downloadFile(props.projectId, "movie", "video/mp4", "video.mp4");
};

const videoMetadata = ref({
  duration: "",
  resolution: "",
  fileSize: "",
});
const updateMetadata = () => {
  if (!videoRef.value) return;

  videoMetadata.value.fileSize = formatFileSize(bufferLength.value);

  if (!isNaN(videoRef.value.duration)) {
    videoMetadata.value.duration = formatDuration(videoRef.value.duration);
  }

  if (videoRef.value.videoWidth && videoRef.value.videoHeight) {
    videoMetadata.value.resolution = `${videoRef.value.videoWidth}×${videoRef.value.videoHeight}`;
  }
};

const {
  mediaUrl: videoUrl,
  bufferLength,
  updateResources,
} = useMediaContents("movie", "video/mp4", async () => {
  await nextTick();
  await sleep(200);
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
  if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "video" && !mulmoEvent.inSession) {
    await updateResources(props.projectId);
  }
});
</script>
