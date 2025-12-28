<template>
  <div class="bg-muted/30 border-border mt-2 flex flex-wrap gap-2 rounded border p-2 text-xs">
    <div v-if="styleInfo.speech" class="flex items-center gap-1">
      <span class="text-muted-foreground">{{ t("project.scriptEditor.styleInfo.speech") }}:</span>
      <span class="font-medium">{{ styleInfo.speech }}</span>
    </div>
    <div v-if="styleInfo.image" class="flex items-center gap-1">
      <span class="text-muted-foreground">{{ t("project.scriptEditor.styleInfo.image") }}:</span>
      <span class="font-medium">{{ styleInfo.image }}</span>
    </div>
    <div v-if="styleInfo.movie" class="flex items-center gap-1">
      <span class="text-muted-foreground">{{ t("project.scriptEditor.styleInfo.movie") }}:</span>
      <span class="font-medium">{{ styleInfo.movie }}</span>
    </div>
    <div v-if="styleInfo.bgm" class="flex items-center gap-1">
      <span class="text-muted-foreground">{{ t("project.scriptEditor.styleInfo.bgm") }}:</span>
      <span class="font-medium">{{ styleInfo.bgm }}</span>
    </div>
    <div v-if="styleInfo.orientation" class="flex items-center gap-1">
      <span class="text-muted-foreground">{{ t("project.scriptEditor.styleInfo.size") }}:</span>
      <span class="font-medium">{{ styleInfo.orientation }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { MulmoScript } from "mulmocast/browser";
import { bgmAssets } from "mulmocast/data";

const { t } = useI18n();

const props = defineProps<{
  mulmoScript: MulmoScript;
}>();

// BGM title for library BGMs (loaded asynchronously)
const bgmLibraryTitle = ref<string | null>(null);

// Load BGM library title if needed
const loadBgmLibraryTitle = async (bgmPath: string) => {
  try {
    const fileName = bgmPath.split("/").pop() || "";
    const bgmList = (await window.electronAPI.mulmoHandler("bgmList")) as { fileName: string; title: string }[];
    const matchedBgm = bgmList.find((b) => b.fileName === fileName);
    bgmLibraryTitle.value = matchedBgm?.title || fileName;
  } catch (error) {
    console.error("Failed to load BGM library title:", error);
    bgmLibraryTitle.value = bgmPath.split("/").pop() || null;
  }
};

// Watch for BGM changes
watch(
  () => props.mulmoScript?.audioParams?.bgm,
  (newBgm) => {
    if (newBgm && typeof newBgm === "object" && "kind" in newBgm && newBgm.kind === "path" && "path" in newBgm) {
      const bgmPath = newBgm.path as string;
      if (bgmPath.includes("../../bgm/")) {
        loadBgmLibraryTitle(bgmPath);
      } else {
        bgmLibraryTitle.value = null;
      }
    } else {
      bgmLibraryTitle.value = null;
    }
  },
  { immediate: true },
);

// Style info display
const styleInfo = computed(() => {
  const script = props.mulmoScript;
  const info: {
    speech?: string;
    image?: string;
    movie?: string;
    bgm?: string;
    orientation?: string;
  } = {};

  // Speech providers (TTS)
  if (script.speechParams?.speakers) {
    const providers = new Set<string>();
    Object.values(script.speechParams.speakers).forEach((speaker) => {
      if (speaker.provider) {
        providers.add(speaker.provider);
      }
    });
    if (providers.size > 0) {
      info.speech = Array.from(providers).join(", ");
    }
  }

  // Image engine
  if (script.imageParams?.provider) {
    const provider = script.imageParams.provider;
    const model = script.imageParams.model;
    info.image = model ? `${provider}/${model}` : provider;
  }

  // Movie engine
  if (script.movieParams?.provider) {
    const provider = script.movieParams.provider;
    const model = script.movieParams.model;
    info.movie = model ? `${provider}/${model}` : provider;
  }

  // BGM
  if (script.audioParams?.bgm) {
    const bgm = script.audioParams.bgm;

    if (typeof bgm === "object" && "kind" in bgm) {
      if (bgm.kind === "url" && "url" in bgm) {
        const bgmUrl = bgm.url as string;
        // Try to find BGM name from bgmAssets (preset)
        const bgmAsset = bgmAssets.bgms.find((asset) => asset.url === bgmUrl);
        if (bgmAsset) {
          info.bgm = bgmAsset.title;
        } else {
          // Fall back to filename
          const fileName = bgmUrl.split("/").pop() || "Custom BGM";
          info.bgm = fileName;
        }
      } else if (bgm.kind === "path" && "path" in bgm) {
        // BGM library or custom uploaded
        const bgmPath = bgm.path as string;
        // Use loaded library title if available
        if (bgmPath.includes("../../bgm/") && bgmLibraryTitle.value) {
          info.bgm = bgmLibraryTitle.value;
        } else {
          const fileName = bgmPath.split("/").pop() || "Custom BGM";
          info.bgm = fileName;
        }
      }
    } else if (typeof bgm === "string") {
      // Legacy format
      const fileName = bgm.split("/").pop() || "Custom BGM";
      info.bgm = fileName;
    }
  } else {
    info.bgm = "None";
  }

  // Orientation (Portrait/Landscape)
  if (script.canvasSize) {
    const { width, height } = script.canvasSize;
    const orientation = width > height ? "Landscape" : width < height ? "Portrait" : "Square";
    info.orientation = `${orientation} (${width}×${height})`;
  }

  return info;
});
</script>
