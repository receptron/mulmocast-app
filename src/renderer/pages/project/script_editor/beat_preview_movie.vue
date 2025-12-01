<template>
  <div>
    <!-- Movie section -->
    <div v-if="enableMovieGenerate">
      <!-- Movie preview -->
      <div class="border-border relative rounded-lg border-2 border-dashed p-4 text-center">
        <!-- Generate movie button -->
        <template v-if="enableMovie">
          <Button
            variant="ghost"
            size="icon"
            class="border-border bg-card hover:bg-muted absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow transition-colors"
            @click="generateMovie"
            :disabled="!enableMovieGenerate || isMovieGenerating || props.toggleTypeMode || disabled"
            :title="t('ui.actions.' + movieGenerateButtonTitle)"
          >
            <Loader2 v-if="isMovieGenerating" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
          </Button>
        </template>
        <template v-if="isMovieGenerating">
          <Loader2 class="mr-1 h-4 w-4 animate-spin" />{{ t("ui.status.generating") }}</template
        >
        <div class="relative cursor-pointer transition-opacity hover:opacity-80" v-else-if="movieFile">
          <video
            :size="64"
            class="text-muted-foreground mx-auto cursor-pointer"
            :src="mediaUri(movieFile)"
            @click="openModal('video', movieFile)"
          />
          <Play
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white"
            :size="40"
            @click="openModal('video', movieFile)"
          />
          <!-- Movie backup button -->
          <div v-if="beat?.moviePrompt !== undefined" class="mt-2">
            <Button variant="outline" size="sm" @click="openMovieBackup" type="button">
              {{ t("beat.movieBackup.openButton") }}
            </Button>
          </div>
        </div>
        <div v-else>
          <Video :size="32" class="text-muted-foreground mx-auto mb-2" />
          <p class="text-muted-foreground text-sm">{{ t("beat.videoPreview") }}</p>
        </div>
      </div>
    </div>
    <!-- Movie backup dialog -->
    <MediaBackupDialog
      v-if="beat?.id"
      ref="movieBackupDialogRef"
      :project-id="projectId"
      :beat-id="beat.id"
      media-type="movie"
      @restored="handleMovieRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { Video, Play, Loader2, Sparkles } from "lucide-vue-next";
import { computed, ref } from "vue";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { Button } from "@/components/ui/button";
import { mediaUri } from "@/lib/utils";
import MediaBackupDialog from "./beat_editors/media_backup_dialog.vue";

interface Props {
  beat: MulmoBeat;
  index: number;
  movieFile: ArrayBuffer | string | null;
  isMovieGenerating: boolean;
  enableMovieGenerate: boolean;
  enableMovie: boolean;
  toggleTypeMode?: boolean;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["openModal", "generateMovie", "movieRestored"]);

const { t } = useI18n();
const route = useRoute();
const projectId = computed(() => route.params.id as string);
const movieBackupDialogRef = ref<{ open: () => void; reload: () => void } | null>(null);

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  emit("openModal", type, src);
};

const generateMovie = () => {
  emit("generateMovie");
};

const openMovieBackup = async () => {
  if (movieBackupDialogRef.value) {
    await movieBackupDialogRef.value.open();
  }
};

const handleMovieRestored = () => {
  emit("movieRestored");
};

const reloadBackupDialog = async () => {
  if (movieBackupDialogRef.value) {
    await movieBackupDialogRef.value.reload();
  }
};

const movieGenerateButtonTitle = computed(() => {
  return props.toggleTypeMode ? "changeBeatTypeFirst" : props.isMovieGenerating ? "generating" : "generateMovie";
});

defineExpose({
  reloadBackupDialog,
});
</script>
