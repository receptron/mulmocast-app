import { ref } from "vue";
import { bufferToUrl } from "@/lib/utils";

export const downloadFile = async (projectId: string, mediaType: string, mimeType: string, fileSuffix: string) => {
  const buffer = (await window.electronAPI.mulmoHandler("downloadFile", projectId, mediaType)) as ArrayBuffer;
  if (buffer && buffer.byteLength > 0) {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = projectId + "_" + fileSuffix;
    a.click();

    URL.revokeObjectURL(url);
  }
};

export const useMediaContents = (mediaType: string, mimeType: string | undefined, callback: () => void) => {
  const mediaUrl = ref("");
  const bufferLength = ref(0);
  const updateResources = async (projectId: string) => {
    const bufferMovie = (await window.electronAPI.mulmoHandler("downloadFile", projectId, mediaType)) as Buffer;
    if (bufferMovie && bufferMovie.byteLength > 0) {
      mediaUrl.value = bufferToUrl(new Uint8Array(bufferMovie), mimeType);
      bufferLength.value = bufferMovie.byteLength;
      callback();
    }
  };
  return {
    mediaUrl,
    bufferLength,
    updateResources,
  };
};
