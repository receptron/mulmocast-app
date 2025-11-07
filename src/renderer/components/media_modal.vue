<template>
  <Dialog v-model:open="isOpen">
    <DialogOverlay class="bg-black/10" @click="isOpen = false" />
    <DialogContent class="max-w-3xl border-0 bg-transparent p-0 shadow-none">
      <div class="sr-only">
        <DialogTitle>{{ t("viewer.mediaPreview.modal.dialogTitle") }}</DialogTitle>
        <DialogDescription>{{ t("viewer.mediaPreview.modal.dialogDescription") }}</DialogDescription>
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-center" @click="isOpen = false">
          <img
            v-if="type === 'image'"
            :src="src"
            :alt="alt"
            class="max-h-[80vh] max-w-full cursor-pointer object-contain"
            @click.stop
          />
          <video
            v-else-if="type === 'video'"
            :src="src"
            controls
            autoplay
            class="max-h-[80vh] max-w-full cursor-pointer"
            @click.stop
          />
        </div>
        <div class="flex justify-center">
          <Button variant="secondary" size="sm" @click="handleDownload" class="bg-white/90 shadow-lg hover:bg-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {{ t("ui.actions.download") }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const { t } = useI18n();

interface Props {
  open: boolean;
  type: "image" | "video" | "audio" | "other";
  src: string;
  alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "Media content",
});

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const handleDownload = async () => {
  try {
    // ファイル名を取得（URLから抽出またはデフォルト値）
    const urlParts = props.src.split("/");
    const fileName = urlParts[urlParts.length - 1] || `download.${props.type === "video" ? "mp4" : "png"}`;

    // fetchでデータを取得
    const response = await fetch(props.src);
    const blob = await response.blob();

    // ダウンロードリンクを作成
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};
</script>
