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
      draggable="true"
      class="border-border bg-card text-muted-foreground mt-4 cursor-pointer rounded-md border-2 border-dashed p-6 text-center shadow-sm"
      :class="
        isDragging
          ? 'border-primary bg-primary/5 text-primary shadow-lg'
          : isBeginner && !beat.image.source.path
            ? 'border-2 border-red-600'
            : 'border-border bg-card text-muted-foreground'
      "
    >
      {{ t("ui.common.drophere", { maxSizeMB }) }}
    </div>
    {{ t("ui.common.or") }}
    <div class="flex gap-2">
      <Input
        :placeholder="t('beat.mediaFile.placeholder')"
        v-model="mediaUrl"
        :invalid="!validateURL"
        @blur="save"
        class="flex-1"
      />
      <Button @click="submitUrlImage" :disabled="!fetchEnable" class="shrink-0">
        {{ t("ui.actions.fetch") }}
      </Button>
      <Button @click="openLocalFile" type="button" class="shrink-0">
        {{ t("ui.actions.selectFile") }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { Label, Input, Button } from "@/components/ui";
import type { MulmoBeat } from "mulmocast/browser";
import { isLocalSourceMediaBeat } from "@/lib/beat_util.js";

import { notifyError } from "@/lib/notification";
import { useMediaUrl } from "../../composable/media_url";

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

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      notifyError(t("notify.error.media.tooLarge", { maxSizeMB }));
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = file.type.split("/")[1] ?? "";
    console.log(file.type, mimeType);
    const fileType = mimeType || fileExtension;

    const imageType = (() => {
      if (["jpg", "jpeg", "png"].includes(fileType)) {
        return "image";
      }
      if (["mp4", "quicktime", "webm", "ogg", "mpeg", "mp2t", "mov", "mpg"].includes(fileType)) {
        return "movie";
      }
    })();
    if (!imageType) {
      notifyError(t("notify.error.media.unsupportedType", { fileType }));
      return;
    }
    update("image.type", imageType);
    const extension = imageType === "image" ? fileType : videoSubtypeToExtensions[fileType];

    const reader = new FileReader();
    reader.onload = async () => {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
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
    reader.readAsArrayBuffer(file);
  }
};

const openLocalFile = async () => {
  const fullPath = await window.electronAPI.openFile();
  if (!fullPath) {
    return;
  }

  const projectPath = await window.electronAPI.project.getPath(projectId.value);

  const normalizedFullPath = fullPath.replace(/\\/g, "/");
  const normalizedProjectPath = projectPath.replace(/\\/g, "/");

  let projectRelativePath: string | null = null;
  if (normalizedFullPath.startsWith(normalizedProjectPath)) {
    const relativePath = normalizedFullPath.slice(normalizedProjectPath.length);
    const trimmedRelativePath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
    projectRelativePath = `.${trimmedRelativePath}`;
  }

  console.log("Selected file full path:", fullPath);
  if (projectRelativePath) {
    console.log("Selected file project path:", projectRelativePath);
  } else {
    console.log("Selected file project path: (outside project directory)");
  }
};
</script>
