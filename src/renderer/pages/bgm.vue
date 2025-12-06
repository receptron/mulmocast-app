<template>
  <Layout>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <!-- Header Section -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ t("bgm.title") }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">{{ t("bgm.description") }}</p>
          </div>
          <Button @click="openCreateDialog" class="flex items-center space-x-2">
            <Plus class="h-5 w-5" />
            <span>{{ t("bgm.createNew") }}</span>
          </Button>
        </div>

        <!-- BGM List -->
        <div v-if="bgmList.length === 0 && bgmStore.generatingBgms.length === 0" class="py-16 text-center">
          <div class="space-y-4">
            <Music class="text-muted-foreground mx-auto h-16 w-16" />
            <h2 class="text-foreground text-xl font-semibold">{{ t("bgm.empty.title") }}</h2>
            <p class="text-muted-foreground">{{ t("bgm.empty.description") }}</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <!-- Generating BGMs -->
          <div
            v-for="generatingBgm in bgmStore.generatingBgms"
            :key="generatingBgm.tempId"
            class="border-border bg-muted/50 flex items-center justify-between rounded-lg border border-dashed p-4"
          >
            <div class="flex flex-1 items-center space-x-4">
              <Loader2 class="text-primary h-5 w-5 animate-spin" />

              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ generatingBgm.title }}</span>
                  <Badge variant="outline" class="text-xs">{{ t("ui.actions.generating") }}</Badge>
                </div>
                <p class="text-muted-foreground text-xs">{{ t("bgm.generatingDescription") }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Badge variant="secondary" class="text-xs">{{ generatingBgm.duration }}</Badge>
            </div>
          </div>

          <!-- Existing BGMs -->
          <div
            v-for="bgm in bgmList"
            :key="bgm.id"
            class="border-border hover:border-primary flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div class="flex flex-1 items-center space-x-4">
              <Button variant="ghost" size="icon" @click="togglePlay(bgm.id)">
                <Play v-if="!bgm.playing" class="h-5 w-5" />
                <Pause v-else class="h-5 w-5" />
              </Button>

              <div class="flex-1">
                <input
                  v-if="bgm.editing"
                  v-model="bgm.title"
                  @blur="saveNameEdit(bgm)"
                  @keyup.enter="saveNameEdit(bgm)"
                  class="bg-background border-border w-full rounded border px-2 py-1 text-sm"
                  type="text"
                />
                <div v-else class="flex items-center space-x-2">
                  <span class="font-medium">{{ bgm.title }}</span>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click="startNameEdit(bgm)">
                    <Pencil class="h-3 w-3" />
                  </Button>
                </div>
                <p class="text-muted-foreground text-xs">{{ formatDate(bgm.createdAt) }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Badge variant="secondary" class="text-xs">{{ bgm.duration }}</Badge>
              <Button variant="ghost" size="icon" @click="deleteBgm(bgm.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create BGM Dialog -->
    <Dialog v-model:open="createDialog.open">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ t("bgm.create.title") }}</DialogTitle>
          <DialogDescription>{{ t("bgm.create.description") }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("bgm.create.promptLabel") }}</label>
            <Textarea
              v-model="createDialog.prompt"
              :placeholder="t('bgm.create.promptPlaceholder')"
              class="min-h-[100px]"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("bgm.create.durationLabel") }}</label>
            <Select v-model="createDialog.duration">
              <SelectTrigger>
                <SelectValue :placeholder="t('bgm.create.selectDuration')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30s">{{ `30${t("bgm.create.seconds")}` }}</SelectItem>
                <SelectItem value="60s">{{ `60${t("bgm.create.seconds")}` }}</SelectItem>
                <SelectItem value="120s">{{ `120${t("bgm.create.seconds")}` }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialog.open = false" :disabled="createDialog.generating">{{
            t("ui.actions.cancel")
          }}</Button>
          <Button @click="generateBgm" :disabled="createDialog.generating || !createDialog.prompt">
            <span v-if="!createDialog.generating">{{ t("ui.actions.generate") }}</span>
            <span v-else class="flex items-center space-x-2">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>{{ t("ui.actions.generating") }}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus, Music, Play, Pause, Pencil, Trash2, Loader2 } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import Layout from "@/components/layout.vue";
import { Button, Badge, Textarea } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bufferToUrl } from "@/lib/utils";
import { notifyError, notifySuccess } from "@/lib/notification";
import { useBgmStore } from "@/store";
import type { BgmMetadata } from "@/types";

const { t } = useI18n();
const bgmStore = useBgmStore();

interface BgmItem extends BgmMetadata {
  playing: boolean;
  editing: boolean;
  audioUrl?: string;
}

const bgmList = ref<BgmItem[]>([]);
const audioElement = ref<HTMLAudioElement | null>(null);

const createDialog = ref({
  open: false,
  prompt: "",
  duration: "60s",
  generating: false,
});

const loadBgmList = async () => {
  try {
    const items = (await window.electronAPI.mulmoHandler("bgmList")) as BgmMetadata[];
    bgmList.value = items.map((item) => ({
      ...item,
      playing: false,
      editing: false,
    }));
  } catch (error) {
    console.error("Failed to load BGM list:", error);
  }
};

const openCreateDialog = () => {
  createDialog.value = {
    open: true,
    prompt: "",
    duration: "60s",
    generating: false,
  };
};

const generateBgm = async () => {
  createDialog.value.generating = true;

  const title = createDialog.value.prompt.substring(0, 50) + (createDialog.value.prompt.length > 50 ? "..." : "");
  const prompt = createDialog.value.prompt;
  const duration = createDialog.value.duration;

  // Generate temporary ID
  const tempId = `temp-${Date.now()}`;

  // Add to generating list
  bgmStore.addGeneratingBgm({
    tempId,
    title,
    prompt,
    duration,
    startedAt: new Date().toISOString(),
  });

  // Close dialog immediately
  createDialog.value.open = false;
  createDialog.value.generating = false;

  // Continue generation in background
  try {
    const result = await window.electronAPI.mulmoHandler("bgmGenerate", prompt, duration, title);

    // Check for error in response
    if (result && typeof result === "object" && "error" in result) {
      const error = result.error as { message?: string; detail?: { message?: string } };
      const errorMessage = error?.detail?.message || error?.message || "Unknown error occurred";

      // Remove from generating list
      bgmStore.removeGeneratingBgm(tempId);

      // Check if it's a permission error
      if (errorMessage.includes("missing_permissions") || errorMessage.includes("music_generation")) {
        notifyError(t("bgm.errors.permissionDenied"), t("bgm.errors.permissionDescription"));
      } else {
        notifyError(t("bgm.errors.generationFailed"), errorMessage);
      }
      return;
    }

    const metadata = result as BgmMetadata;
    const newBgm: BgmItem = {
      ...metadata,
      playing: false,
      editing: false,
    };

    // Remove from generating list
    bgmStore.removeGeneratingBgm(tempId);

    // Add to BGM list
    bgmList.value.unshift(newBgm);
    notifySuccess(t("bgm.created"));
  } catch (error) {
    console.error("Failed to generate BGM:", error);
    bgmStore.removeGeneratingBgm(tempId);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    notifyError(t("bgm.errors.generationFailed"), errorMessage);
  }
};

const togglePlay = async (id: string) => {
  const bgm = bgmList.value.find((b) => b.id === id);
  if (!bgm) return;

  // Stop all other playing audio
  bgmList.value.forEach((b) => {
    if (b.id !== id) {
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
        const buffer = (await window.electronAPI.mulmoHandler("bgmAudioFile", id)) as ArrayBuffer | null;
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

const startNameEdit = (bgm: BgmItem) => {
  bgm.editing = true;
};

const saveNameEdit = async (bgm: BgmItem) => {
  bgm.editing = false;

  try {
    await window.electronAPI.mulmoHandler("bgmUpdateTitle", bgm.id, bgm.title);
  } catch (error) {
    console.error("Failed to update title:", error);
  }
};

const deleteBgm = async (id: string) => {
  try {
    const success = (await window.electronAPI.mulmoHandler("bgmDelete", id)) as boolean;
    if (success) {
      bgmList.value = bgmList.value.filter((bgm) => bgm.id !== id);
    }
  } catch (error) {
    console.error("Failed to delete BGM:", error);
  }
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format("YYYY/MM/DD HH:mm");
};

onMounted(() => {
  loadBgmList();
});
</script>
