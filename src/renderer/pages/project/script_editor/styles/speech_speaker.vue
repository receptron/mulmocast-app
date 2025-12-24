<template>
  <div>
    <Label>{{ t("ui.common.provider") }}</Label>
    <Select
      :model-value="localizedSpeaker.provider || defaultSpeechProvider"
      @update:model-value="(value) => handleProviderChange(value)"
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="provider in providers" :value="provider" :key="provider">
          {{ t("ai.provider." + provider + ".speechName") }}
        </SelectItem>
      </SelectContent>
    </Select>
    <SettingsAlert
      class="mt-2"
      :settingPresence="settingPresence"
      :provider="localizedSpeaker?.provider || defaultSpeechProvider"
    />
  </div>
  <div v-if="localizedSpeaker.provider === 'gemini' || localizedSpeaker.provider === 'elevenlabs'">
    <!-- model -->
    <Label class="text-xs">{{ t("ui.common.model") }}</Label>
    <Select
      :model-value="localizedSpeaker.model || '__undefined__'"
      @update:model-value="(value) => handleModelChange(String(value))"
    >
      <SelectTrigger class="h-8">
        <SelectValue :placeholder="t('parameters.speechParams.modelDefault')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__undefined__">{{ t("parameters.speechParams.modelDefault") }}</SelectItem>
        <SelectItem v-for="model in modelList" :key="model" :value="model">
          {{ model }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div>
    <!-- voiceId -->
    <Label class="text-xs">{{ t("parameters.speechParams.voiceId") }}</Label>
    <Select
      :model-value="localizedSpeaker.voiceId"
      @update:model-value="(value) => handleSpeakerVoiceChange(String(value))"
    >
      <SelectTrigger class="h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="voice in getVoiceList(localizedSpeaker.provider || defaultSpeechProvider)"
          :key="voice.id"
          :value="voice.id"
        >
          {{
            voice.name ||
            t(["voiceList", localizedSpeaker?.provider || defaultSpeechProvider, voice.key ?? voice.id].join("."))
          }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div v-if="localizedSpeaker.provider === 'kotodama'">
    <!-- decoration -->
    <Label class="text-xs">{{ t("parameters.speechParams.decoration") }}</Label>
    <Select
      :model-value="speaker?.speechOptions?.decoration || 'neutral'"
      @update:model-value="(value) => handleSpeechOptionsChange('decoration', value)"
    >
      <SelectTrigger class="h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="decoration in getDecorationList('kotodama')" :key="decoration.id" :value="decoration.id">
          {{ t(["decorationList", "kotodama", decoration.key ?? decoration.id].join(".")) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div v-if="audioPreviewUrl">
    <audio :src="audioPreviewUrl" controls @loadedmetadata="(e) => (e.target.volume = 0.3)" />
  </div>
  <div v-if="localizedSpeaker.provider === 'nijivoice'">
    <!-- speed -->
    <Label class="text-xs">{{ t("parameters.speechParams.speed") }}</Label>
    <Input
      :model-value="speaker.speed || ''"
      @update:model-value="(value) => handleSpeechOptionsChange('speed', value)"
      class="h-8"
      type="number"
      :placeholder="t('parameters.speechParams.speedPlaceholder')"
    />
  </div>
  <div v-if="supportsInstruction">
    <!-- instruction -->
    <Label class="text-xs">{{ t("parameters.speechParams.instruction") }}</Label>
    <Input
      :model-value="speaker?.speechOptions?.instruction || ''"
      @update:model-value="(value) => handleSpeechOptionsChange('instruction', value)"
      class="h-8"
      :placeholder="t('parameters.speechParams.instructionPlaceholder')"
    />
  </div>
  <div v-if="false">
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
          @update:model-value="(value) => handleLanguageChange(String(value))"
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
            (value) => handleDisplayNameChange(selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE, String(value))
          "
          class="h-8"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type Speaker, provider2TTSAgent } from "mulmocast/browser";
import {
  SPEECH_LANGUAGES,
  SPEECH_DEFAULT_LANGUAGE,
  VOICE_LISTS,
  DECORATION_LISTS,
  defaultSpeechProvider,
} from "@/../shared/constants";
import { useMulmoScriptHistoryStore, useVoiceCloneStore } from "@/store";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label, Input } from "@/components/ui";

import SettingsAlert from "../settings_alert.vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps<{
  speaker?: Speaker;
  name: string;
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  updateSpeakerData: [updates: Partial<Speaker>, overridden?: boolean];
}>();

const providers = Object.keys(VOICE_LISTS);
const DEFAULT_VOICE_IDS: Record<string, string> = providers.reduce((tmp, provider) => {
  tmp[provider] = VOICE_LISTS[provider][0].id;
  return tmp;
}, {});

type Provider = keyof typeof VOICE_LISTS;

const defaultDecoration = "neutral";

const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();

const getVoiceList = (provider: string) => {
  const baseVoices = VOICE_LISTS[provider as Provider] || VOICE_LISTS.openai;

  // Add voice clone voices for elevenlabs
  if (provider === "elevenlabs" && Array.isArray(voiceCloneStore.voices)) {
    const clonedVoices = voiceCloneStore.voices.map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
    }));
    return [...baseVoices, ...clonedVoices];
  }

  return baseVoices;
};

type DecorationProvider = keyof typeof DECORATION_LISTS;

const getDecorationList = (provider: string) => {
  return DECORATION_LISTS[provider as DecorationProvider] || [];
};

type TTSProvider = keyof typeof provider2TTSAgent;

const voiceCloneStore = useVoiceCloneStore();

// const selectedLanguages = ref<Record<string, string>>({});
// const handleLanguageChange = (language: string) => {
//   console.log(language);
// };

const localizedSpeaker = computed(() => {
  const lang = mulmoScriptHistoryStore.lang;
  if (props.speaker?.lang?.[lang]) {
    return {
      ...props.speaker,
      ...props.speaker.lang[lang],
    };
  }
  return props.speaker;
});

const modelList = computed(() => {
  const ttsProvider = provider2TTSAgent[localizedSpeaker.value.provider as TTSProvider];
  return ttsProvider?.models || [];
});
const currentModel = computed(() => {
  const ttsProvider = provider2TTSAgent[localizedSpeaker.value.provider as TTSProvider];
  return localizedSpeaker.value.model ?? ttsProvider.defaultModel;
});

const currentDecoration = computed(() => {
  return props.speaker?.speechOptions?.decoration ?? defaultDecoration;
});

const supportsInstruction = computed(() => {
  const provider = localizedSpeaker.value?.provider;
  return provider === "openai" || provider === "gemini" || !provider;
});

const audioPreviewUrl = computed(() => {
  const provider = localizedSpeaker.value.provider || defaultSpeechProvider;
  const voiceId = localizedSpeaker.value.voiceId;
  const baseUrl = "https://github.com/receptron/mulmocast-media/raw/refs/heads/main/voice";

  if (!voiceId) return null;

  switch (provider) {
    case "openai":
      return `${baseUrl}/${provider}/${voiceId}.mp3`;

    case "gemini":
      return `${baseUrl}/${provider}/${currentModel.value}/${voiceId}.mp3`;

    case "elevenlabs": {
      // Check if this is a cloned voice first
      if (Array.isArray(voiceCloneStore.voices)) {
        const clonedVoice = voiceCloneStore.voices.find((v) => v.voice_id === voiceId);
        if (clonedVoice?.previewUrl) {
          return clonedVoice.previewUrl;
        }
      }

      // Fall back to built-in voices
      const voice = getVoiceList(provider).find((a) => a.id === voiceId);
      if (!voice?.key) return null;
      return `${baseUrl}/${provider}/${currentModel.value}/${voice.key}.mp3`;
    }

    case "nijivoice": {
      const voice = getVoiceList(provider).find((a) => a.id === voiceId);
      if (!voice?.key) return null;
      return `${baseUrl}/${provider}/${voice.key}.mp3`;
    }

    case "kotodama": {
      const voice = getVoiceList(provider).find((a) => a.id === voiceId);
      if (!voice?.key) return null;
      return `${baseUrl}/${provider}/${voice.key}_${currentDecoration.value}.mp3`;
    }

    default:
      return null;
  }
});

const handleSpeakerVoiceChange = (voiceId: string) => {
  const lang = mulmoScriptHistoryStore.lang;
  if (props.speaker?.lang?.[lang]) {
    const langData = { ...props.speaker.lang };
    langData[lang].voiceId = voiceId;
    emit("updateSpeakerData", {
      lang: langData,
    });
  } else {
    emit("updateSpeakerData", { voiceId });
  }
};

const handleProviderChange = async (provider: string) => {
  type ProviderKey = keyof typeof provider2TTSAgent;
  const providerConfig = provider2TTSAgent[provider as ProviderKey];

  const voiceId = providerConfig?.defaultVoice || DEFAULT_VOICE_IDS[provider];
  const updatedSpeakers: Partial<Speaker> = {
    provider,
    voiceId,
    displayName: props.speaker.displayName,
  };

  // Set default decoration for kotodama
  if (provider === "kotodama" && providerConfig?.defaultDecoration) {
    updatedSpeakers.speechOptions = {
      decoration: providerConfig.defaultDecoration,
    };
  }

  const lang = mulmoScriptHistoryStore.lang;
  if (props.speaker?.lang?.[lang]) {
    const langData = { ...props.speaker.lang };
    langData[lang] = updatedSpeakers;
    emit("updateSpeakerData", {
      lang: langData,
    });
  } else {
    emit("updateSpeakerData", updatedSpeakers, false);
  }
};

const handleSpeechOptionsChange = (key: string, value: string) => {
  emit("updateSpeakerData", { speechOptions: { [key]: key === "speed" ? Number(value) : value } });
};

const handleModelChange = (model: string) => {
  const lang = mulmoScriptHistoryStore.lang;
  const updatedModel = model === "__undefined__" ? undefined : model;

  if (props.speaker?.lang?.[lang]) {
    const langData = { ...props.speaker.lang };
    if (updatedModel === undefined) {
      delete langData[lang].model;
    } else {
      langData[lang].model = updatedModel;
    }
    emit("updateSpeakerData", {
      lang: langData,
    });
  } else {
    if (updatedModel === undefined) {
      // Remove model from speaker data
      const { model: __model, ...speakerWithoutModel } = props.speaker || {};
      emit("updateSpeakerData", speakerWithoutModel);
    } else {
      emit("updateSpeakerData", { model: updatedModel });
    }
  }
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
