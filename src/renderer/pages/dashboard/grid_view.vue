<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <router-link :to="`/project/${project.metadata.id}`" v-for="project in projects" :key="project.metadata.id">
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      >
        <div class="aspect-video bg-gray-100 relative overflow-hidden">
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
            <!-- Audio/Podcast/Presentation Icon -->
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <div
                class="p-8 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
              >
                <FileText class="w-12 h-12 text-blue-600" />
              </div>
            </div>
          </template>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-gray-900 text-sm truncate">
              {{ project?.script?.title || INITIAL_TITLE }}
            </h3>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <div class="flex items-center space-x-1">
              <Calendar class="w-3 h-3" />
              <span>{{ formatDate(project.metadata.updatedAt || project.metadata.createdAt) }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <div
                v-if="mulmoEventStore.isGenerating(project.metadata.id)"
                class="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded"
              >
                <Loader2 class="w-3 h-3 text-blue-500 animate-spin" />
                <span class="text-xs text-blue-600 font-medium">Generating</span>
              </div>
              <span class="px-2 py-1 bg-gray-100 rounded">
                {{ project.metadata.version }}
              </span>
            </div>
          </div>
          <div class="flex justify-end mt-2 space-x-1">
            <Button
              @click="viewProject($event, project)"
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-gray-400 hover:text-blue-600"
            >
              <Eye class="w-4 h-4" />
            </Button>
            <Button
              @click="deleteProject($event, project)"
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-gray-400 hover:text-red-600"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { Calendar, FileText, Trash2, Loader2, Eye } from "lucide-vue-next";
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

const deleteProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("delete", project);
};

const viewProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("view", project);
};
</script>
