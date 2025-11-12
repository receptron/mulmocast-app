<template>
  <Dialog :open="isOpen" @update:open="handleDialogOpenChange">
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
            <template v-if="isLoading">
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ t("ui.status.loading") }}
              </div>
            </template>
            <template v-else-if="images.length">
              <button
                v-for="image in images"
                :key="image.fullPath"
                type="button"
                @click="handleSelect(image)"
                class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div class="bg-muted aspect-video w-full overflow-hidden rounded-md">
                  <img
                    :src="image.previewUrl"
                    :alt="image.fileName"
                    class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <p class="truncate text-sm font-medium">{{ image.fileName }}</p>
                <p class="text-muted-foreground text-xs">{{ image.projectRelativePath }}</p>
              </button>
            </template>
            <template v-else>
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ loadError || t("beat.mediaFile.libraryEmpty") }}
              </div>
            </template>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

export interface ProjectScriptImage {
  fileName: string;
  fullPath: string;
  projectRelativePath: string;
  imageData: ArrayBuffer;
}

interface ScriptImageWithPreview extends ProjectScriptImage {
  previewUrl: string;
}

const props = defineProps<{
  projectId: string | null | undefined;
}>();

const emit = defineEmits<{
  (event: "select", image: ProjectScriptImage): void;
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const images = ref<ScriptImageWithPreview[]>([]);
let fetchRequestId = 0;

const previewMimeType = "image/png";

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

const clearImages = () => {
  images.value.forEach((image) => {
    URL.revokeObjectURL(image.previewUrl);
  });
  images.value = [];
};

const fetchScriptImages = async () => {
  const requestId = ++fetchRequestId;

  if (!props.projectId) {
    clearImages();
    loadError.value = null;
    if (requestId === fetchRequestId) {
      isLoading.value = false;
    }
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    const response = (await window.electronAPI.project.listScriptImages(props.projectId)) as
      | ProjectScriptImage[]
      | null
      | undefined;

    if (requestId !== fetchRequestId) {
      return;
    }

    if (Array.isArray(response)) {
      clearImages();
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

      images.value = mapped;
    } else {
      clearImages();
    }
  } catch (error) {
    console.error("Failed to load project script images", error);
    if (requestId === fetchRequestId) {
      loadError.value = t("beat.mediaFile.libraryLoadError");
      clearImages();
    }
  } finally {
    if (requestId === fetchRequestId) {
      isLoading.value = false;
    }
  }
};

const closeDialog = () => {
  if (!isOpen.value) {
    return;
  }
  fetchRequestId += 1;
  isOpen.value = false;
  isLoading.value = false;
  loadError.value = null;
  clearImages();
};

const openDialog = async () => {
  if (!isOpen.value) {
    isOpen.value = true;
  }
  await fetchScriptImages();
};

const handleDialogOpenChange = (open: boolean) => {
  if (!open) {
    closeDialog();
  }
};

const handleSelect = (image: ScriptImageWithPreview) => {
  emit("select", {
    fileName: image.fileName,
    fullPath: image.fullPath,
    projectRelativePath: image.projectRelativePath,
    imageData: image.imageData,
  });
  closeDialog();
};

watch(
  () => props.projectId,
  () => {
    if (isOpen.value) {
      void fetchScriptImages();
    } else {
      fetchRequestId += 1;
      clearImages();
      loadError.value = null;
    }
  },
);

onBeforeUnmount(() => {
  clearImages();
});

export interface MediaLibraryDialogExposed {
  open: () => Promise<void>;
  close: () => void;
}

defineExpose<MediaLibraryDialogExposed>({
  open: openDialog,
  close: closeDialog,
});
</script>
