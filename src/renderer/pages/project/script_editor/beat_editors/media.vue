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
      <Button @click="openMediaLibrary" type="button" class="shrink-0">
        {{ t("ui.actions.openMediaLibrary") }}
      </Button>
    </div>

    <Dialog :open="isLibraryOpen" @update:open="handleLibraryOpenChange">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{{ t("beat.mediaFile.libraryTitle") }}</DialogTitle>
          <DialogDescription>
            {{ t("beat.mediaFile.libraryDescription") }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex h-[360px] flex-col gap-4">
          <ScrollArea class="h-full rounded-md border">
            <div class="grid gap-4 p-4 sm:grid-cols-2">
              <template v-if="isLoadingImages">
                <div class="col-span-full flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {{ t("ui.status.loading") }}
                </div>
              </template>
              <template v-else-if="scriptImages.length">
                <button
                  v-for="image in scriptImages"
                  :key="image.fullPath"
                  type="button"
                  @click="selectScriptImage(image)"
                  class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <div class="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    <img
                      :src="image.previewUrl"
                      :alt="image.fileName"
                      class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </div>
                  <p class="truncate text-sm font-medium">{{ image.fileName }}</p>
                  <p class="text-xs text-muted-foreground">{{ image.projectRelativePath }}</p>
                </button>
              </template>
              <template v-else>
                <div class="col-span-full flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {{ imagesLoadError || t("beat.mediaFile.libraryEmpty") }}
                </div>
              </template>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRoute } from "vue-router";
import { Label, Input, Button, ScrollArea } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MulmoBeat, MulmoImageAsset } from "mulmocast/browser";
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

interface ProjectScriptImage {
  fileName: string;
  fullPath: string;
  projectRelativePath: string;
  imageData: ArrayBuffer;
}

interface ScriptImageWithPreview extends ProjectScriptImage {
  previewUrl: string;
}

const scriptImages = ref<ScriptImageWithPreview[]>([]);
const isLibraryOpen = ref(false);
const isLoadingImages = ref(false);
const imagesLoadError = ref<string | null>(null);

const previewMimeType = "image/png";

const clearScriptImages = () => {
  scriptImages.value.forEach((image) => {
    URL.revokeObjectURL(image.previewUrl);
  });
  scriptImages.value = [];
};

const toArrayBuffer = (data: unknown): ArrayBuffer | null => {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  if (Array.isArray(data)) {
    return Uint8Array.from(data).buffer;
  }
  return null;
};

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

const fetchScriptImages = async () => {
  const id = projectId.value;
  if (!id) {
    clearScriptImages();
    return;
  }

  isLoadingImages.value = true;
  imagesLoadError.value = null;

  try {
    const response = (await window.electronAPI.project.listScriptImages(id)) as
      | ProjectScriptImage[]
      | null
      | undefined;
    if (Array.isArray(response)) {
      clearScriptImages();
      const mapped = response
        .map((image) => {
          const arrayBuffer = toArrayBuffer(image.imageData);
          if (!arrayBuffer) {
            console.warn("Received invalid image data for", image.fullPath);
            return null;
          }
          const blob = new Blob([arrayBuffer], { type: previewMimeType });
          const previewUrl = URL.createObjectURL(blob);
          return {
            ...image,
            imageData: arrayBuffer,
            previewUrl,
          } satisfies ScriptImageWithPreview;
        })
        .filter((image): image is ScriptImageWithPreview => image !== null);

      scriptImages.value = mapped;
    } else {
      clearScriptImages();
    }
  } catch (error) {
    console.error("Failed to load project script images", error);
    imagesLoadError.value = t("beat.mediaFile.libraryLoadError");
    clearScriptImages();
  } finally {
    isLoadingImages.value = false;
  }
};

const handleLibraryOpenChange = async (open: boolean) => {
  isLibraryOpen.value = open;
  if (open) {
    await fetchScriptImages();
  }
};

const openMediaLibrary = async () => {
  await handleLibraryOpenChange(true);
};

const selectScriptImage = (image: ProjectScriptImage) => {
  const projectRelativePath = image.projectRelativePath.startsWith("./")
    ? image.projectRelativePath
    : `./${image.projectRelativePath.replace(/^\/+/u, "")}`;

  const imageData: MulmoImageAsset = {
    type: "image",
    source: {
      kind: "path",
      path: projectRelativePath,
    },
  };

  isLibraryOpen.value = false;

  emit("updateImageData", imageData, () => {
    emit("generateImageOnlyImage");
  });
};

onBeforeUnmount(() => {
  clearScriptImages();
});
</script>
