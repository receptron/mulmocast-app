<template>
  <div>
    <CharaParams :beat="beat" :images="imageParams.images" @updateImageNames="updateImageNames" />
    <Collapsible :open="!!beat?.imageParams" @update:open="updateBeatImageParams" v-if="isPro">
      <CollapsibleTrigger as-child>
        <div class="mb-3">
          <div class="flex items-center gap-2">
            <Checkbox variant="ghost" size="icon" :modelValue="!!beat?.imageParams" />
            <h4 class="text-sm font-medium" :class="!beat?.imageParams ? 'text-muted-foreground' : ''">
              {{ t("parameters.imageParams.customTitle") }}
            </h4>
          </div>
          <p class="text-xs text-muted-foreground mt-1 ml-6" v-if="!!beat?.imageParams">
            {{ t("parameters.imageParams.customDescription") }}
          </p>
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
          :mulmoError="[]"
          :settingPresence="settingPresence"
          :isPro="isPro"
        />
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui";
import { type MulmoBeat, type MulmoImageParams } from "mulmocast";
import { IMAGE_PARAMS_DEFAULT_VALUES } from "../../../../shared/constants";
import ImageParams from "./styles/image_params.vue";
import CharaParams from "./styles/chara_params.vue";

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
    emit("update", "imageParams", IMAGE_PARAMS_DEFAULT_VALUES);
  } else {
    emit("update", "imageParams", undefined);
  }
  await nextTick();
  emit("justSaveAndPushToHistory");
};
</script>
