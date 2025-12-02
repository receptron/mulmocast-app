<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ t("parameters.audioParams.bgmLibrary.title") }}</DialogTitle>
        <DialogDescription>{{ t("parameters.audioParams.bgmLibrary.description") }}</DialogDescription>
      </DialogHeader>

      <div class="max-h-[400px] space-y-2 overflow-y-auto py-4">
        <div v-if="bgmList.length === 0" class="text-muted-foreground py-8 text-center text-sm">
          {{ t("parameters.audioParams.bgmLibrary.empty") }}
        </div>

        <div
          v-for="bgm in bgmList"
          :key="bgm.id"
          @click="selectBgm(bgm)"
          class="border-border hover:border-primary hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
        >
          <div class="flex flex-1 items-center space-x-3">
            <Music class="text-muted-foreground h-5 w-5" />
            <div class="flex-1">
              <div class="font-medium">{{ bgm.title }}</div>
              <p class="text-muted-foreground text-xs">{{ formatDate(bgm.createdAt) }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <Badge variant="secondary" class="text-xs">{{ bgm.duration }}</Badge>
            <Button variant="ghost" size="icon" @click.stop="togglePlay(bgm)">
              <Play v-if="!bgm.playing" class="h-4 w-4" />
              <Pause v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">{{ t("ui.actions.cancel") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Music, Play, Pause } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import { Button, Badge } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bufferToUrl } from "@/lib/utils";
import type { BgmMetadata } from "@/types";

const { t } = useI18n();

const emit = defineEmits<{
  select: [bgm: BgmMetadata];
}>();

interface BgmItem extends BgmMetadata {
  playing: boolean;
  audioUrl?: string;
}

const isOpen = ref(false);
const bgmList = ref<BgmItem[]>([]);
const audioElement = ref<HTMLAudioElement | null>(null);

const open = async () => {
  isOpen.value = true;
  await loadBgmList();
};

const loadBgmList = async () => {
  try {
    const items = (await window.electronAPI.mulmoHandler("bgmList")) as BgmMetadata[];
    bgmList.value = items.map((item) => ({
      ...item,
      playing: false,
    }));
  } catch (error) {
    console.error("Failed to load BGM list:", error);
  }
};

const selectBgm = (bgm: BgmItem) => {
  // Stop playing
  if (audioElement.value) {
    audioElement.value.pause();
  }
  bgmList.value.forEach((b) => {
    b.playing = false;
  });

  emit("select", bgm);
  isOpen.value = false;
};

const togglePlay = async (bgm: BgmItem) => {
  // Stop all other playing audio
  bgmList.value.forEach((b) => {
    if (b.id !== bgm.id) {
      b.playing = false;
    }
  });

  if (bgm.playing) {
    // Pause
    if (audioElement.value) {
      audioElement.value.pause();
    }
    bgm.playing = false;
  } else {
    // Play
    try {
      if (!bgm.audioUrl) {
        // Load audio file
        const buffer = (await window.electronAPI.mulmoHandler("bgmAudioFile", bgm.id)) as ArrayBuffer | null;
        if (buffer) {
          bgm.audioUrl = bufferToUrl(new Uint8Array(buffer), "audio/mpeg");
        }
      }

      if (bgm.audioUrl) {
        if (!audioElement.value) {
          audioElement.value = new Audio();
          audioElement.value.addEventListener("ended", () => {
            bgmList.value.forEach((b) => {
              b.playing = false;
            });
          });
        }

        audioElement.value.src = bgm.audioUrl;
        await audioElement.value.play();
        bgm.playing = true;
      }
    } catch (error) {
      console.error("Failed to play BGM:", error);
    }
  }
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format("YYYY/MM/DD HH:mm");
};

// Stop audio when dialog closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    if (audioElement.value) {
      audioElement.value.pause();
    }
    bgmList.value.forEach((b) => {
      b.playing = false;
    });
  }
});

defineExpose({
  open,
});
</script>
