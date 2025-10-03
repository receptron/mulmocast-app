<template>
  <div class="space-y-6">
    <!-- Output Buttons -->
    <MovieTab :project-id="projectId" />
    <div class="space-y-4">
      <div class="flex justify-center">
        <Button
          @click="generateContents"
          class="mt-2 flex h-auto w-full items-center justify-center space-y-2 py-4 whitespace-normal"
          data-testid="generate-contents-button"
          :disabled="mulmoEventStore.isArtifactGenerating[projectId]"
        >
          <div class="mb-0 flex items-center justify-center gap-2">
            <Monitor :size="24" />
          </div>
          <span>{{ t("project.generate.generateVideo") }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { notifyProgress } from "@/lib/notification";
import { Monitor } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { getConcurrentTaskStatusMessageComponent } from "./concurrent_task_status_message";

import MovieTab from "../../components/product/tabs/movie_tab.vue";
import { useMulmoEventStore } from "../../store";

import { useI18n } from "vue-i18n";

interface Props {
  projectId: string;
}
const props = defineProps<Props>();

const { t } = useI18n();

const mulmoEventStore = useMulmoEventStore();

const generateContents = () => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoActionRunner", props.projectId, ["movie"]), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: t("notify.content.successMessage"),
    errorMessage: t("notify.content.errorMessage"),
  });
};

const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(props.projectId);
</script>
