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
          <Button v-if="hasApiKey" @click="openUploadDialog" class="flex items-center space-x-2">
            <Plus class="h-5 w-5" />
            <span>{{ t("voiceClone.upload") }}</span>
          </Button>
        </div>

        <!-- ElevenLabs API Key Alert -->
        <SettingsAlert provider="elevenlabs" :setting-presence="globalStore.settingPresence" class="mb-4" />

        <!-- API Key Not Set -->
        <div v-if="!hasApiKey" class="py-16 text-center">
          <div class="space-y-4">
            <Mic class="text-muted-foreground mx-auto h-16 w-16" />
            <h2 class="text-foreground text-xl font-semibold">{{ t("voiceClone.apiKeyRequired.title") }}</h2>
            <p class="text-muted-foreground">{{ t("voiceClone.apiKeyRequired.description") }}</p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="flex items-center justify-center py-16">
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
                  v-model="editingVoiceName"
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
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click="openDeleteDialog(voice)">
                    <Trash2 class="h-3 w-3" />
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
              @click="triggerFileInput"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              :class="[
                'border-border bg-card relative cursor-pointer rounded-md border-2 border-dashed p-8 text-center shadow-sm transition-colors',
                uploadDialog.uploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
                isDragging ? 'border-primary bg-primary/5' : '',
              ]"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="audio/*"
                class="hidden"
                @change="handleFileInputChange"
                :disabled="uploadDialog.uploading"
              />
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

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="deleteDialog.open">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ t("voiceClone.deleteConfirmTitle") }}</DialogTitle>
          <DialogDescription>{{ t("voiceClone.deleteConfirmDescription") }}</DialogDescription>
        </DialogHeader>

        <div v-if="deleteDialog.voiceName" class="py-4">
          <p class="text-sm">
            <span class="text-muted-foreground">{{ t("voiceClone.voiceName") }}: </span>
            <span class="font-medium">{{ deleteDialog.voiceName }}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="deleteDialog.open = false" :disabled="deleteDialog.deleting">
            {{ t("ui.actions.cancel") }}
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="deleteDialog.deleting">
            <span v-if="!deleteDialog.deleting">{{ t("ui.actions.delete") }}</span>
            <span v-else class="flex items-center space-x-2">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>{{ t("ui.status.deleting") }}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Mic, Loader2, Play, Pause, Pencil, Plus, Trash2 } from "lucide-vue-next";
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
import { useMulmoGlobalStore, useVoiceCloneStore } from "@/store";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();
const voiceCloneStore = useVoiceCloneStore();

interface VoiceItem {
  voice_id: string;
  name: string;
  category?: string;
  previewUrl?: string;
  playing: boolean;
  editing: boolean;
}

const audioElement = ref<HTMLAudioElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const uploadDialog = ref({
  open: false,
  name: "",
  file: null as File | null,
  fileName: "",
  uploading: false,
});
const isDragging = ref(false);

const deleteDialog = ref({
  open: false,
  voiceId: "",
  voiceName: "",
  deleting: false,
});

const voices = computed<VoiceItem[]>(() => {
  if (!Array.isArray(voiceCloneStore.voices)) {
    return [];
  }
  return voiceCloneStore.voices.map((voice) => ({
    ...voice,
    playing: playingVoiceId.value === voice.voice_id,
    editing: editingVoiceId.value === voice.voice_id,
  }));
});
const loading = computed(() => voiceCloneStore.loading);

const playingVoiceId = ref<string | null>(null);
const editingVoiceId = ref<string | null>(null);
const editingVoiceName = ref("");

const hasApiKey = computed(() => {
  return globalStore.settingPresence["ELEVENLABS_API_KEY"] === true;
});

// Helper function to handle voice clone errors with voice_limit_reached support
const handleVoiceCloneError = (error: unknown, fallbackMessage: string) => {
  const errorWithCause = error as Error & { cause?: { type: string; agentName: string; action?: string } };

  if (errorWithCause?.cause) {
    const { type, agentName, action } = errorWithCause.cause;
    const i18nKey = action ? `notify.error.${action}.${type}.${agentName}` : `notify.error.${type}.${agentName}`;

    if (type === "voice_limit_reached") {
      const actionKey = `${i18nKey}Action`;
      const urlKey = `${i18nKey}Url`;

      const message = t(i18nKey);
      const actionLabel = t(actionKey);
      const url = t(urlKey);

      if (message !== i18nKey && actionLabel !== actionKey && url !== urlKey) {
        notifyError("", message, {
          label: actionLabel,
          onClick: () => {
            window.open(url, "_blank");
          },
        });
        return;
      }
    }

    if (t(i18nKey) !== i18nKey) {
      notifyError(t(i18nKey));
      return;
    }
  }

  const errorMessage = error instanceof Error ? error.message : fallbackMessage;
  notifyError(errorMessage);
};

const loadClonedVoices = async () => {
  if (!hasApiKey.value) {
    return;
  }
  try {
    await voiceCloneStore.loadVoices();
  } catch (error) {
    console.error("Failed to load cloned voices:", error);
    console.log(error);
    handleVoiceCloneError(error, t("voiceClone.errors.loadFailed"));
  }
};

const togglePlay = (voiceId: string) => {
  const voice = voices.value.find((v) => v.voice_id === voiceId);
  if (!voice || !voice.previewUrl) return;

  if (playingVoiceId.value === voiceId) {
    // Stop current voice
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.currentTime = 0;
    }
    playingVoiceId.value = null;
  } else {
    // Play new voice
    if (audioElement.value) {
      audioElement.value.src = voice.previewUrl;
      audioElement.value.play().catch((error) => {
        console.error("Failed to play audio:", error);
        playingVoiceId.value = null;
      });
      playingVoiceId.value = voiceId;

      // Reset playing state when audio ends
      audioElement.value.onended = () => {
        playingVoiceId.value = null;
      };
    }
  }
};

const startNameEdit = (voice: VoiceItem) => {
  editingVoiceId.value = voice.voice_id;
  editingVoiceName.value = voice.name;
};

const saveNameEdit = async (voice: VoiceItem) => {
  const newName = editingVoiceName.value.trim();
  editingVoiceId.value = null;
  editingVoiceName.value = "";

  if (!newName || newName === voice.name) {
    return;
  }

  try {
    await voiceCloneStore.updateVoiceName(voice.voice_id, newName);
    notifySuccess(t("voiceClone.nameUpdated"));
  } catch (error) {
    console.error("Failed to update voice name:", error);
    handleVoiceCloneError(error, "Failed to update voice name");
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

const triggerFileInput = () => {
  if (uploadDialog.value.uploading) return;
  fileInputRef.value?.click();
};

const handleFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleFileUpload(files[0]);
  }
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
    await voiceCloneStore.uploadVoice(uploadDialog.value.name, buffer, uploadDialog.value.fileName);
    notifySuccess(t("voiceClone.uploadSuccess"));
    uploadDialog.value.open = false;
  } catch (error) {
    console.error("Failed to upload voice:", error);
    handleVoiceCloneError(error, "Failed to upload voice");
  } finally {
    uploadDialog.value.uploading = false;
  }
};

const openDeleteDialog = (voice: VoiceItem) => {
  deleteDialog.value = {
    open: true,
    voiceId: voice.voice_id,
    voiceName: voice.name,
    deleting: false,
  };
};

const confirmDelete = async () => {
  if (!deleteDialog.value.voiceId) return;

  deleteDialog.value.deleting = true;
  try {
    await voiceCloneStore.deleteVoice(deleteDialog.value.voiceId);
    notifySuccess(t("voiceClone.deleteSuccess"));
    deleteDialog.value.open = false;
  } catch (error) {
    console.error("Failed to delete voice:", error);
    handleVoiceCloneError(error, "Failed to delete voice");
  } finally {
    deleteDialog.value.deleting = false;
  }
};

onMounted(() => {
  audioElement.value = new Audio();
  loadClonedVoices();
});
</script>
