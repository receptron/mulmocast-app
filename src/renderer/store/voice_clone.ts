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
      const result = await window.electronAPI.mulmoHandler("getClonedVoices");

      // Check if result is an error object
      if (result && typeof result === "object" && "error" in result) {
        const errorResult = result as { error: Error; cause?: { type: string; agentName: string } };

        // If cause exists, throw error with cause
        if (errorResult.cause) {
          const newError = new Error(errorResult.error.message);
          (newError as Error & { cause?: unknown }).cause = errorResult.cause;
          throw newError;
        }

        throw errorResult.error;
      }

      // Check if result is an array
      if (!Array.isArray(result)) {
        throw new Error("Invalid response: expected array of voices");
      }

      voices.value = result as ClonedVoice[];
    } catch (error) {
      console.error("Failed to load cloned voices:", error);
      voices.value = []; // Reset to empty array on error
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
