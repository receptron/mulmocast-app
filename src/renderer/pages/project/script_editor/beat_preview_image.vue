<template>
  <div>
    <!-- Image section -->
    <div class="mb-4">
      <!-- Image preview -->
      <div
        class="border-border relative rounded-lg border-2 border-dashed p-4 text-center"
        :key="`beat_editor_${beat.id ?? index}`"
      >
        <!-- Generate image button -->
        <template v-if="shouldShowGenerateButton">
          <Button
            variant="ghost"
            size="icon"
            class="border-border bg-card hover:bg-muted absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow transition-colors"
            @click="generateImage"
            :disabled="isImageGenerating || isHtmlGenerating || props.toggleTypeMode || disabled"
            :title="t('ui.actions.' + imageGenerateButtonTitle)"
          >
            <Loader2 v-if="isImageGenerating || isHtmlGenerating" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
          </Button>
        </template>
        <template v-if="beat?.image?.type === 'beat'">
          <template v-if="referencedMovieFile">
            <!-- Referenced video preview -->
            <video
              :size="64"
              class="text-muted-foreground mx-auto mb-4 cursor-pointer transition-opacity hover:opacity-80"
              controls
              :src="mediaUri(referencedMovieFile)"
              @click="openModal('video', referencedMovieFile)"
            />
          </template>
          <template v-else-if="referencedImageFile">
            <!-- Referenced image preview -->
            <img
              :src="mediaUri(referencedImageFile)"
              class="cursor-pointer transition-opacity hover:opacity-80"
              @click="openModal('image', referencedImageFile)"
            />
          </template>
          <template v-else>
            <FileImage :size="32" class="text-muted-foreground mx-auto mb-2" />
            <p class="text-muted-foreground text-sm">
              {{ t("project.scriptEditor.reference.mode") }}
            </p>
          </template>
        </template>
        <template v-else-if="beat?.image?.type === 'voice_over'">
          <div class="text-muted-foreground text-center text-sm">
            <p class="font-medium">{{ t("beat.voice_over.title") }}</p>
            <div class="whitespace-pre-line">
              {{ t("beat.voice_over.description") }}
            </div>
          </div>
        </template>
        <template v-else-if="isImageGenerating || isHtmlGenerating">
          <!-- TODO update design -->
          {{ t("ui.status.generating") }}
        </template>
        <template v-else-if="movieFile && beat?.image?.type === 'movie'">
          <!-- video pewview -->
          <video
            :size="64"
            class="text-muted-foreground mx-auto mb-4 cursor-pointer transition-opacity hover:opacity-80"
            controls
            :src="mediaUri(movieFile)"
            @click="openModal('video', movieFile)"
          />
        </template>
        <template v-else-if="imageFile">
          <!-- image pewview -->
          <img
            :src="mediaUri(imageFile)"
            class="cursor-pointer transition-opacity hover:opacity-80"
            @click="openModal('image', imageFile)"
          />
          <!-- Image backup button -->
          <div v-if="beat?.imagePrompt !== undefined" class="mt-2">
            <Button variant="outline" size="sm" @click="openImageBackup" type="button">
              {{ t("beat.imageBackup.openButton") }}
            </Button>
          </div>
        </template>
        <template v-else>
          <Video v-if="beat?.image?.type === 'movie'" :size="32" class="text-muted-foreground mx-auto mb-2" />
          <FileImage v-else :size="32" class="text-muted-foreground mx-auto mb-2" />
          <p class="text-muted-foreground text-sm">
            {{ t("beat." + (beat?.image?.type === "movie" ? "videoPreview" : "imagePreview")) }}
          </p>
        </template>
      </div>
    </div>
    <!-- Image backup dialog -->
    <MediaBackupDialog
      v-if="beat?.id"
      ref="imageBackupDialogRef"
      :project-id="projectId"
      :beat-id="beat.id"
      media-type="image"
      @restored="handleImageRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { FileImage, Video, Loader2, Sparkles } from "lucide-vue-next";
import { computed, ref } from "vue";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { Button } from "@/components/ui/button";
import { mediaUri } from "@/lib/utils";
import { isLocalSourceMediaBeat } from "@/lib/beat_util";
import MediaBackupDialog from "./beat_editors/media_backup_dialog.vue";

type ImageFile = ArrayBuffer | string | null;

interface Props {
  beat: MulmoBeat;
  index: number;
  imageFile: ImageFile;
  movieFile: ImageFile;
  referencedImageFile?: ImageFile;
  referencedMovieFile?: ImageFile;
  isImageGenerating: boolean;
  isHtmlGenerating: boolean;
  toggleTypeMode?: boolean;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["openModal", "generateImage", "imageRestored"]);

const { t } = useI18n();
const route = useRoute();
const projectId = computed(() => route.params.id as string);
const imageBackupDialogRef = ref<{ open: () => void; reload: () => void } | null>(null);

// Computed properties for button visibility
const shouldShowGenerateButton = computed(() => {
  return (
    props.beat?.image?.type !== "beat" &&
    props.beat?.image?.type !== "voice_over" &&
    !(
      ["image", "movie"].includes(props.beat?.image?.type || "") &&
      props.beat?.image &&
      isLocalSourceMediaBeat(props.beat)
    )
  );
});

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  emit("openModal", type, src);
};

const generateImage = () => {
  emit("generateImage");
};

const imageGenerateButtonTitle = computed(() => {
  return props.toggleTypeMode
    ? "changeBeatTypeFirst"
    : props.isImageGenerating || props.isHtmlGenerating
      ? "generating"
      : "generateImage";
});

const openImageBackup = async () => {
  if (imageBackupDialogRef.value) {
    await imageBackupDialogRef.value.open();
  }
};

const handleImageRestored = () => {
  emit("imageRestored");
};

const reloadBackupDialog = async () => {
  if (imageBackupDialogRef.value) {
    await imageBackupDialogRef.value.reload();
  }
};

defineExpose({
  reloadBackupDialog,
});
</script>
