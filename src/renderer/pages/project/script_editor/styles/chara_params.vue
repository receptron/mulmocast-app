<template>
  <div v-if="Object.keys(images ?? {}).length !== 0" class="mb-4">
    <h4 class="font-medium">{{ t("parameters.imageParams.images") }}</h4>

    <Card class="mt-2 p-4">
      <div class="space-y-3">
        <div v-for="imageKey in Object.keys(images)" :key="imageKey">
          <Checkbox
            :model-value="(beat?.imageNames ?? Object.keys(images ?? {})).includes(imageKey)"
            @update:modelValue="(val) => updateImageNames(imageKey, val)"
            class="m-2"
          />{{ imageKey }}
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
