<template>
  <Dialog :open="isOpen" @update:open="handleDialogOpenChange">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t("beat.html_tailwind.materialsDialogTitle") }}</DialogTitle>
        <DialogDescription>
          {{ t("beat.html_tailwind.materialsDialogDescription") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex h-[400px] flex-col gap-4">
        <ScrollArea class="h-full rounded-md border">
          <div class="grid gap-4 p-4 sm:grid-cols-3">
            <template v-if="isLoading">
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ t("ui.status.loading") }}
              </div>
            </template>
            <template v-else-if="imageItems.length">
              <button
                v-for="item in imageItems"
                :key="item.key"
                type="button"
                @click="handleSelect(item.key)"
                class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div class="bg-muted aspect-video w-full overflow-hidden rounded-md">
                  <img
                    v-if="item.previewUrl"
                    :src="item.previewUrl"
                    :alt="item.key"
                    class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <div v-else class="text-muted-foreground flex h-full items-center justify-center text-xs">
                    {{ t("beat.html_tailwind.noPreview") }}
                  </div>
                </div>
                <p class="line-clamp-2 text-sm font-medium break-all">{{ item.key }}</p>
              </button>
            </template>
            <template v-else>
              <div class="text-muted-foreground col-span-full flex items-center justify-center py-8 text-sm">
                {{ t("beat.html_tailwind.noMaterials") }}
              </div>
            </template>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";
import { bufferToUrl } from "@/lib/utils";

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
  materialKeys: string[];
}>();

const emit = defineEmits<{
  (event: "select", key: string): void;
}>();

interface ImageItem {
  key: string;
  previewUrl: string | null;
}

const isOpen = ref(false);
const isLoading = ref(false);
const imageItems = ref<ImageItem[]>([]);

const clearItems = () => {
  imageItems.value.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
  imageItems.value = [];
};

const fetchImages = async () => {
  isLoading.value = true;
  try {
    const refs = (await window.electronAPI.mulmoHandler("mulmoReferenceImagesFiles", props.projectId)) as Record<
      string,
      ArrayBuffer | Uint8Array
    >;
    clearItems();
    imageItems.value = props.materialKeys.map((key) => ({
      key,
      previewUrl: refs[key]
        ? bufferToUrl(refs[key] instanceof Uint8Array ? refs[key] : new Uint8Array(refs[key]))
        : null,
    }));
  } catch (error) {
    console.error("Failed to load material images", error);
    clearItems();
  } finally {
    isLoading.value = false;
  }
};

const openDialog = async () => {
  isOpen.value = true;
  await fetchImages();
};

const closeDialog = () => {
  isOpen.value = false;
  isLoading.value = false;
  clearItems();
};

const handleDialogOpenChange = (open: boolean) => {
  if (!open) {
    closeDialog();
  }
};

const handleSelect = (key: string) => {
  emit("select", key);
  closeDialog();
};

onBeforeUnmount(() => {
  clearItems();
});

export interface MaterialsImageDialogExposed {
  open: () => Promise<void>;
  close: () => void;
}

defineExpose<MaterialsImageDialogExposed>({
  open: openDialog,
  close: closeDialog,
});
</script>
