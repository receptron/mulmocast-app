<template>
  <Dialog :open="isOpen" @update:open="handleDialogOpenChange">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t("beat.imageBackup.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("beat.imageBackup.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex h-[600px] flex-col gap-4">
        <ScrollArea class="h-full rounded-md border">
          <div class="grid gap-4 p-4 sm:grid-cols-4">
            <template v-if="isLoading">
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ t("ui.status.loading") }}
              </div>
            </template>
            <template v-else-if="backupImages.length">
              <button
                v-for="backup in backupImages"
                :key="backup.fileName"
                type="button"
                @click="handleSelect(backup)"
                class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div class="bg-muted aspect-video w-full overflow-hidden rounded-md">
                  <img
                    :src="backup.previewUrl"
                    :alt="backup.fileName"
                    class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <p class="text-muted-foreground text-xs">
                    {{ formatTimestamp(backup.timestamp) }}
                  </p>
                </div>
              </button>
            </template>
            <template v-else>
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ loadError || t("beat.imageBackup.empty") }}
              </div>
            </template>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";
import { notifySuccess, notifyError } from "@/lib/notification";

const { t } = useI18n();

interface BackupImage {
  fileName: string;
  timestamp: number;
  imageData: ArrayBuffer;
  previewUrl: string;
}

const props = defineProps<{
  projectId: string;
  beatId: string;
}>();

const emit = defineEmits<{
  (event: "restored"): void;
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const backupImages = ref<BackupImage[]>([]);
const objectUrls = ref<string[]>([]);

const formatTimestamp = (timestamp: number) => {
  const str = timestamp.toString();
  // Format: YYYYMMDDHHMMSS
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  const hour = str.substring(8, 10);
  const minute = str.substring(10, 12);
  const second = str.substring(12, 14);
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
};

const toArrayBuffer = (data: unknown): ArrayBuffer | null => {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  if (typeof data === "object" && data !== null && "type" in data && data.type === "Buffer" && "data" in data) {
    const uint8Array = new Uint8Array(data.data as number[]);
    return uint8Array.buffer;
  }
  return null;
};

const loadBackups = async () => {
  if (!props.projectId || !props.beatId) {
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    const result = await window.electronAPI.mulmoHandler("mulmoImageBackupList", props.projectId, props.beatId);

    // Check if result is an error object
    if (result && typeof result === "object" && "error" in result) {
      loadError.value = t("beat.imageBackup.loadError");
      return;
    }

    // Check if result is an array
    if (!Array.isArray(result)) {
      loadError.value = t("beat.imageBackup.loadError");
      return;
    }

    // Clean up previous URLs
    objectUrls.value.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.value = [];

    backupImages.value = result
      .map((item: { fileName: string; timestamp: number; imageData: unknown }) => {
        const arrayBuffer = toArrayBuffer(item.imageData);
        if (!arrayBuffer) return null;

        const blob = new Blob([arrayBuffer], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        objectUrls.value.push(url);

        return {
          fileName: item.fileName,
          timestamp: item.timestamp,
          imageData: arrayBuffer,
          previewUrl: url,
        };
      })
      .filter((item): item is BackupImage => item !== null);
  } catch {
    loadError.value = t("beat.imageBackup.loadError");
  } finally {
    isLoading.value = false;
  }
};

const handleSelect = async (backup: BackupImage) => {
  try {
    const result = (await window.electronAPI.mulmoHandler(
      "mulmoImageRestoreBackup",
      props.projectId,
      props.beatId,
      backup.fileName,
    )) as { result: boolean; error?: string };

    if (result.result) {
      notifySuccess(t("beat.imageBackup.restored"));
      isOpen.value = false;
      emit("restored");
    } else {
      notifyError(t("beat.imageBackup.restoreError", { error: result.error || "Unknown error" }));
    }
  } catch (error: unknown) {
    notifyError(t("beat.imageBackup.restoreError", { error: String(error) }));
  }
};

const handleDialogOpenChange = (open: boolean) => {
  isOpen.value = open;
  if (!open) {
    // Clean up URLs when closing
    objectUrls.value.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.value = [];
    backupImages.value = [];
  }
};

const open = async () => {
  isOpen.value = true;
  await loadBackups();
};

defineExpose({
  open,
});
</script>
