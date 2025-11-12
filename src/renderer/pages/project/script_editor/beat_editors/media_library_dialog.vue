<template>
  <Dialog :open="open" @update:open="handleOpenChange">
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
              <div class="col-span-full flex items-center justify-center py-8 text-sm text-muted-foreground">
                {{ t("ui.status.loading") }}
              </div>
            </template>
            <template v-else-if="images.length">
              <button
                v-for="image in images"
                :key="image.fullPath"
                type="button"
                @click="handleSelect(image)"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";

import type { ScriptImageWithPreview } from "./media.vue";

const { t } = useI18n();

defineProps<{
  open: boolean;
  images: ScriptImageWithPreview[];
  isLoading: boolean;
  loadError: string | null;
}>();

const emit = defineEmits<{
  (event: "update:open", open: boolean): void;
  (event: "select", image: ScriptImageWithPreview): void;
}>();

const handleOpenChange = (open: boolean) => {
  emit("update:open", open);
};

const handleSelect = (image: ScriptImageWithPreview) => {
  emit("select", image);
};
</script>
