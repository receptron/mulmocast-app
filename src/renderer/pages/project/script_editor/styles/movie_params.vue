<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.movieParams.title") }}</h4>
    <div class="space-y-3">
      <div class="text-muted-foreground text-sm">
        {{ t("parameters.movieParams.veo31Note") }}
      </div>
      <div>
        <Label>{{ t("ui.common.provider") }}</Label>
        <Select :model-value="movieParams?.provider" @update:model-value="handleProviderChange">
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.movieParams.providerNone')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__undefined__">{{ t("parameters.movieParams.providerNone") }}</SelectItem>
            <SelectItem v-for="provider in PROVIDERS" :key="provider.value" :value="provider.value">
              {{ t("ai.provider." + provider.name + ".name") }}
            </SelectItem>
          </SelectContent>
        </Select>
        <SettingsAlert class="mt-2" :settingPresence="settingPresence" :provider="movieParams?.provider" />
      </div>
      <div v-if="movieParams?.provider">
        <Label>{{ t("ui.common.model") }}</Label>
        <Select
          :model-value="movieParams?.model || DEFAULT_VALUES.model"
          @update:model-value="handleModelChange"
          :disabled="!movieParams?.provider"
        >
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.movieParams.modelAuto')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__undefined__">{{ t("parameters.movieParams.modelAuto") }}</SelectItem>
            <SelectItem
              v-for="model in PROVIDERS.find((p) => p.value === movieParams?.provider)?.models || []"
              :key="model"
              :value="model"
            >
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <!-- Vertex AI (Google provider only) -->
      <div v-if="movieParams?.provider === 'google'" class="space-y-2 rounded-md border p-3">
        <div class="flex items-center justify-between">
          <Label>{{ t("parameters.vertexAI.toggle") }}</Label>
          <Switch :model-value="vertexAIEnabled" @update:model-value="handleVertexAIToggle" />
        </div>
        <template v-if="vertexAIEnabled">
          <div>
            <Label class="text-xs">{{ t("parameters.vertexAI.project") }}</Label>
            <Input
              :model-value="movieParams?.vertexai_project || ''"
              @update:model-value="(value) => updateParams({ vertexai_project: String(value) })"
              :placeholder="t('parameters.vertexAI.projectPlaceholder')"
            />
          </div>
          <div>
            <Label class="text-xs">{{ t("parameters.vertexAI.location") }}</Label>
            <Input
              :model-value="movieParams?.vertexai_location || ''"
              @update:model-value="(value) => updateParams({ vertexai_location: String(value) })"
              :placeholder="t('parameters.vertexAI.locationPlaceholder')"
            />
          </div>
        </template>
      </div>
    </div>
  </Card>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.transitionParams.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label class="text-muted-foreground mb-2 text-sm">
          {{ t("parameters.transitionParams.description") }}
        </Label>
        <Label>{{ t("parameters.transitionParams.type") }}</Label>
        <Select
          :model-value="movieParams?.transition?.type || DEFAULT_VALUES.transition.type"
          @update:model-value="handleTransitionTypeChange"
        >
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.transitionParams.typeNone')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="transitionType in TRANSITION_TYPES"
              :key="transitionType.value"
              :value="transitionType.value"
            >
              {{ t(`parameters.transitionParams.${transitionType.label}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{{ t("parameters.transitionParams.duration") }}</Label>
        <Input
          :model-value="movieParams?.transition?.duration ?? DEFAULT_VALUES.transition.duration"
          @update:model-value="handleTransitionDurationChange"
          type="number"
          min="0"
          max="2"
          step="0.1"
        />
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MulmoError from "./mulmo_error.vue";
import SettingsAlert from "../settings_alert.vue";
import { defaultProviders, provider2MovieAgent, type MulmoPresentationStyle } from "mulmocast/browser";
import { TRANSITION_TYPES, DEFAULT_TRANSITION_DURATION } from "@/../shared/constants";
import { useMulmoGlobalStore } from "../../../../store";
import { isVertexAIEnabled, getVertexAIDefaults, stripVertexAIFields } from "../../../../lib/vertexai";

type MovieParams = MulmoPresentationStyle["movieParams"];

const PROVIDERS = Object.entries(provider2MovieAgent)
  .filter(([provider, __]) => {
    return provider !== "mock";
  })
  .map(([provider, agent]) => {
    return {
      name: provider,
      value: provider,
      models: agent.models,
    };
  });

const { t } = useI18n();

const props = defineProps<{
  movieParams?: MovieParams;
  mulmoError: string[];
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  update: [movieParams: MovieParams];
}>();

const DEFAULT_VALUES: MovieParams = {
  provider: defaultProviders.text2movie,
  model: "",
  transition: {
    type: undefined,
    duration: DEFAULT_TRANSITION_DURATION,
  },
};

const currentParams = computed((): MovieParams => {
  return {
    provider: props.movieParams?.provider || DEFAULT_VALUES.provider,
    model: props.movieParams?.model || DEFAULT_VALUES.model,
    transition: {
      type: props.movieParams?.transition?.type || DEFAULT_VALUES.transition.type,
      duration: props.movieParams?.transition?.duration ?? DEFAULT_VALUES.transition.duration,
    },
  };
});

const updateParams = (partial: Partial<MovieParams>) => {
  const params = {
    ...currentParams.value,
    ...partial,
    transition: partial.transition
      ? {
          ...currentParams.value.transition,
          ...partial.transition,
        }
      : currentParams.value.transition,
  };
  if (params.transition.type === undefined) {
    delete params.transition;
  }
  emit("update", params);
};

const handleProviderChange = (value: MovieParams["provider"]) => {
  updateParams({ provider: value == "__undefined__" ? undefined : value, model: undefined });
};

const handleModelChange = (value: MovieParams["model"]) => {
  updateParams({ model: value == "__undefined__" ? undefined : value });
};

const handleTransitionTypeChange = (value: MovieParams["transition"]["type"]) => {
  updateParams({
    transition: {
      type: (value == "__undefined__" ? undefined : value) as "fade" | "slideout_left",
      duration: currentParams.value.transition.duration,
    },
  });
};

const handleTransitionDurationChange = (value: MovieParams["transition"]["duration"]) => {
  updateParams({ transition: { type: currentParams.value.transition.type, duration: value } });
};

const globalStore = useMulmoGlobalStore();

const vertexAIEnabled = computed(() => isVertexAIEnabled(props.movieParams));

const handleVertexAIToggle = (enabled: boolean) => {
  if (enabled) {
    updateParams(getVertexAIDefaults(globalStore.settings.VERTEX_AI));
  } else {
    emit("update", stripVertexAIFields(props.movieParams || {}) as MovieParams);
  }
};
</script>
