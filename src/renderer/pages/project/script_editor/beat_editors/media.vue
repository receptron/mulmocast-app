<template>
  <div>
    <Label class="mb-1 block">{{ t("beat.mediaFile.label") }}</Label>
    <div
      v-if="isLocalSourceMediaBeat(beat)"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="
        (e) => {
          isDragging = false;
          handleDrop(e);
        }
      "
      @click="selectLocalMedia"
      @keydown.enter.prevent="selectLocalMedia"
      @keydown.space.prevent="selectLocalMedia"
      draggable="true"
      class="border-border bg-card text-muted-foreground mt-4 cursor-pointer rounded-md border-2 border-dashed p-6 text-center shadow-sm"
      :class="
        isDragging
          ? 'border-primary bg-primary/5 text-primary shadow-lg'
          : isBeginner && !beat.image.source.path
            ? 'border-2 border-red-600'
            : 'border-border bg-card text-muted-foreground'
      "
      role="button"
      tabindex="0"
    >
      {{ t("ui.common.drophere", { maxSizeMB }) }}
    </div>
    {{ t("ui.common.or") }}
    <div class="mt-2 flex flex-wrap gap-2">
      <Input
        :placeholder="t('beat.mediaFile.placeholder')"
        v-model="mediaUrl"
        :invalid="!validateURL"
        @blur="save"
        class="min-w-0 flex-1"
      />
      <Button @click="submitUrlImage" :disabled="!fetchEnable" class="shrink-0">
        {{ t("ui.actions.fetch") }}
      </Button>
    </div>
    <div class="mt-2">
      <Button @click="openMediaLibrary" type="button" class="shrink-0">
        {{ t("ui.actions.openMediaLibrary") }}
      </Button>
    </div>

    <MediaLibraryDialog ref="mediaLibraryRef" :project-id="projectId" @select="selectScriptImage" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { Label, Input, Button } from "@/components/ui";
import type { MulmoBeat, MulmoImageAsset } from "mulmocast/browser";
import { isLocalSourceMediaBeat } from "@/lib/beat_util.js";

import { notifyError } from "@/lib/notification";
import { readFileAsArrayBuffer, type BinaryFileData } from "@/lib/file";
import { useMediaUrl } from "../../composable/media_url";
import MediaLibraryDialog, {
  type MediaLibraryDialogExposed,
  type ProjectScriptMedia,
} from "./media_library_dialog.vue";

import { sleep } from "graphai";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const route = useRoute();
const projectId = computed(() => route.params.id as string);

interface Props {
  beat: MulmoBeat;
  index: number;
  isBeginner: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["update", "save", "updateImageData", "generateImageOnlyImage"]);

const isDragging = ref(false);
const mediaLibraryRef = ref<MediaLibraryDialogExposed | null>(null);

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const save = () => {
  emit("save");
};

// image fetch
const { imageFetching, mediaUrl, validateURL, fetchEnable } = useMediaUrl();

const submitUrlImage = async () => {
  try {
    imageFetching.value = true;
    const res = (await window.electronAPI.mulmoHandler(
      "mulmoImageFetchURL",
      projectId.value,
      props.index,
      mediaUrl.value,
    )) as { result: boolean; imageType: string; path: string };
    if (res.result) {
      const imageData = {
        type: res.imageType,
        source: {
          kind: "path",
          path: "./" + res.path,
        },
      };
      emit("updateImageData", imageData, () => {
        emit("generateImageOnlyImage");
      });
      mediaUrl.value = "";
    }
  } catch (error) {
    console.log(error);
  }
  imageFetching.value = false;
};

const videoSubtypeToExtensions = {
  mp4: "mp4",
  quicktime: "mov",
  webm: "webm",
  ogg: "ogv",
  mpeg: "mpeg",
  mp2t: "ts",
  mov: "mov",
  mpg: "mpg",
};

const maxSizeMB = 50;

const processMediaFile = async (fileData: BinaryFileData) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  if (fileData.size > maxSize) {
    notifyError(t("notify.error.media.tooLarge", { maxSizeMB }));
    return;
  }

  const fileExtension = fileData.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = fileData.type.split("/")[1] ?? "";
  const fileType = mimeType || fileExtension;

  const imageType = (() => {
    if (["jpg", "jpeg", "png"].includes(fileType)) {
      return "image";
    }
    if (["mp4", "quicktime", "webm", "ogg", "mpeg", "mp2t", "mov", "mpg"].includes(fileType)) {
      return "movie";
    }
    return undefined;
  })();
  if (!imageType) {
    notifyError(t("notify.error.media.unsupportedType", { fileType }));
    return;
  }

  const extension =
    imageType === "image" ? fileType : videoSubtypeToExtensions[fileType as keyof typeof videoSubtypeToExtensions];
  if (!extension) {
    notifyError(t("notify.error.media.unsupportedType", { fileType }));
    return;
  }

  update("image.type", imageType);

  const uint8Array = fileData.buffer instanceof Uint8Array ? fileData.buffer : new Uint8Array(fileData.buffer);
  const path = await window.electronAPI.mulmoHandler(
    "mulmoImageUpload",
    projectId.value,
    props.index,
    [...uint8Array],
    extension,
  );
  const imageData = {
    type: imageType,
    source: {
      kind: "path",
      path: "./" + path,
    },
  };
  await sleep(50);
  emit("updateImageData", imageData, () => {
    emit("generateImageOnlyImage");
  });
};

const handleDrop = async (eventOrFileData: DragEvent | BinaryFileData) => {
  if ("dataTransfer" in eventOrFileData) {
    const files = eventOrFileData.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      try {
        const buffer = await readFileAsArrayBuffer(file);
        await processMediaFile({
          name: file.name,
          size: file.size,
          type: file.type,
          buffer,
        });
      } catch (error) {
        console.error(error);
      }
    }
    return;
  }

  try {
    await processMediaFile(eventOrFileData);
  } catch (error) {
    console.error(error);
  }
};

const selectLocalMedia = async () => {
  try {
    const filePath = await window.electronAPI.dialog.openFile("media");
    if (!filePath) {
      return;
    }
    const fileData = await window.electronAPI.file.readBinary(filePath);
    if (!fileData) {
      return;
    }
    await handleDrop(fileData);
  } catch (error) {
    console.error(error);
  }
};

const openMediaLibrary = async () => {
  if (mediaLibraryRef.value) {
    await mediaLibraryRef.value.open();
  }
};

const selectScriptImage = (media: ProjectScriptMedia) => {
  const projectRelativePath = media.projectRelativePath.startsWith("./")
    ? media.projectRelativePath
    : `./${media.projectRelativePath.replace(/^\/+/u, "")}`;

  const imageData: MulmoImageAsset = {
    type: media.mediaType,
    source: {
      kind: "path",
      path: projectRelativePath,
    },
  };

  emit("updateImageData", imageData, () => {
    emit("generateImageOnlyImage");
  });
};
</script>
