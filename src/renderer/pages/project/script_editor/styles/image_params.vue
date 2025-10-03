<template>
  <Card class="mt-4 p-4">
    <h4 class="text-sm font-medium">{{ t("parameters.imageParams.title") }}</h4>

    <div class="space-y-3">
      <div>
        <Label>{{ t("ui.common.provider") }}</Label>
        <Select :model-value="imageProvider" @update:model-value="handleProviderChange">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="provider in PROVIDERS" :key="provider.value" :value="provider.value">
              {{ t("ai.provider." + provider.name + ".name") }}
            </SelectItem>
          </SelectContent>
        </Select>
        <SettingsAlert class="mt-2" :settingPresence="settingPresence" :provider="imageProvider" />
      </div>
      <div>
        <Label>{{ t("ui.common.model") }}</Label>
        <Select
          :model-value="imageParams?.model || IMAGE_PARAMS_DEFAULT_VALUES.model"
          @update:model-value="(value) => handleUpdate('model', String(value))"
        >
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.imageParams.modelAuto')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__undefined__">{{ t("parameters.imageParams.modelAuto") }}</SelectItem>
            <SelectItem
              v-for="model in PROVIDERS.find((p) => p.value === imageProvider)?.models || []"
              :key="model"
              :value="model"
            >
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{{ t("ui.common.renderingQuality") }}</Label>
        <Select
          :model-value="imageParams?.quality || IMAGE_PARAMS_DEFAULT_VALUES.quality"
          @update:model-value="(value) => handleUpdate('quality', String(value))"
        >
          <SelectTrigger>
            <SelectValue :placeholder="defaultQuality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="quality in qualityOptions" :key="quality" :value="quality">
              {{ quality }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{{ t("ui.common.style") }}</Label>
        <Input
          :model-value="imageParams?.style || IMAGE_PARAMS_DEFAULT_VALUES.style"
          @update:model-value="(value) => handleUpdate('style', String(value))"
          :placeholder="defaultStyle ?? t('parameters.imageParams.stylePlaceholder')"
        />
      </div>
      <div class="my-2" v-if="isPro">
        <Label>{{ t("parameters.imageParams.moderation") }}</Label>
        <Input
          :model-value="imageParams?.moderation || IMAGE_PARAMS_DEFAULT_VALUES.moderation"
          @update:model-value="(value) => handleUpdate('moderation', String(value))"
          :placeholder="t('parameters.imageParams.moderationPlaceholder')"
        />
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Label, Input, Card } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MulmoError from "./mulmo_error.vue";
import { provider2ImageAgent, type MulmoImageParams, type MulmoBeat, type Text2ImageProvider } from "mulmocast/browser";
import { mulmoOpenAIImageModelSchema } from "mulmocast/browser";

import SettingsAlert from "../settings_alert.vue";

import { IMAGE_PARAMS_DEFAULT_VALUES } from "../../../../../shared/constants";

const { t } = useI18n();
const qualityOptions = mulmoOpenAIImageModelSchema.shape.quality._def.innerType.options;
const defaultQuality = "auto";

const PROVIDERS = Object.entries(provider2ImageAgent)
  .filter(([provider, __]) => {
    return provider !== "mock";
  })
  .map(([provider, agent]) => ({
    name: provider,
    value: provider,
    models: agent.models,
  }));

const props = withDefaults(
  defineProps<{
    imageParams?: MulmoImageParams;
    mulmoError: string[];
    beat?: MulmoBeat;
    showTitle?: boolean;
    defaultStyle?: string;
    settingPresence: Record<string, boolean>;
    isPro: boolean;
  }>(),
  { showTitle: true },
);

const emit = defineEmits<{
  update: [imageParams: MulmoImageParams];
}>();

const handleProviderChange = (value: Text2ImageProvider) => {
  if (value !== props.imageParams?.provider) {
    emit("update", { ...props.imageParams, provider: value, model: undefined });
  }
};

const imageProvider = computed(() => {
  return props.imageParams?.provider || IMAGE_PARAMS_DEFAULT_VALUES.provider;
});

const handleUpdate = (field: keyof MulmoImageParams, value: string) => {
  const currentParams = props.imageParams || {};
  emit("update", {
    ...IMAGE_PARAMS_DEFAULT_VALUES,
    ...currentParams,
    [field]: value == "__undefined__" ? undefined : value,
  });
};
</script>
