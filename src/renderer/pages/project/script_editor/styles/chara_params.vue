<template>
  <div v-if="Object.keys(images ?? {}).length !== 0" class="mb-4">
    <h4 class="mb-1 block text-sm">{{ t("parameters.imageParams.images") }}</h4>
    <p class="text-muted-foreground mb-2 text-xs">{{ t("parameters.imageParams.imagesDescription") }}</p>
    <Card class="mt-2 p-3">
      <div class="space-y-2">
        <div v-for="imageKey in Object.keys(images ?? {})" :key="imageKey" class="flex items-center gap-3">
          <Checkbox
            :model-value="currentValues.includes(imageKey)"
            @update:modelValue="(val) => updateImageNames(imageKey, val)"
            class="mr-2"
          />
          <span class="text-sm flex-1">{{ imageKey }}</span>
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Checkbox, Card } from "@/components/ui";
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

const currentValues = computed(() => {
  return props.beat?.imageNames ?? Object.keys(props.images ?? {});
});

const imageRefs = ref<Record<string, string | null>>({});

const loadReference = async () => {
  if (!projectId.value) {
    imageRefs.value = {};
    return;
  }

  const refs = (await window.electronAPI.mulmoHandler(
    "mulmoReferenceImagesFiles",
    projectId.value,
  )) as Record<string, ArrayBuffer | null> | undefined;

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
</script>
