<template>
  <Layout>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <!-- Quick Create Section -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-4 flex items-center space-x-2">
          <Sparkles class="text-primary h-6 w-6" />
          <h2 class="text-xl font-bold">{{ t("dashboard.quickCreate.sectionTitle") }}</h2>
        </div>
        <p class="text-muted-foreground mb-4 text-sm">{{ t("dashboard.quickCreate.sectionDescription") }}</p>

        <!-- Template Selection -->
        <div class="mb-3 flex flex-wrap gap-3">
          <label
            v-for="template in customPromptTemplates"
            :key="template.filename"
            class="border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-muted"
            :class="{ 'bg-primary/10 border-primary': selectedTemplateFilename === template.filename }"
          >
            <input
              type="radio"
              :value="template.filename"
              v-model="selectedTemplateFilename"
              class="text-primary focus:ring-primary"
            />
            <span class="text-sm font-medium">{{ template.title }}</span>
          </label>
        </div>

        <!-- URL Input -->
        <div class="flex gap-2">
          <Input
            v-model="quickCreateUrl"
            type="url"
            :placeholder="t('dashboard.quickCreate.urlPlaceholder')"
            class="flex-1"
            @keydown.enter="handleQuickCreate"
          />
          <Button @click="handleQuickCreate" :disabled="!quickCreateUrl.trim() || !selectedTemplate">
            <Sparkles class="mr-2 h-4 w-4" />
            {{ t("ui.actions.create") }}
          </Button>
        </div>

        <!-- Template Settings Display -->
        <StyleInfoDisplay v-if="selectedTemplate" :mulmoScript="selectedTemplate.presentationStyle" />

        <p v-if="quickCreateError" class="text-destructive mt-2 text-sm">{{ quickCreateError }}</p>
      </div>

      <!-- Main Content -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button @click="handleCreateProject" class="flex items-center space-x-2" data-testid="create-new-button">
              <Plus class="h-5 w-5" />
              <span>{{ t("dashboard.createNew") }}</span>
            </Button>
            <div class="border-border bg-card flex items-center space-x-2 rounded-lg border p-1">
              <Button
                @click="viewMode = VIEW_MODE.list"
                :variant="viewMode === VIEW_MODE.list ? 'default' : 'ghost'"
                size="icon"
                :class="[
                  'transition-colors',
                  viewMode === VIEW_MODE.list ? 'bg-primary/10 text-primary hover:bg-primary/10' : '',
                ]"
              >
                <List class="h-5 w-5" />
              </Button>
              <Button
                @click="viewMode = VIEW_MODE.grid"
                :variant="viewMode === VIEW_MODE.grid ? 'default' : 'ghost'"
                size="icon"
                :class="[
                  'transition-colors',
                  viewMode === VIEW_MODE.grid ? 'bg-primary/10 text-primary hover:bg-primary/10' : '',
                ]"
              >
                <Grid class="h-5 w-5" />
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
          <div class="text-muted-foreground text-sm">{{ t("dashboard.project", { count: projects.length }) }}</div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="text-muted-foreground">{{ t("ui.status.loadingProjects") }}</div>
        </div>

        <!-- Empty State -->
        <div v-else-if="projects.length === 0" class="py-16 text-center">
          <div class="space-y-4">
            <h2 class="text-foreground text-2xl font-bold">{{ t("dashboard.empty.welcome") }}</h2>
            <div class="text-muted-foreground mx-auto max-w-2xl space-y-2 text-left">
              <p>{{ t("dashboard.empty.introduction1", { createNew: t("dashboard.createNew") }) }}</p>
              <p>{{ t("dashboard.empty.introduction2", { generateVideo: t("project.generate.generateVideo") }) }}</p>
              <br />
              <p>{{ t("dashboard.empty.introduction3") }}</p>
              <p>{{ t("dashboard.empty.introduction4") }}</p>
              <br />
              <p>{{ t("dashboard.empty.introduction5") }}</p>
            </div>
          </div>
        </div>

        <!-- Project Items -->
        <div v-else>
          <ProjectItems
            :projects="sortedProjects"
            :project-thumbnails="projectThumbnails"
            :thumbnails-loading="thumbnailsLoading"
            :view-mode="viewMode"
            @delete="handleDeleteProject"
            @copy="handleCopyProject"
            @view="handleViewProject"
          />
        </div>
      </div>
    </div>

    <!-- Viewer Dialog -->

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="deleteDialog.open"
      :dialog-title-key="deleteDialog.dialogTitleKey"
      :dialog-title-params="deleteDialog.dialogTitleParams"
      :dialog-description-key="deleteDialog.dialogDescriptionKey"
      :loading="deleteDialog.loading"
      confirm-label-key="ui.actions.delete"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { Plus, List, Grid, Sparkles } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { mulmoScriptSchema } from "mulmocast/browser";
import dayjs from "dayjs";

import Layout from "@/components/layout.vue";
import ProjectItems from "./dashboard/project_items.vue";
import StyleInfoDisplay from "./project/script_editor/style_info_display.vue";

import { Button, ConfirmDialog, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useMulmoGlobalStore } from "@/store";

import { projectApi, type Project } from "@/lib/project_api";
import { SORT_BY, SORT_ORDER, VIEW_MODE } from "../../shared/constants";
import { customPromptTemplates } from "@/data/custom_templates";
import { notifyError } from "@/lib/notification";

const globalStore = useMulmoGlobalStore();
const router = useRouter();
const { t } = useI18n();
const viewMode = ref<typeof VIEW_MODE.list | typeof VIEW_MODE.grid>(VIEW_MODE.list);
const sortBy = ref<typeof SORT_BY.updatedAt | typeof SORT_BY.title>(SORT_BY.updatedAt);

// Delete dialog state
const deleteDialog = ref({
  open: false,
  dialogTitleKey: "",
  dialogTitleParams: {},
  dialogDescriptionKey: "",
  loading: false,
  projectToDelete: null as Project | null,
});
const sortOrder = ref<typeof SORT_ORDER.desc | typeof SORT_ORDER.asc>(SORT_ORDER.desc);
const projects = ref<Project[]>([]);
const loading = ref(true);
const creating = ref(false);
const projectThumbnails = ref<Record<string, ArrayBuffer | string | null>>({});
const thumbnailsLoading = ref<Record<string, boolean>>({});

// Quick create section state
const quickCreateUrl = ref("");
const quickCreateError = ref("");
const selectedTemplateFilename = ref("vertical_short_nano");

// Selected template computed
const selectedTemplate = computed(() => {
  return customPromptTemplates.find((t) => t.filename === selectedTemplateFilename.value);
});

const loadProjects = async () => {
  projects.value = await projectApi.list();
  projects.value.map((project) => {
    const res = mulmoScriptSchema.safeParse(project.script);
    project.isValud = res.success;
  });
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

/*
const hasProjects = computed(() => {
  return projects.value.length > 0;
});
*/

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

const buildCopiedTitle = (project: Project) => {
  const baseTitle = project?.script?.title || t("project.newProject.defaultTitle");
  return t("dashboard.copy.copiedTitle", { title: baseTitle });
};

const handleCreateProject = async () => {
  const title = t("project.newProject.defaultTitle");
  const settings = await window.electronAPI.settings.get();

  const onboardProject = settings.onboardProject ?? 0;
  if (onboardProject < 3) {
    await window.electronAPI.settings.set({
      ...settings,
      onboardProject: onboardProject + 1,
    });
  }

  try {
    creating.value = true;
    // First project gets sample data, subsequent projects start empty
    // const isFirstProject = !hasProjects.value;
    const project = await projectApi.create(title, settings.APP_LANGUAGE ?? "en", onboardProject);
    // Navigate to the new project
    router.push(`/project/${project.metadata.id}`);
  } catch (error) {
    console.error("Failed to create project:", error);
    alert(t("dashboard.errors.createProjectFailed"));
  } finally {
    creating.value = false;
  }
};

const handleQuickCreate = async () => {
  if (!quickCreateUrl.value.trim()) {
    quickCreateError.value = t("dashboard.quickCreate.urlRequired");
    return;
  }

  if (!selectedTemplate.value) {
    quickCreateError.value = t("dashboard.quickCreate.templateRequired");
    return;
  }

  try {
    quickCreateError.value = "";
    const settings = await window.electronAPI.settings.get();
    const title = selectedTemplate.value.title;
    const project = await projectApi.create(title, settings.APP_LANGUAGE ?? "en", 999);

    // Apply selected template to the project script
    const scriptWithTemplate = {
      ...(project.script ?? {}),
      ...selectedTemplate.value.presentationStyle,
    };

    await projectApi.saveProjectScript(project.metadata.id, scriptWithTemplate);

    // Clear the URL input
    const urlToPass = quickCreateUrl.value;
    quickCreateUrl.value = "";

    // Navigate to the project with URL in query parameter for auto-execution
    router.push({
      path: `/project/${project.metadata.id}`,
      query: { quickCreateUrl: urlToPass, templateFilename: selectedTemplateFilename.value },
    });
  } catch (error) {
    console.error("Failed to create quick project:", error);
    quickCreateError.value = t("dashboard.quickCreate.createFailed");
    notifyError(
      t("dashboard.quickCreate.createFailed"),
      error instanceof Error ? error.message : String(error),
    );
  }
};

const handleCopyProject = async (project: Project) => {
  try {
    const copiedProject = await projectApi.copy(project.metadata.id);
    await projectApi.saveProjectScript(copiedProject.metadata.id, {
      ...(copiedProject.script ?? {}),
      title: buildCopiedTitle(project),
    });
    // Navigate to the copied project
    router.push(`/project/${copiedProject.metadata.id}`);
  } catch (error) {
    console.error("Failed to copy project:", error);
    alert(t("dashboard.errors.copyProjectFailed"));
  }
};

const handleDeleteProject = (project: Project) => {
  deleteDialog.value = {
    open: true,
    // "dashboard.confirmDelete" expects {title} param from dialogTitleParams
    dialogTitleKey: "dashboard.confirmDelete", // I18n key. This key needs param
    dialogTitleParams: { title: project?.script?.title || t("project.newProject.defaultTitle") },
    dialogDescriptionKey: "ui.messages.cannotUndo", // I18n key. No params needed
    loading: false,
    projectToDelete: project,
  };
};

const confirmDelete = async () => {
  if (!deleteDialog.value.projectToDelete) return;

  deleteDialog.value.loading = true;
  try {
    await projectApi.delete(deleteDialog.value.projectToDelete.metadata.id);
    await loadProjects();
    deleteDialog.value.open = false;
  } catch (error) {
    console.error("Failed to delete project:", error);
    alert(t("dashboard.errors.deleteProjectFailed"));
  } finally {
    deleteDialog.value.loading = false;
  }
};

const cancelDelete = () => {
  deleteDialog.value = {
    open: false,
    dialogTitleKey: "",
    dialogTitleParams: {},
    dialogDescriptionKey: "",
    loading: false,
    projectToDelete: null,
  };
};

const handleViewProject = async (project: Project) => {
  globalStore.setMulmoViewerProjectId(project.metadata.id);
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
