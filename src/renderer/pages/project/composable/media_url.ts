import { z } from "zod";
import { ref, computed } from "vue";

export const useMediaUrl = () => {
  // image fetch
  const imageFetching = ref(false);
  const mediaUrl = ref("");
  const validateURL = computed(() => {
    const urlSchema = z.url();
    return mediaUrl.value === "" || urlSchema.safeParse(mediaUrl.value).success;
  });
  const fetchEnable = computed(() => {
    return mediaUrl.value !== "" && validateURL.value && !imageFetching.value;
  });

  return {
    imageFetching,
    mediaUrl,
    validateURL,
    fetchEnable,
  };
};
