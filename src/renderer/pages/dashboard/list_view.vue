<template>
  <div class="flex flex-col gap-4">
    <router-link :to="`/project/${project.metadata.id}`" v-for="project in projects" :key="project.metadata.id">
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <template v-if="thumbnailsLoading[project.metadata.id]">
                <Skeleton class="w-full h-full" />
              </template>
              <template v-else-if="projectThumbnails[project.metadata.id]">
                <img
                  :src="mediaUri(projectThumbnails[project.metadata.id])"
                  class="w-full h-full object-contain"
                  :alt="project?.script?.title || INITIAL_TITLE"
                />
              </template>
              <template v-else>
                <FileText class="w-6 h-6 text-green-500" />
              </template>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900">{{ project?.script?.title || INITIAL_TITLE }}</h3>
              </div>
              <div class="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                <Calendar class="w-4 h-4" />
                <span>{{ formatDate(project.metadata.updatedAt || project.metadata.createdAt) }}</span>
                <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                  {{ project.metadata.version }}
                </span>
                <div
                  v-if="mulmoEventStore.isGenerating(project.metadata.id)"
                  class="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded"
                >
                  <Loader2 class="w-3 h-3 text-blue-500 animate-spin" />
                  <span class="text-xs text-blue-600 font-medium">Generating</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <Button
              @click="viewProject($event, project)"
              variant="ghost"
              size="icon"
              class="text-gray-400 hover:text-blue-600"
            >
              <Eye class="w-5 h-5" />
            </Button>
            <Button
              @click.stop="deleteProject(project)"
              variant="ghost"
              size="icon"
              class="text-gray-400 hover:text-red-600"
            >
              <Trash2 class="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { Trash2, Eye, Calendar, Loader2, FileText } from "lucide-vue-next";
import type { Project } from "@/lib/project_api";
import { formatDate, mediaUri } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMulmoEventStore } from "@/store/mulmo_event";
import { Skeleton } from "@/components/ui/skeleton";
import { INITIAL_TITLE } from "../../../shared/constants";

const emit = defineEmits<{
  delete: [project: Project];
  view: [project: Project];
}>();

defineProps<{
  projects: Project[];
  projectThumbnails: Record<string, ArrayBuffer | string | null>;
  thumbnailsLoading: Record<string, boolean>;
}>();

const mulmoEventStore = useMulmoEventStore();

const deleteProject = (project: Project) => {
  emit("delete", project);
};

const viewProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("view", project);
};
</script>
