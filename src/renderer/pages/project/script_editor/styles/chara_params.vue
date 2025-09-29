<template>
  <div v-if="Object.keys(images ?? {}).length !== 0" class="mb-4">
    <h4 class="mb-1 block text-sm">{{ t("parameters.imageParams.images") }}</h4>
    <p class="text-muted-foreground mb-2 text-xs">{{ t("parameters.imageParams.imagesDescription") }}</p>

    <Card class="mt-2 p-3">
      <div class="space-y-2">
        <div v-for="imageKey in Object.keys(images)" :key="imageKey" class="flex items-center">
          <Checkbox
            :model-value="(beat?.imageNames ?? Object.keys(images ?? {})).includes(imageKey)"
            @update:modelValue="(val) => updateImageNames(imageKey, val)"
            class="mr-2"
          />
          <span class="text-sm">{{ imageKey }}</span>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Checkbox, Card } from "@/components/ui";
import { type MulmoImageParamsImages, type MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  images?: MulmoImageParamsImages;
  beat: MulmoBeat;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateImageNames: [val: string[]];
}>();

const updateImageNames = (imageKey: string, val: string[]) => {
  const current = props.beat?.imageNames ?? [];

  const newArray = val
    ? current.includes(imageKey)
      ? current
      : [...current, imageKey]
    : current.filter((key) => key !== imageKey);

  emit("updateImageNames", newArray);
};
</script>
