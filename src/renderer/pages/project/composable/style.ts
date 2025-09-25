import { ref, computed } from "vue";
import { useMulmoGlobalStore } from "@/store";

// Column open/close states
export const isLeftColumnOpen = ref(true); // Default: open
export const isRightColumnOpen = ref(true); // Default: open

// Computed grid layout class based on column states
export const gridLayoutClass = computed(() => {
  const globalStore = useMulmoGlobalStore();

  // 2-column layout for beginners (no AI chat column)
  if (!globalStore.userIsSemiProOrAbove) {
    if (isRightColumnOpen.value) {
      return "lg:grid-cols-[1fr_30%]";
    }
    return "lg:grid-cols-[1fr_48px]";
  }

  // 3-column layout for semi-pro and above
  if (isLeftColumnOpen.value && isRightColumnOpen.value) {
    return "lg:grid-cols-[30%_40%_1fr]";
  } else if (isLeftColumnOpen.value) {
    return "lg:grid-cols-[30%_1fr_48px]";
  } else if (isRightColumnOpen.value) {
    return "lg:grid-cols-[48px_1fr_30%]";
  }
  return "lg:grid-cols-[48px_1fr_48px]";
});
