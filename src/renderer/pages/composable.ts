import { ref } from "vue";
import { bufferToUrl } from "@/lib/utils";

type MulmoImageResponse = {
  imageData: Uint8Array<ArrayBuffer>;
  movieData: Uint8Array<ArrayBuffer>;
  lipSyncData: Uint8Array<ArrayBuffer>;
};

type MulmoImagesResponse = Record<string, MulmoImageResponse>;

export const useImageFiles = () => {
  const imageFiles = ref<Record<string, string | null>>({});
  const movieFiles = ref<Record<string, string | null>>({});
  const lipSyncFiles = ref<Record<string, string | null>>({});

  const downloadImageFiles = async (projectId: string) => {
    const res = (await window.electronAPI.mulmoHandler("mulmoImageFiles", projectId)) as MulmoImagesResponse;
    Object.keys(res).forEach((id) => {
      const data = res[id];
      if (data.imageData) {
        imageFiles.value[id] = bufferToUrl(data.imageData, "image/png");
      }
      if (data.movieData) {
        movieFiles.value[id] = bufferToUrl(data.movieData, "video/mp4");
      }
      if (data.lipSyncData) {
        lipSyncFiles.value[id] = bufferToUrl(data.lipSyncData, "video/mp4");
      }
    });
  };
  const downloadImageFile = async (projectId: string, index: number, beatId: string) => {
    const data = (await window.electronAPI.mulmoHandler("mulmoImageFile", projectId, index)) as MulmoImageResponse;
    if (data?.imageData) {
      imageFiles.value[beatId] = bufferToUrl(data.imageData, "image/png");
    }
    if (data?.movieData) {
      movieFiles.value[beatId] = bufferToUrl(data.movieData, "video/mp4");
    }
    if (data?.lipSyncData) {
      lipSyncFiles.value[beatId] = bufferToUrl(data.lipSyncData, "video/mp4");
    }
  };

  const resetImagesData = () => {
    imageFiles.value = {};
    movieFiles.value = {};
    lipSyncFiles.value = {};
  };

  const deleteImageData = (beatId: string) => {
    delete imageFiles.value[beatId];
    delete movieFiles.value[beatId];
    delete lipSyncFiles.value[beatId];
  };

  return {
    imageFiles,
    movieFiles,
    lipSyncFiles,
    downloadImageFiles,
    downloadImageFile,
    resetImagesData,
    deleteImageData,
  };
};

export const useAudioFiles = () => {
  // lang/index
  const audioFiles = ref<Record<string, Record<string, string | null>>>({});

  const downloadAudioFiles = async (projectId: string, lang: string) => {
    console.log("audioFiles");
    const res = (await window.electronAPI.mulmoHandler(
      "mulmoAudioFiles",
      projectId,
      lang,
    )) as Uint8Array<ArrayBuffer>[];
    audioFiles.value[lang] = Object.entries(res).reduce((tmp: Record<string, string | null>, [k, v]) => {
      if (v) {
        tmp[k] = bufferToUrl(v, "audio/mp3");
      }
      return tmp;
    }, {});
    // console.log(audioFiles.value);
  };

  const downloadAudioFile = async (
    projectId: string,
    lang: string,
    index: number,
    beatId: string,
    options?: {
      mode: "generated" | "uploaded";
      uploadPath?: string;
    },
  ) => {
    if (options?.mode === "uploaded" && options.uploadPath) {
      console.log("uploaded");
      // Load uploaded audio file from path
      try {
        const audioData = (await window.electronAPI.mulmoHandler(
          "mulmoBeatAudioGet",
          projectId,
          options.uploadPath,
        )) as ArrayBuffer;
        if (audioData) {
          if (!audioFiles.value[lang]) {
            audioFiles.value[lang] = {};
          }
          audioFiles.value[lang][beatId] = bufferToUrl(new Uint8Array(audioData), "audio/mp3");
        }
      } catch (error) {
        console.error(`Failed to load uploaded audio for beat ${beatId}:`, error);
      }
    } else {
      console.log("generate");
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Load generated TTS audio file (default mode)
      // Use mulmoGeneratedAudioFile to explicitly get TTS file (ignoring beat.audio)

      const res = (await window.electronAPI.mulmoHandler(
        "mulmoGeneratedAudioFile",
        projectId,
        index,
      )) as Uint8Array<ArrayBuffer>;
      console.log(res);
      if (res) {
        if (!audioFiles.value[lang]) {
          audioFiles.value[lang] = {};
        }
        audioFiles.value[lang][beatId] = bufferToUrl(res, "audio/mp3");
      }
    }
  };

  const resetAudioData = () => {
    audioFiles.value = {};
  };

  const deleteAudioData = (beatId: string) => {
    Object.keys(audioFiles.value).forEach((lang) => {
      delete audioFiles.value[lang][beatId];
    });
  };

  return {
    audioFiles,
    downloadAudioFiles,
    downloadAudioFile,
    resetAudioData,
    deleteAudioData,
  };
};
