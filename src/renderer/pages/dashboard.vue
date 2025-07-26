<template>
  <Layout>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Main Content -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <Button
              @click="
                showNewProjectDialog = true;
                newProjectName = '';
              "
              class="flex items-center space-x-2"
            >
              <Plus class="w-5 h-5" />
              <span>{{ t("dashboard.createNew") }}</span>
            </Button>
            <div class="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
              <Button
                @click="viewMode = VIEW_MODE.list"
                :variant="viewMode === VIEW_MODE.list ? 'default' : 'ghost'"
                size="icon"
                :class="[
                  'transition-colors',
                  viewMode === VIEW_MODE.list ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : '',
                ]"
              >
                <List class="w-5 h-5" />
              </Button>
              <Button
                @click="viewMode = VIEW_MODE.grid"
                :variant="viewMode === VIEW_MODE.grid ? 'default' : 'ghost'"
                size="icon"
                :class="[
                  'transition-colors',
                  viewMode === VIEW_MODE.grid ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : '',
                ]"
              >
                <Grid class="w-5 h-5" />
              </Button>
            </div>
            <Select :model-value="`${sortBy}-${sortOrder}`" @update:model-value="updateSort">
              <SelectTrigger class="w-[180px]">
                <SelectValue :placeholder="t('dashboard.sortBy')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="`${SORT_BY.updatedAt}-${SORT_ORDER.desc}`">{{
                  t("dashboard.sort.updatedAtDesc")
                }}</SelectItem>
                <SelectItem :value="`${SORT_BY.updatedAt}-${SORT_ORDER.asc}`">{{
                  t("dashboard.sort.updatedAtAsc")
                }}</SelectItem>
                <SelectItem :value="`${SORT_BY.title}-${SORT_ORDER.asc}`">{{
                  t("dashboard.sort.titleAsc")
                }}</SelectItem>
                <SelectItem :value="`${SORT_BY.title}-${SORT_ORDER.desc}`">{{
                  t("dashboard.sort.titleDesc")
                }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="text-sm text-gray-500">{{ t("dashboard.project", { count: projects.length }) }}</div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-16">
          <div class="text-gray-500">Loading projects...</div>
        </div>

        <!-- Empty State -->
        <div v-else-if="projects.length === 0" class="text-center py-16">
          <p class="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
        </div>

        <!-- Project List -->
        <div v-else-if="viewMode === VIEW_MODE.list">
          <ListView
            :projects="sortedProjects"
            :project-thumbnails="projectThumbnails"
            :thumbnails-loading="thumbnailsLoading"
            @delete="handleDeleteProject"
            @view="handleViewProject"
          />
        </div>

        <!-- Project Grid -->
        <div v-else-if="viewMode === VIEW_MODE.grid">
          <GridView
            :projects="sortedProjects"
            :project-thumbnails="projectThumbnails"
            :thumbnails-loading="thumbnailsLoading"
            @delete="handleDeleteProject"
            @view="handleViewProject"
          />
        </div>
      </div>
    </div>

    <!-- New Project Dialog -->
    <NewProjectDialog
      v-if="showNewProjectDialog"
      v-model="newProjectName"
      :creating="creating"
      @create="handleCreateProject"
      @cancel="handleCancelDialog"
    />

    <!-- Viewer Dialog -->
    <Dialog v-model:open="isViewerOpen">
      <DialogContent class="max-w-4xl">
        <div class="sr-only">
          <DialogTitle>Mulmo Viewer</DialogTitle>
          <DialogDescription>{{ t("modal.clickOutsideToClose") }}</DialogDescription>
        </div>
        <MulmoViewer v-if="selectedProject" :project="selectedProject" />
      </DialogContent>
    </Dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { Plus, List, Grid } from "lucide-vue-next";
import { useRouter } from "vue-router";
import Layout from "@/components/layout.vue";
import ListView from "./dashboard/list_view.vue";
import GridView from "./dashboard/grid_view.vue";
import NewProjectDialog from "./dashboard/new_project_dialog.vue";
import { projectApi, type Project } from "@/lib/project_api";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "vue-i18n";
import { INITIAL_TITLE, SORT_BY, SORT_ORDER, VIEW_MODE } from "../../shared/constants";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MulmoViewer from "@/components/mulmo_viewer.vue";

const router = useRouter();
const { t } = useI18n();
const viewMode = ref<typeof VIEW_MODE.list | typeof VIEW_MODE.grid>(VIEW_MODE.list);
const sortBy = ref<typeof SORT_BY.updatedAt | typeof SORT_BY.title>(SORT_BY.updatedAt);
const sortOrder = ref<typeof SORT_ORDER.desc | typeof SORT_ORDER.asc>(SORT_ORDER.desc);
const projects = ref<Project[]>([]);
const loading = ref(true);
const showNewProjectDialog = ref(false);
const creating = ref(false);
const newProjectName = ref("");
const projectThumbnails = ref<Record<string, ArrayBuffer | string | null>>({});
const thumbnailsLoading = ref<Record<string, boolean>>({});
const isViewerOpen = ref(false);
const selectedProject = ref<Project | null>(null);

const loadProjects = async () => {
  projects.value = await projectApi.list();
};

const loadProjectThumbnails = async () => {
  projectThumbnails.value = {};
  thumbnailsLoading.value = {};

  await Promise.all(
    projects.value.map(async (project) => {
      thumbnailsLoading.value[project.metadata.id] = true;
      try {
        const image = (await window.electronAPI.mulmoHandler("mulmoImageFile", project.metadata.id, 0)) as {
          imageData?: ArrayBuffer;
        };
        projectThumbnails.value[project.metadata.id] = image?.imageData;
      } catch (error) {
        console.error(`Failed to load thumbnail for project ${project.metadata.id}:`, error);
      } finally {
        thumbnailsLoading.value[project.metadata.id] = false;
      }
    }),
  );
};

const sortedProjects = computed(() => {
  return projects.value.toSorted((a, b) => {
    if (sortBy.value === "updatedAt") {
      const aTime = dayjs(a.metadata.updatedAt).valueOf();
      const bTime = dayjs(b.metadata.updatedAt).valueOf();
      return sortOrder.value === "desc" ? bTime - aTime : aTime - bTime;
    } else {
      const aTitle = a.script?.title?.toLowerCase() || "";
      const bTitle = b.script?.title?.toLowerCase();
      const comparison = aTitle.localeCompare(bTitle);
      return sortOrder.value === "desc" ? -comparison : comparison;
    }
  });
});

const handleCreateProject = async () => {
  const title = newProjectName.value.trim() || INITIAL_TITLE;

  try {
    creating.value = true;
    const project = await projectApi.create(title);
    // Close dialog and refresh project list
    showNewProjectDialog.value = false;
    newProjectName.value = "";
    await loadProjects();
    // Navigate to the new project
    router.push(`/project/${project.metadata.id}`);
  } catch (error) {
    console.error("Failed to create project:", error);
    alert("Failed to create project. Please try again.");
  } finally {
    creating.value = false;
  }
};

const handleCancelDialog = () => {
  showNewProjectDialog.value = false;
  newProjectName.value = "";
  creating.value = false;
};

const handleDeleteProject = async (project: Project) => {
  if (confirm(`Are you sure you want to delete "${project?.script?.title}"`)) {
    try {
      await projectApi.delete(project.metadata.id);
      await loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  }
};

const handleViewProject = async (project: Project) => {
  selectedProject.value = project;
  isViewerOpen.value = true;
};

const updateSort = (value: string) => {
  const [newSortBy, newSortOrder] = value.split("-") as ["updatedAt" | "title", "desc" | "asc"];
  sortBy.value = newSortBy;
  sortOrder.value = newSortOrder;
};

const saveSettings = async () => {
  try {
    const settings = await window.electronAPI.settings.get();
    await window.electronAPI.settings.set({
      ...settings,
      SORT_BY: sortBy.value,
      SORT_ORDER: sortOrder.value,
      VIEW_MODE: viewMode.value,
    });
  } catch (error) {
    console.error("Failed to save sort settings:", error);
  }
};

watch([sortBy, sortOrder, viewMode], () => {
  saveSettings();
});

const loadSettings = async () => {
  const settings = await window.electronAPI.settings.get();
  if (settings.SORT_BY && (settings.SORT_BY === SORT_BY.updatedAt || settings.SORT_BY === SORT_BY.title)) {
    sortBy.value = settings.SORT_BY;
  }
  if (settings.SORT_ORDER && (settings.SORT_ORDER === SORT_ORDER.desc || settings.SORT_ORDER === SORT_ORDER.asc)) {
    sortOrder.value = settings.SORT_ORDER;
  }
  if (settings.VIEW_MODE && (settings.VIEW_MODE === VIEW_MODE.list || settings.VIEW_MODE === VIEW_MODE.grid)) {
    viewMode.value = settings.VIEW_MODE;
  }
};

onMounted(async () => {
  try {
    loading.value = true;
    await Promise.all([loadSettings(), loadProjects()]);
    loadProjectThumbnails();
  } catch (error) {
    console.error("Failed to load projects:", error);
  } finally {
    loading.value = false;
  }
});
</script>
