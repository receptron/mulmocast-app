<template>
  <div class="space-y-6">
    <!-- Output Buttons -->
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-1">
        <label v-for="option in checkboxOptions" :key="option.key" class="flex items-center space-x-2">
          <Checkbox v-model="options[option.key]" :disabled="option.key === 'audio' && options.movie" />
          <span>{{ t("project.generate." + option.key) }}</span>
        </label>
      </div>
      <div class="flex justify-center">
        <Button
          @click="generateContents"
          class="mt-2 flex h-auto w-full items-center justify-center space-y-2 py-4 whitespace-normal"
          :disabled="
            isArtifactGenerating ||
            !checkboxOptions.some((option) => options[option.key]) ||
            !mulmoScriptHistoryStore.isValidScript
          "
          data-testid="generate-contents-button"
        >
          <div class="mb-0 flex items-center justify-center gap-2">
            <Monitor :size="24" v-if="options.movie" />
            <Volume2Icon :size="24" v-if="options.audio" />
            <FileText :size="24" v-if="options.pdfSlide || options.pdfHandout" />
          </div>
          <span>{{ t("project.generate.generateContents") }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useMulmoEventStore, useMulmoScriptHistoryStore } from "../../store";
import { notifyProgress } from "@/lib/notification";
import { FileText, Monitor, Volume2Icon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { useI18n } from "vue-i18n";

interface Props {
  projectId: string;
  isArtifactGenerating: boolean;
}
const props = defineProps<Props>();

const { t } = useI18n();

type OptionKey = "movie" | "audio" | "pdfSlide" | "pdfHandout";

const checkboxOptions: { key: OptionKey }[] = [
  { key: "movie" },
  { key: "audio" },
  //  { key: "pdfSlide" },
  { key: "pdfHandout" },
];

const options = ref<Record<OptionKey, boolean>>({
  movie: true,
  audio: true,
  pdfSlide: false,
  pdfHandout: false,
});

watch(
  () => options.value.movie,
  (movie) => {
    if (movie) {
      options.value.audio = true;
    }
  },
);

const generateContents = () => {
  const keys = Object.keys(options.value).filter((key) => options.value[key]);
  notifyProgress(window.electronAPI.mulmoHandler("mulmoActionRunner", props.projectId, keys), {
    successMessage: t("notify.content.successMessage"),
    errorMessage: t("notify.content.errorMessage"),
    errorDescription: t("notify.error.noContext"),
  });
};
const mulmoEventStore = useMulmoEventStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();
</script>
