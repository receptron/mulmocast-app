<template>
  <Collapsible :open="!!beat?.imageParams" @update:open="updateBeatImageParams">
    <CollapsibleTrigger as-child>
      <div class="mb-3 flex items-center gap-2">
        <Checkbox variant="ghost" size="icon" :modelValue="!!beat?.imageParams" />
        <h4 class="font-medium" :class="!beat?.imageParams ? 'text-muted-foreground' : ''">
          {{ t("parameters.imageParams.title") }}
        </h4>
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <ImageParams
        :image-params="beat.imageParams"
        :images="imageParams.images"
        :beat="beat"
        :showTitle="false"
        :defaultStyle="imageParams.style"
        @update="(value) => updateParam(value)"
        @updateImageNames="updateImageNames"
        :mulmoError="[]"
        :settingPresence="settingPresence"
      />
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui";
import { type MulmoBeat, type MulmoImageParams } from "mulmocast";
import { IMAGE_PARAMS_DEFAULT_VALUES } from "../../../../shared/constants";
import ImageParams from "./styles/image_params.vue";

const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  imageParams: MulmoImageParams;
  settingPresence: Record<string, boolean>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [key: string, imageParams: ImageParams | undefined];
  updateImageNames: [val: string[]];
  justSaveAndPushToHistory: [];
}>();

const updateParam = (value: ImageParams | undefined) => {
  emit("update", "imageParams", value);
};

const updateImageNames = (value: string[]) => {
  emit("updateImageNames", value);
};

const updateBeatImageParams = async (event) => {
  if (event) {
    const { images } = props?.imageParams ?? {};
    emit("update", "imageParams", IMAGE_PARAMS_DEFAULT_VALUES);
    await nextTick();
    emit("updateImageNames", Object.keys(images ?? {}));
  } else {
    emit("update", "imageParams", undefined);
    await nextTick();
    emit("updateImageNames", undefined);
  }
  emit("justSaveAndPushToHistory");
};
</script>
