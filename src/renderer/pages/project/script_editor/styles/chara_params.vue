<template>
  <div v-if="Object.keys(images ?? {}).length !== 0">
    <hr class="m-2" />
    <div class="mb-4">
      <div class="group relative">
        <h4 class="mb-1 block text-sm">{{ t("parameters.imageParams.images") }}</h4>
        <p class="text-muted-foreground mb-2 text-xs">{{ t("parameters.imageParams.imagesDescription") }}</p>
        <span
          class="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-0 mb-2 max-w-md transform rounded border px-2 py-1 text-xs whitespace-pre-wrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <div class="text-muted-foreground">{{ t("parameters.imageParams.imagesDescriptionNote") }}</div>
        </span>
      </div>
      <div class="mt-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="isExpanded = !isExpanded" type="button" class="h-8 px-2">
          <ChevronRight :class="['h-4 w-4 transition-transform', isExpanded && 'rotate-90']" />
          <span class="ml-1 text-xs">{{ isExpanded ? t("ui.actions.collapse") : t("ui.actions.expand") }}</span>
        </Button>
        <div v-if="!isExpanded" class="flex gap-2">
          <Button variant="outline" size="sm" @click="selectAll" type="button" class="h-8 px-2 text-xs">
            {{ t("ui.actions.selectAll") }}
          </Button>
          <Button variant="outline" size="sm" @click="deselectAll" type="button" class="h-8 px-2 text-xs">
            {{ t("ui.actions.deselectAll") }}
          </Button>
        </div>
      </div>
      <Card class="mt-2 p-3">
        <!-- Closed: Show only checked images in a grid -->
        <div v-if="!isExpanded" class="grid grid-cols-4 gap-2">
          <div v-for="imageKey in displayedImageKeys" :key="imageKey" class="group relative">
            <img
              v-if="imageRefs[imageKey]"
              :src="imageRefs[imageKey]"
              class="h-20 w-full rounded border object-cover"
              :alt="imageKey"
            />
            <div
              class="bg-background/80 absolute right-0 bottom-0 left-0 truncate px-1 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            >
              {{ imageKey }}
            </div>
          </div>
        </div>
        <!-- Expanded: Show all images with checkboxes -->
        <div v-else class="space-y-2">
          <div
            v-for="imageKey in displayedImageKeys"
            :key="imageKey"
            class="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-sm transition-colors"
            @click="toggleImageName(imageKey)"
          >
            <Checkbox :model-value="currentValues.includes(imageKey)" class="pointer-events-none mr-2" />
            <span class="flex-1 text-sm">{{ imageKey }}</span>
            <img
              v-if="imageRefs[imageKey]"
              :src="imageRefs[imageKey]"
              class="h-12 w-12 rounded border object-cover"
              alt=""
            />
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Checkbox, Card, Button } from "@/components/ui";
import { ChevronRight } from "lucide-vue-next";
import { type MulmoImageParamsImages, type MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { bufferToUrl } from "@/lib/utils";

const { t } = useI18n();

interface Props {
  images?: MulmoImageParamsImages;
  beat: MulmoBeat;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateImageNames: [val: string[]];
}>();

const route = useRoute();
const projectId = computed(() => route.params.id as string | undefined);

const isExpanded = ref(false);

const currentValues = computed(() => {
  return props.beat?.imageNames ?? Object.keys(props.images ?? {});
});

const displayedImageKeys = computed(() => {
  const allKeys = Object.keys(props.images ?? {});
  if (isExpanded.value) {
    return allKeys;
  }
  // When collapsed, only show checked images
  return allKeys.filter((key) => currentValues.value.includes(key));
});

const imageRefs = ref<Record<string, string | null>>({});

const loadReference = async () => {
  if (!projectId.value) {
    imageRefs.value = {};
    return;
  }

  const refs = (await window.electronAPI.mulmoHandler("mulmoReferenceImagesFiles", projectId.value)) as
    | Record<string, ArrayBuffer | null>
    | undefined;

  const nextRefs: Record<string, string | null> = {};
  Object.keys(props.images ?? {}).forEach((key) => {
    const buffer = refs?.[key];
    nextRefs[key] = buffer ? bufferToUrl(new Uint8Array(buffer), "image/png") : null;
  });

  imageRefs.value = nextRefs;
};

onMounted(() => {
  void loadReference();
});

watch(
  () => props.images,
  () => {
    void loadReference();
  },
  { deep: true },
);

watch(projectId, () => {
  void loadReference();
});

const updateImageNames = (imageKey: string, val: boolean) => {
  const current = currentValues.value;

  const newArray = val
    ? current.includes(imageKey)
      ? current
      : [...current, imageKey]
    : current.filter((key) => key !== imageKey);

  emit("updateImageNames", newArray);
};

const toggleImageName = (imageKey: string) => {
  const isCurrentlyChecked = currentValues.value.includes(imageKey);
  updateImageNames(imageKey, !isCurrentlyChecked);
};

const selectAll = () => {
  const allKeys = Object.keys(props.images ?? {});
  emit("updateImageNames", allKeys);
};

const deselectAll = () => {
  emit("updateImageNames", []);
};
</script>
