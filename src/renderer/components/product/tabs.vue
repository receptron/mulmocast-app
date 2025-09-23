<template>
  <Tabs :model-value="currentTab" @update:model-value="handleUpdateTab" class="max-h-[90vh] w-full">
    <TabsList class="grid w-full grid-cols-4">
      <TabsTrigger :value="MULMO_VIEWER_TABS.MOVIE">{{ t("project.productTabs.tabs.movie") }}</TabsTrigger>
      <TabsTrigger :value="MULMO_VIEWER_TABS.PDF">{{ t("project.productTabs.tabs.pdf") }}</TabsTrigger>
      <TabsTrigger :value="MULMO_VIEWER_TABS.PODCAST">{{ t("project.productTabs.tabs.podcast") }}</TabsTrigger>
      <TabsTrigger :value="MULMO_VIEWER_TABS.SLIDE">{{ t("project.productTabs.tabs.slide") }}</TabsTrigger>
    </TabsList>

    <TabsContent value="movie" class="mt-4 max-h-[calc(90vh-7rem)] overflow-y-auto">
      <MovieTab :project-id="projectId" />
    </TabsContent>
    <TabsContent value="pdf" class="mt-4 max-h-[calc(90vh-7rem)] overflow-y-auto">
      <PdfTab :project-id="projectId" />
    </TabsContent>
    <TabsContent value="podcast" class="mt-4 max-h-[calc(90vh-7rem)] overflow-y-auto">
      <PodcastTab :project-id="projectId" />
    </TabsContent>
    <TabsContent value="slide" class="mt-4 max-h-[calc(90vh-7rem)] overflow-y-auto">
      <MulmoViewer
        :project-id="projectId"
        :project="project"
        :mulmoMultiLinguals="mulmoMultiLinguals"
        @updateMultiLingual="updateMultiLingual"
      />
    </TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type MultiLingualTexts } from "mulmocast/browser";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/project_api";

import { TabsContent } from "@/components/ui/tabs";

import MovieTab from "./tabs/movie_tab.vue";
import PdfTab from "./tabs/pdf_tab.vue";
import PodcastTab from "./tabs/podcast_tab.vue";
import MulmoViewer from "../mulmo_viewer/mulmo_viewer.vue";

import { MULMO_VIEWER_TABS, type MulmoViewerTab } from "../../../shared/constants";

const { t } = useI18n();

interface Props {
  project: Project;
  mulmoViewerActiveTab?: MulmoViewerTab;
  mulmoMultiLinguals?: MultiLingualTexts;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:mulmoViewerActiveTab", "updateMultiLingual"]);

const projectId = computed(() => props.project?.metadata?.id || "");
const currentTab = ref<MulmoViewerTab>(props.mulmoViewerActiveTab || MULMO_VIEWER_TABS.MOVIE);

watch(
  () => props.mulmoViewerActiveTab,
  (newTab) => {
    if (newTab && newTab !== currentTab.value) {
      currentTab.value = newTab;
    }
  },
);
const updateMultiLingual = () => {
  emit("updateMultiLingual");
};

const handleUpdateTab = (tab: MulmoViewerTab) => {
  currentTab.value = tab;
  emit("update:mulmoViewerActiveTab", tab);
};
</script>
