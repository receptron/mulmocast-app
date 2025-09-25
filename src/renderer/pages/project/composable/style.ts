import { ref, computed, watch } from "vue";
import { useMulmoGlobalStore } from "@/store";

// Column open/close states
export const isLeftColumnOpen = ref(true); // Default: open
export const isRightColumnOpen = ref(true); // Default: open

// Watch for user level changes and reset left column state for beginners
const globalStore = useMulmoGlobalStore();
watch(
  () => globalStore.userIsSemiProOrAbove,
  (newValue) => {
    // When switching to beginner mode, ensure left column is "open" for proper layout
    if (!newValue) {
      isLeftColumnOpen.value = true;
    }
  }
);

// Computed grid layout class based on column states
export const gridLayoutClass = computed(() => {
  const globalStore = useMulmoGlobalStore();

  // 2-column layout for beginners (no AI chat column)
  if (!globalStore.userIsSemiProOrAbove) {
    // In beginner mode, force left column to be considered "open" since it doesn't exist
    // Only right column state matters
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
