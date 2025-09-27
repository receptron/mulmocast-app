<template>
  <Dialog :open="modalStore.isOpenUpdateModal" @update:open="onUpdateOpen">
    <DialogContent class="flex max-w-md flex-col">
      <DialogHeader>
        <DialogTitle class="text-center text-2xl font-bold">
          {{ t("notify.updater.downloaded") }}
        </DialogTitle>
        <DialogDescription class="text-muted-foreground text-center">
          {{ t("notify.updater.downloadedDesc") }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="releaseName || releaseNotes" class="max-h-60 overflow-auto rounded-md border p-3 text-sm">
        <div v-if="releaseName" class="mb-2 font-medium">{{ releaseName }}</div>
        <pre v-if="releaseNotes" class="whitespace-pre-wrap">{{ releaseNotes }}</pre>
      </div>

      <DialogFooter class="flex flex-shrink-0 justify-end gap-2 border-t pt-4">
        <Button variant="outline" @click="handleLater">{{ t("notify.updater.later") }}</Button>
        <Button @click="handleRestart">{{ t("notify.updater.restartNow") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useModalStore } from "@/store";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const { t } = useI18n();
const modalStore = useModalStore();

const releaseName = computed(() => modalStore.updateReleaseName);
const releaseNotes = computed(() => modalStore.updateReleaseNotes);

const handleLater = () => {
  modalStore.hideUpdateModal();
};

const handleRestart = () => {
  window.electronAPI.updater.restart();
};

const onUpdateOpen = (open: boolean) => {
  if (!open) handleLater();
};
</script>
