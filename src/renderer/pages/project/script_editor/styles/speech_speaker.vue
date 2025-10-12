<template>
  <div>
    <Label>{{ t("ui.common.provider") }}</Label>
    <Select
      :model-value="speaker.provider || defaultSpeechProvider"
      @update:model-value="(value) => handleProviderChange(value)"
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="provider in providers" :value="provider" :key="provider">{{
          t("ai.provider." + provider + ".name")
        }}</SelectItem>
      </SelectContent>
    </Select>
    <SettingsAlert
      class="mt-2"
      :settingPresence="settingPresence"
      :provider="speaker?.provider || defaultSpeechProvider"
    />
  </div>
  <div>
    <Label class="text-xs">{{ t("parameters.speechParams.voiceId") }}</Label>
    <Select :model-value="speaker.voiceId" @update:model-value="(value) => handleSpeakerVoiceChange(String(value))">
      <SelectTrigger class="h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="voice in getVoiceList(speaker.provider || defaultSpeechProvider)"
          :key="voice.id"
          :value="voice.id"
        >
          {{ t(["voiceList", speaker?.provider || defaultSpeechProvider, voice.key ?? voice.id].join(".")) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div v-if="speaker.provider === 'nijivoice'">
    <Label class="text-xs">{{ t("parameters.speechParams.speed") }}</Label>
    <Input
      :model-value="speaker.speed || ''"
      @update:model-value="(value) => handleSpeechOptionsChange('speed', value)"
      class="h-8"
      type="number"
      :placeholder="t('parameters.speechParams.speedPlaceholder')"
    />
  </div>
  <div v-if="speaker.provider === 'openai' || !speaker.provider">
    <Label class="text-xs">{{ t("parameters.speechParams.instruction") }}</Label>
    <Input
      :model-value="speaker?.speechOptions?.instruction || ''"
      @update:model-value="(value) => handleSpeechOptionsChange('instruction', value)"
      class="h-8"
      :placeholder="t('parameters.speechParams.instructionPlaceholder')"
    />
  </div>
  <div v-if="speaker.displayName">
    <Label class="text-xs">{{ t("parameters.speechParams.displayName") }}</Label>
    <p class="text-muted-foreground mb-2 text-xs">
      {{
        t("parameters.speechParams.displayNameDescription", {
          language: t("parameters.speechParams.language"),
          displayName: t("parameters.speechParams.displayName"),
        })
      }}
    </p>
    <div class="ml-2 flex items-start gap-2">
      <div class="w-1/4">
        <Label class="text-xs">{{ t("parameters.speechParams.language") }}</Label>
        <Select
          :model-value="selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE"
          @update:model-value="(value) => handleLanguageChange(name, String(value))"
        >
          <SelectTrigger class="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="lang in SPEECH_LANGUAGES" :key="lang.id" :value="lang.id">
              {{ t("languages." + lang.id) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="w-3/4">
        <Label class="text-xs"
          >{{ t("parameters.speechParams.displayName") }} ({{
            t("languages." + (selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE))
          }})
        </Label>
        <Input
          :model-value="speaker.displayName[selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE] || ''"
          @update:model-value="
            (value) => handleDisplayNameChange(name, selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE, String(value))
          "
          class="h-8"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Speaker, MulmoSpeechParams } from "mulmocast/browser";
import { SPEECH_LANGUAGES, SPEECH_DEFAULT_LANGUAGE, VOICE_LISTS, defaultSpeechProvider } from "@/../shared/constants";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label, Input } from "@/components/ui";

import SettingsAlert from "../settings_alert.vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const providers = Object.keys(VOICE_LISTS);
const DEFAULT_VOICE_IDS: Record<string, string> = providers.reduce((tmp, provider) => {
  tmp[provider] = VOICE_LISTS[provider][0].id;
  return tmp;
}, {});

type Provider = keyof typeof VOICE_LISTS;

const props = defineProps<{
  speaker?: Speaker;
  name: string;
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  updateSpeakerData: [speechParams: MulmoSpeechParams];
}>();

const getVoiceList = (provider: string) => {
  return VOICE_LISTS[provider as Provider] || VOICE_LISTS.openai;
};

const selectedLanguages = ref<Record<string, string>>({});

const handleSpeakerVoiceChange = (voiceId: string) => {
  emit("updateSpeakerData", { voiceId });
};

const handleProviderChange = async (provider: string) => {
  const voiceId = DEFAULT_VOICE_IDS[provider];
  const updatedSpeakers = {
    provider,
    voiceId,
    displayName: props.speaker.displayName,
  };
  emit("updateSpeakerData", updatedSpeakers, false);
};

const handleSpeechOptionsChange = (key: string, value: string) => {
  emit("updateSpeakerData", { speechOptions: { [key]: key === "speed" ? Number(value) : value } });
};

const handleDisplayNameChange = (language: string, value: string) => {
  emit("updateSpeakerData", {
    displayName: {
      ...props.speaker.displayName,
      [language]: value,
    },
  });
};
</script>
