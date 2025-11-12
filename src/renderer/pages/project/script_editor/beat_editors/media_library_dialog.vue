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
            <template v-else-if="mediaItems.length">
              <button
                v-for="media in mediaItems"
                :key="media.fullPath"
                type="button"
                @click="handleSelect(media)"
                class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div class="bg-muted aspect-video w-full overflow-hidden rounded-md">
                  <img
                    v-if="media.mediaType === 'image'"
                    :src="media.previewUrl"
                    :alt="media.fileName"
                    class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <video
                    v-else
                    :src="media.previewUrl"
                    :title="media.fileName"
                    class="h-full w-full object-cover"
                    muted
                    playsinline
                    loop
                    controls
                  />
                </div>
                <p class="truncate text-sm font-medium">{{ media.fileName }}</p>
                <p class="text-muted-foreground text-xs">{{ media.projectRelativePath }}</p>
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
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

export interface ProjectScriptMedia {
  fileName: string;
  fullPath: string;
  projectRelativePath: string;
  data: ArrayBuffer;
  mediaType: "image" | "movie";
  mimeType: string;
}

interface ScriptMediaWithPreview extends ProjectScriptMedia {
  previewUrl: string;
}

const props = defineProps<{
  projectId: string | null | undefined;
  allowedMediaTypes?: ("image" | "movie")[];
}>();

const emit = defineEmits<{
  (event: "select", media: ProjectScriptMedia): void;
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const mediaItems = ref<ScriptMediaWithPreview[]>([]);
let fetchRequestId = 0;

const allowedMediaTypes = computed<("image" | "movie")[]>(() => {
  const types = props.allowedMediaTypes;
  if (!types || types.length === 0) {
    return ["image", "movie"];
  }
  return types;
});

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

const clearMediaItems = () => {
  mediaItems.value.forEach((media) => {
    URL.revokeObjectURL(media.previewUrl);
  });
  mediaItems.value = [];
};

const fetchScriptMedia = async () => {
  const requestId = ++fetchRequestId;

  if (!props.projectId) {
    clearMediaItems();
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
      | ProjectScriptMedia[]
      | null
      | undefined;

    if (requestId !== fetchRequestId) {
      return;
    }

    if (Array.isArray(response)) {
      clearMediaItems();
      const mapped = response
        .filter((media) => allowedMediaTypes.value.includes(media.mediaType))
        .map((media) => {
          const arrayBuffer = toArrayBuffer(media.data);
          if (!arrayBuffer) {
            console.warn("Received invalid media data for", media.fullPath);
            return null;
          }
          const blob = new Blob([arrayBuffer], { type: media.mimeType });
          const previewUrl = URL.createObjectURL(blob);
          return {
            ...media,
            data: arrayBuffer,
            previewUrl,
          } satisfies ScriptMediaWithPreview;
        })
        .filter((media): media is ScriptMediaWithPreview => media !== null);

      mediaItems.value = mapped;
    } else {
      clearMediaItems();
    }
  } catch (error) {
    console.error("Failed to load project script media", error);
    if (requestId === fetchRequestId) {
      loadError.value = t("beat.mediaFile.libraryLoadError");
      clearMediaItems();
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
  clearMediaItems();
};

const openDialog = async () => {
  if (!isOpen.value) {
    isOpen.value = true;
  }
  await fetchScriptMedia();
};

const handleDialogOpenChange = (open: boolean) => {
  if (!open) {
    closeDialog();
  }
};

const handleSelect = (media: ScriptMediaWithPreview) => {
  emit("select", {
    fileName: media.fileName,
    fullPath: media.fullPath,
    projectRelativePath: media.projectRelativePath,
    data: media.data,
    mediaType: media.mediaType,
    mimeType: media.mimeType,
  });
  closeDialog();
};

watch(
  () => props.projectId,
  () => {
    if (isOpen.value) {
      void fetchScriptMedia();
    } else {
      fetchRequestId += 1;
      clearMediaItems();
      loadError.value = null;
    }
  },
);

onBeforeUnmount(() => {
  clearMediaItems();
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
