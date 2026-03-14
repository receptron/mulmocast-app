<template>
  <Dialog :open="isOpen" @update:open="handleDialogOpenChange">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t("project.scriptEditor.beatNavigator.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("project.scriptEditor.beatNavigator.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex h-[600px] flex-col gap-4">
        <ScrollArea class="h-full rounded-md border">
          <div class="grid gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
            <button
              v-for="(beat, index) in beats"
              :key="beat?.id ?? index"
              type="button"
              @click="handleSelect(index)"
              class="border-border hover:bg-accent/50 focus-visible:ring-ring group flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div class="text-muted-foreground text-xs font-medium">{{ `Beat ${index + 1}` }}</div>
              <div class="bg-muted aspect-video w-full overflow-hidden rounded-md">
                <img
                  v-if="imageFiles[beat.id]"
                  :src="mediaUri(imageFiles[beat.id])"
                  class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <FileImage :size="20" class="text-muted-foreground/50" />
                </div>
              </div>
              <p class="text-muted-foreground truncate text-xs">
                {{ beat.text || t("project.scriptEditor.beatNavigator.noText") }}
              </p>
            </button>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FileImage } from "lucide-vue-next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui";
import { useI18n } from "vue-i18n";
import { mediaUri } from "@/lib/utils";
import type { MulmoBeat } from "mulmocast/browser";

const { t } = useI18n();

interface Props {
  beats: MulmoBeat[];
  imageFiles: Record<string, string | null>;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: "navigate", index: number): void;
}>();

const isOpen = ref(false);

const DIALOG_CLOSE_DELAY_MS = 300;

const handleSelect = (index: number) => {
  isOpen.value = false;
  setTimeout(() => {
    emit("navigate", index);
  }, DIALOG_CLOSE_DELAY_MS);
};

const handleDialogOpenChange = (open: boolean) => {
  isOpen.value = open;
};

const open = () => {
  isOpen.value = true;
};

defineExpose({
  open,
});
</script>
