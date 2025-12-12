<template>
  <div class="mb-3 flex items-center gap-2">
    <Checkbox
      variant="ghost"
      size="icon"
      :modelValue="!!beat?.imageParams"
      @update:model-value="updateBeatImageParams"
    />
    <div class="group relative">
      <Label
        class="cursor-pointer"
        :class="!beat?.imageParams ? 'text-muted-foreground' : ''"
        @click="updateBeatImageParams(!beat?.imageParams)"
      >
        {{ t("parameters.imageParams.customTitle") }}
      </Label>
      <span
        class="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-0 mb-2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <div class="text-muted-foreground">{{ t("parameters.imageParams.customDescription1") }}</div>
        <div class="text-muted-foreground">
          {{ t("parameters.imageParams.customDescription2") }}
        </div>
      </span>
    </div>
  </div>
  <ImageParams
    v-if="beat?.imageParams"
    :image-params="beat.imageParams"
    :images="imageParams.images"
    :beat="beat"
    :showTitle="false"
    :defaultStyle="imageParams.style"
    @update="(value) => updateParam(value)"
    :mulmoError="[]"
    :settingPresence="settingPresence"
    :isPro="isPro"
  />
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import { type MulmoBeat, type MulmoImageParams } from "mulmocast";
import { IMAGE_PARAMS_DEFAULT_VALUES } from "../../../../shared/constants";
import ImageParams from "./styles/image_params.vue";

const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  imageParams: MulmoImageParams;
  settingPresence: Record<string, boolean>;
  isPro: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  update: [key: string, imageParams: ImageParams | undefined];
  justSaveAndPushToHistory: [];
}>();

const updateParam = (value: ImageParams | undefined) => {
  emit("update", "imageParams", value);
};

const updateBeatImageParams = async (event) => {
  if (event) {
    emit("update", "imageParams", IMAGE_PARAMS_DEFAULT_VALUES);
  } else {
    emit("update", "imageParams", undefined);
  }
  await nextTick();
  emit("justSaveAndPushToHistory");
};
</script>
