import { defineStore } from "pinia";
import { ref } from "vue";

export interface ClonedVoice {
  voice_id: string;
  name: string;
  category?: string;
  previewUrl?: string;
}

export const useVoiceCloneStore = defineStore("voiceClone", () => {
  const voices = ref<ClonedVoice[]>([]);
  const loading = ref(false);

  const loadVoices = async () => {
    loading.value = true;
    try {
      const result = (await window.electronAPI.mulmoHandler("getClonedVoices")) as ClonedVoice[];
      voices.value = result;
    } catch (error) {
      console.error("Failed to load cloned voices:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateVoiceName = async (voiceId: string, name: string) => {
    await window.electronAPI.mulmoHandler("updateVoiceName", voiceId, name);
    await loadVoices();
  };

  const uploadVoice = async (name: string, fileBuffer: ArrayBuffer, fileName: string) => {
    await window.electronAPI.mulmoHandler("uploadVoiceClone", name, fileBuffer, fileName);
    await loadVoices();
  };

  const deleteVoice = async (voiceId: string) => {
    await window.electronAPI.mulmoHandler("deleteVoice", voiceId);
    await loadVoices();
  };

  return {
    voices,
    loading,
    loadVoices,
    updateVoiceName,
    uploadVoice,
    deleteVoice,
  };
});
