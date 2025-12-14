<template>
  <Layout>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <!-- Header Section -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ t("voiceClone.title") }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">{{ t("voiceClone.description") }}</p>
          </div>
          <Button @click="openUploadDialog" class="flex items-center space-x-2">
            <Plus class="h-5 w-5" />
            <span>{{ t("voiceClone.upload") }}</span>
          </Button>
        </div>

        <!-- ElevenLabs API Key Alert -->
        <SettingsAlert provider="elevenlabs" :setting-presence="globalStore.settingPresence" class="mb-4" />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex items-center space-x-2">
            <Loader2 class="text-primary h-8 w-8 animate-spin" />
            <span class="text-muted-foreground">{{ t("ui.status.loading") }}</span>
          </div>
        </div>

        <!-- Voice List -->
        <div v-else-if="voices.length === 0" class="py-16 text-center">
          <div class="space-y-4">
            <Mic class="text-muted-foreground mx-auto h-16 w-16" />
            <h2 class="text-foreground text-xl font-semibold">{{ t("voiceClone.empty.title") }}</h2>
            <p class="text-muted-foreground">{{ t("voiceClone.empty.description") }}</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="voice in voices"
            :key="voice.voice_id"
            class="border-border hover:border-primary flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div class="flex flex-1 items-center space-x-4">
              <Button v-if="voice.previewUrl" variant="ghost" size="icon" @click="togglePlay(voice.voice_id)">
                <Play v-if="!voice.playing" class="h-5 w-5" />
                <Pause v-else class="h-5 w-5" />
              </Button>
              <Mic v-else class="text-muted-foreground h-5 w-5" />

              <div class="flex-1">
                <input
                  v-if="voice.editing"
                  v-model="voice.name"
                  @blur="saveNameEdit(voice)"
                  @keyup.enter="saveNameEdit(voice)"
                  class="bg-background border-border w-full rounded border px-2 py-1 text-sm"
                  type="text"
                />
                <div v-else class="flex items-center space-x-2">
                  <span class="font-medium">{{ voice.name }}</span>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click="startNameEdit(voice)">
                    <Pencil class="h-3 w-3" />
                  </Button>
                  <Badge v-if="voice.category" variant="secondary" class="text-xs">{{ voice.category }}</Badge>
                </div>
                <p class="text-muted-foreground text-xs">{{ voice.voice_id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Voice Clone Dialog -->
    <Dialog v-model:open="uploadDialog.open">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ t("voiceClone.upload") }}</DialogTitle>
          <DialogDescription>{{ t("voiceClone.uploadDescription") }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("voiceClone.voiceName") }}</label>
            <Input v-model="uploadDialog.name" :placeholder="t('voiceClone.voiceNamePlaceholder')" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("voiceClone.audioFile") }}</label>
            <div
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              :class="[
                'border-border bg-card relative cursor-pointer rounded-md border-2 border-dashed p-8 text-center shadow-sm transition-colors',
                uploadDialog.uploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
                isDragging ? 'border-primary bg-primary/5' : '',
              ]"
            >
              <div v-if="uploadDialog.fileName" class="space-y-2">
                <div class="text-primary font-medium">{{ uploadDialog.fileName }}</div>
                <p class="text-muted-foreground text-xs">
                  {{ t("voiceClone.fileRequirements", { maxSizeMB: 10 }) }}
                </p>
              </div>
              <div v-else class="text-muted-foreground space-y-1">
                <div class="text-sm whitespace-pre-line">{{ t("ui.common.drophere", { maxSizeMB: 10 }) }}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="uploadDialog.open = false" :disabled="uploadDialog.uploading">
            {{ t("ui.actions.cancel") }}
          </Button>
          <Button @click="uploadVoice" :disabled="uploadDialog.uploading || !uploadDialog.name || !uploadDialog.file">
            <span v-if="!uploadDialog.uploading">{{ t("ui.actions.upload") }}</span>
            <span v-else class="flex items-center space-x-2">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>{{ t("ui.actions.uploading") }}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Mic, Loader2, Play, Pause, Pencil, Plus } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import Layout from "@/components/layout.vue";
import SettingsAlert from "@/pages/project/script_editor/settings_alert.vue";
import { Badge, Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/lib/notification";
import { useMulmoGlobalStore } from "@/store";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();

interface ClonedVoice {
  voice_id: string;
  name: string;
  category?: string;
  previewUrl?: string;
}

interface VoiceItem extends ClonedVoice {
  playing: boolean;
  editing: boolean;
}

const voices = ref<VoiceItem[]>([]);
const loading = ref(false);
const audioElement = ref<HTMLAudioElement | null>(null);

const uploadDialog = ref({
  open: false,
  name: "",
  file: null as File | null,
  fileName: "",
  uploading: false,
});
const isDragging = ref(false);

const loadClonedVoices = async () => {
  loading.value = true;
  try {
    const result = (await window.electronAPI.mulmoHandler("getClonedVoices")) as ClonedVoice[];
    voices.value = result.map((voice) => ({
      ...voice,
      playing: false,
      editing: false,
    }));
  } catch (error) {
    console.error("Failed to load cloned voices:", error);
    notifyError(error);
  } finally {
    loading.value = false;
  }
};

const togglePlay = (voiceId: string) => {
  const voice = voices.value.find((v) => v.voice_id === voiceId);
  if (!voice || !voice.previewUrl) return;

  // Stop all other voices
  voices.value.forEach((v) => {
    if (v.voice_id !== voiceId) {
      v.playing = false;
    }
  });

  if (voice.playing) {
    // Stop current voice
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.currentTime = 0;
    }
    voice.playing = false;
  } else {
    // Play new voice
    if (audioElement.value) {
      audioElement.value.src = voice.previewUrl;
      audioElement.value.play().catch((error) => {
        console.error("Failed to play audio:", error);
        voice.playing = false;
      });
      voice.playing = true;

      // Reset playing state when audio ends
      audioElement.value.onended = () => {
        voice.playing = false;
      };
    }
  }
};

const startNameEdit = (voice: VoiceItem) => {
  voice.editing = true;
};

const saveNameEdit = async (voice: VoiceItem) => {
  voice.editing = false;
  try {
    await window.electronAPI.mulmoHandler("updateVoiceName", voice.voice_id, voice.name);
    // Reload the list to reflect changes from API
    await loadClonedVoices();
  } catch (error) {
    console.error("Failed to update voice name:", error);
    notifyError(error);
    // Reload to restore original name
    await loadClonedVoices();
  }
};

const openUploadDialog = () => {
  uploadDialog.value = {
    open: true,
    name: "",
    file: null,
    fileName: "",
    uploading: false,
  };
  isDragging.value = false;
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const handleFileUpload = (file: File) => {
  if (!file) return;

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    notifyError(t("voiceClone.fileTooLarge", { maxSizeMB: 10 }));
    return;
  }

  uploadDialog.value.file = file;
  uploadDialog.value.fileName = file.name;
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileUpload(files[0]);
  }
};

const uploadVoice = async () => {
  if (!uploadDialog.value.file || !uploadDialog.value.name) return;

  uploadDialog.value.uploading = true;
  try {
    const buffer = await readFileAsArrayBuffer(uploadDialog.value.file);
    await window.electronAPI.mulmoHandler(
      "uploadVoiceClone",
      uploadDialog.value.name,
      buffer,
      uploadDialog.value.fileName,
    );
    notifySuccess(t("voiceClone.uploadSuccess"));
    uploadDialog.value.open = false;
    // Reload to show new voice
    await loadClonedVoices();
  } catch (error) {
    console.error("Failed to upload voice:", error);
    notifyError(error);
  } finally {
    uploadDialog.value.uploading = false;
  }
};

onMounted(() => {
  audioElement.value = new Audio();
  loadClonedVoices();
});
</script>
