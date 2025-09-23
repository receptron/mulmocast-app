<template>
  <div class="border-border bg-muted/50 rounded-lg border p-8 text-center">
    <div class="mx-auto" v-if="pdfData.value && pages > 0">
      <VuePDF :pdf="pdfData.value" :page="pdfCurrentPage" :scale="0.8" :fit-parent="true" />
    </div>
    <template v-else>
      <FileText :size="64" class="text-muted-foreground mx-auto mb-4" />
      <p class="mb-2 text-lg font-medium">{{ t("project.productTabs.pdf.title") }}</p>
      <p class="text-muted-foreground mb-4 text-sm">{{ t("project.productTabs.pdf.description") }}</p>
    </template>
    <div v-if="pages === 0">{{ t("project.productTabs.pdf.empty") }}</div>
    <div v-if="pages > 0" class="flex flex-col items-center justify-center gap-2">
      <div class="flex items-center justify-center gap-4">
        <div>
          <Button :disabled="pdfCurrentPage < 2" @click="pdfCurrentPage = pdfCurrentPage - 1">< </Button>
          {{ pdfCurrentPage }}/{{ pages }}
          <Button @click="pdfCurrentPage = pdfCurrentPage + 1" :disabled="pdfCurrentPage >= pages">></Button>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" @click="downloadPdf">
            <FileText :size="16" class="mr-2" />
            {{ t("project.productTabs.pdf.download") }}
          </Button>
        </div>
      </div>
    </div>
    <div class="text-muted-foreground mt-2 text-xs" v-if="pdfData.value">
      {{
        t("project.productTabs.pdf.details", {
          pages: pages || "-",
          size: pdfMetadata.fileSize || "-",
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { FileText } from "lucide-vue-next";
import { VuePDF, usePDF } from "@tato30/vue-pdf";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { formatFileSize } from "@/lib/format";
import { useMulmoEventStore } from "@/store";

import { downloadFile, useMediaContents } from "./utils";

const { t } = useI18n();

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const pdfCurrentPage = ref(1);
const pdfMetadata = ref({
  fileSize: "",
});

const downloadPdf = async () => {
  downloadFile(props.projectId, "pdf", "application/pdf", "handout.pdf");
};

const {
  mediaUrl: pdfBuffer,
  bufferLength,
  updateResources,
} = useMediaContents("pdf", undefined, async () => {
  pdfMetadata.value.fileSize = formatFileSize(bufferLength.value);
});

const pdfData = ref();
const { pdf, pages } = usePDF(pdfBuffer);
pdfData.value = pdf;

watch(
  () => props.projectId,
  async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
      await updateResources(newProjectId);
    }
  },
  { immediate: true },
);

const mulmoEventStore = useMulmoEventStore();
const currentEvent = computed(() => mulmoEventStore.mulmoEvent[props.projectId]);
watch(currentEvent, async (mulmoEvent) => {
  if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "pdf" && !mulmoEvent.inSession) {
    await updateResources(props.projectId);
  }
});
</script>
