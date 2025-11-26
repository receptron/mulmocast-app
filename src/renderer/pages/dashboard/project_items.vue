<template>
  <div :class="containerClass">
    <router-link :to="`/project/${project.metadata.id}`" v-for="project in projects" :key="project.metadata.id">
      <div
        :class="[
          cardClass,
          project.isValud
            ? 'border-border hover:border-primary/50 dark:hover:border-primary/30'
            : 'border-red-400 hover:border-red-800',
        ]"
      >
        <!-- Thumbnail -->
        <div class="thumbnail">
          <template v-if="thumbnailsLoading[project.metadata.id]">
            <Skeleton class="h-full w-full" />
          </template>
          <template v-else-if="projectThumbnails[project.metadata.id]">
            <img
              :src="mediaUri(projectThumbnails[project.metadata.id])"
              class="h-full w-full object-contain"
              :alt="project?.script?.title || t('project.newProject.defaultTitle')"
            />
          </template>
          <template v-else>
            <div
              class="from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex h-full w-full items-center justify-center bg-gradient-to-br"
            >
              <div
                :class="
                  viewMode === 'grid'
                    ? 'bg-background rounded-full p-8 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl'
                    : ''
                "
              >
                <FileText :class="viewMode === 'grid' ? 'text-primary h-12 w-12' : 'text-primary h-6 w-6'" />
              </div>
            </div>
          </template>
        </div>

        <!-- Title -->
        <h3 class="title text-foreground truncate">
          {{ project?.script?.title || t("project.newProject.defaultTitle") }}
        </h3>

        <!-- Info -->
        <div class="info">
          <Calendar class="h-3 w-3" />
          <span>{{ formatDate(project.metadata.updatedAt || project.metadata.createdAt) }}</span>
          <span class="bg-muted rounded px-2 py-1 text-xs">
            {{ project.metadata.version }}
          </span>
          <div
            v-if="mulmoEventStore.isGenerating(project.metadata.id)"
            class="bg-primary/10 inline-flex items-center space-x-1 rounded px-2 py-1"
          >
            <Loader2 class="text-primary h-3 w-3 animate-spin" />
            <span class="text-primary text-xs font-medium">{{ t("ui.status.generating") }}</span>
          </div>
          <!-- Error status for invalid projects (List view only) -->
          <div
            v-if="!project.isValud && viewMode === 'list'"
            class="inline-flex items-center space-x-1 rounded border border-red-200 bg-red-50 px-2 py-1 dark:border-red-800 dark:bg-red-900/20"
          >
            <span class="text-xs font-medium text-red-600 dark:text-red-400">{{
              t("dashboard.errors.noPreview")
            }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <!-- Error status for invalid projects (Grid view only) -->
          <div
            v-if="!project.isValud && viewMode === 'grid'"
            class="inline-flex items-center space-x-1 rounded border border-red-200 bg-red-50 px-2 py-1 dark:border-red-800 dark:bg-red-900/20"
          >
            <span class="text-xs font-medium text-red-600 dark:text-red-400">{{
              t("dashboard.errors.noPreview")
            }}</span>
          </div>
          <Button
            @click="viewProject($event, project)"
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-primary"
          >
            <Eye class="h-4 w-4" />
          </Button>
          <div class="copy-button-wrapper relative">
            <Button
              @click="copyProject($event, project)"
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-primary"
            >
              <Copy class="h-4 w-4" />
            </Button>
            <span class="copy-tooltip">
              {{ t("dashboard.copy.tooltip") }}
            </span>
          </div>
          <Button
            @click="deleteProject($event, project)"
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-destructive"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar, FileText, Trash2, Loader2, Eye, Copy } from "lucide-vue-next";
import type { Project } from "@/lib/project_api";
import { formatDate, mediaUri } from "@/lib/utils";
import { Button, Skeleton } from "@/components/ui";
import { useMulmoEventStore } from "@/store/mulmo_event";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const emit = defineEmits<{
  delete: [project: Project];
  view: [project: Project];
  copy: [project: Project];
}>();

const props = defineProps<{
  projects: Project[];
  projectThumbnails: Record<string, ArrayBuffer | string | null>;
  thumbnailsLoading: Record<string, boolean>;
  viewMode?: "grid" | "list";
}>();

const mulmoEventStore = useMulmoEventStore();

const containerClass = computed(() => {
  return props.viewMode === "grid" ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-4";
});

const cardClass = computed(() => {
  const common = "bg-card border shadow-sm transition-all duration-200";
  return props.viewMode === "grid"
    ? "project-card-grid group cursor-pointer overflow-hidden rounded-lg hover:shadow-lg " + common
    : "project-card-list cursor-pointer rounded-lg p-4 hover:shadow-md " + common;
});

const deleteProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("delete", project);
};

const copyProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("copy", project);
};

const viewProject = (event: Event, project: Project) => {
  event.preventDefault();
  event.stopPropagation();
  emit("view", project);
};
</script>

<style scoped>
/* Grid View Layout */
.project-card-grid {
  display: grid;
  grid-template-areas:
    "thumbnail thumbnail"
    "title title"
    "info info"
    "actions actions";
  grid-template-rows: 1fr auto auto auto;
}

.project-card-grid .thumbnail {
  grid-area: thumbnail;
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--muted);
}

.project-card-grid .title {
  grid-area: title;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  padding: 1rem 1rem 0;
}

.project-card-grid:hover .title {
  color: var(--primary);
}

.project-card-grid .info {
  grid-area: info;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  padding: 0 1rem;
}

.project-card-grid .actions {
  grid-area: actions;
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem 0.75rem;
}

/* List View Layout */
.project-card-list {
  display: grid;
  grid-template-areas:
    "thumbnail title actions"
    "thumbnail info actions";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  gap: 0 1rem;
  align-items: center;
}

.project-card-list .thumbnail {
  grid-area: thumbnail;
  height: 3rem;
  width: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: var(--muted);
}

.project-card-list .title {
  grid-area: title;
  font-weight: 600;
  color: var(--foreground);
}

.project-card-list:hover .title {
  color: var(--primary);
}

.project-card-list .info {
  grid-area: info;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.project-card-list .actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Copy button tooltip */
.copy-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--popover);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms;
}

.copy-button-wrapper:hover .copy-tooltip {
  opacity: 1;
}
</style>
