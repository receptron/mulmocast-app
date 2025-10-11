<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <RouterLink to="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft :size="16" class="mr-2" />
          {{ t("project.header.back") }}
        </Button>
      </RouterLink>
      <div class="min-w-0 flex-1">
        <!-- Title -->
        <div class="group relative flex items-center">
          <h1
            v-if="!isEditingTitle"
            class="max-w-sm cursor-pointer truncate text-2xl font-bold md:max-w-lg lg:max-w-2xl xl:max-w-4xl"
            @click="startEditingTitle"
            data-testid="project-title"
          >
            {{ displayTitle }}
          </h1>
          <Input
            v-else
            v-model="displayTitle"
            class="max-w-sm text-2xl font-bold md:max-w-lg lg:max-w-2xl xl:max-w-4xl"
            @blur="saveTitle"
            @keydown.enter="handleTitleEnter"
            autoFocus
          />
          <Pencil
            v-if="!isEditingTitle"
            :size="16"
            class="text-muted-foreground/60 hover:text-foreground ml-2 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            @click="startEditingTitle"
          />
        </div>

        <!-- Description -->
        <div class="group relative flex items-center">
          <p
            v-if="!isEditingDescription"
            class="text-muted-foreground max-w-sm cursor-pointer truncate md:max-w-lg lg:max-w-2xl xl:max-w-4xl"
            @click="startEditingDescription"
          >
            {{ displayDescription }}
          </p>
          <Input
            v-else
            v-model="displayDescription"
            class="text-muted-foreground max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-4xl"
            @blur="saveDescription"
            @keydown.enter="handleDescriptionEnter"
            autoFocus
          />
          <Pencil
            v-if="!isEditingDescription"
            :size="14"
            class="text-muted-foreground/60 hover:text-foreground ml-2 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            @click="startEditingDescription"
          />
        </div>

        <!-- Language Selection -->
        <div class="mt-2 flex items-center gap-2"></div>
      </div>
    </div>
    <div v-if="isDevelopment">
      <Button variant="outline" size="sm" @click="$emit('openProjectFolder')">
        <FolderOpen :size="16" class="mr-1" />
        {{ t("project.header.openProjectFolder") }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { RouterLink } from "vue-router";
import { ArrowLeft, FolderOpen, Pencil } from "lucide-vue-next";
import { Button, Input } from "@/components/ui";
import { INITIAL_DESCRIPTION } from "../../../shared/constants";
import type { MulmoScript } from "mulmocast/browser";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  mulmoScript?: MulmoScript | null;
}>();

const emit = defineEmits<{
  openProjectFolder: [];
  updateMulmoScript: [script: MulmoScript];
}>();

const isDevelopment = import.meta.env.DEV;

const isEditingTitle = ref(false);
const isEditingDescription = ref(false);

const displayTitle = ref(props.mulmoScript?.title || t("project.newProject.defaultTitle"));
const displayDescription = ref(props.mulmoScript?.description || INITIAL_DESCRIPTION);

watch(
  () => props.mulmoScript?.title,
  (newTitle) => {
    if (newTitle && !isEditingTitle.value) {
      displayTitle.value = newTitle;
    }
  },
);

watch(
  () => props.mulmoScript?.description,
  (newDescription) => {
    if (newDescription && !isEditingDescription.value) {
      displayDescription.value = newDescription;
    }
  },
);

const saveChanges = useDebounceFn((updates: Partial<MulmoScript>) => {
  if (props.mulmoScript) {
    emit("updateMulmoScript", {
      ...props.mulmoScript,
      ...updates,
    });
  }
}, 500);

const startEditingTitle = async () => {
  isEditingTitle.value = true;
};

const saveTitle = () => {
  isEditingTitle.value = false;
  saveChanges({ title: displayTitle.value });
};

const startEditingDescription = async () => {
  isEditingDescription.value = true;
};

const saveDescription = () => {
  isEditingDescription.value = false;
  saveChanges({ description: displayDescription.value });
};

const handleTitleEnter = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return;
  }
  event.preventDefault();
  saveTitle();
  (event.target as HTMLElement)?.blur();
};

const handleDescriptionEnter = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return;
  }
  event.preventDefault();
  saveDescription();
  (event.target as HTMLElement)?.blur();
};
</script>
