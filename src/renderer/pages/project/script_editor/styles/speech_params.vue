<template>
  <Card class="p-4">
    <h4 class="mb-3 font-medium">{{ t("parameters.speechParams.title") }}</h4>
    <div v-if="speechParams" class="space-y-4">
      <div v-if="speechParams.speakers && Object.keys(speechParams.speakers).length" class="mb-2">
        <Label class="mb-2">{{ t("parameters.speechParams.defaultSpeaker") }}</Label>
        <Select
          :model-value="defaultSpeakerName"
          @update:model-value="(value) => handleDefaultSpeakerChange(String(value))"
        >
          <SelectTrigger class="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(_, name) in speechParams.speakers" :key="name" :value="name">
              {{ name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div v-if="speechParams.speakers && Object.keys(speechParams.speakers).length" class="mt-4 mb-2">
        <Label class="mb-2">{{ t("parameters.speechParams.speakers") }}</Label>
      </div>
      <div
        v-if="speechParams.speakers"
        v-for="(speaker, name) in speechParams.speakers"
        :key="name"
        class="rounded border p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <div>
            <div class="template-dropdown-container flex items-center gap-4" v-if="isUpdate && updateKey === name">
              <Input v-model="updateSpeakerId" :invalid="!validUpdateKey" /><Button
                @click="handleUpdateSpeakerId"
                :disabled="!validUpdateKey"
                >{{ t("ui.actions.update") }}</Button
              >
            </div>
            <h5 class="text-sm font-medium" @click="changeKey(name)" v-else>{{ name }}</h5>
          </div>
          <Button
            v-if="Object.keys(speechParams.speakers).length > 1"
            variant="ghost"
            size="sm"
            @click="handleDeleteSpeaker(name)"
            class="text-destructive hover:text-destructive/80"
          >
            {{ t("ui.actions.delete") }}
          </Button>
        </div>
        <div class="space-y-2">
          <div>
            <Label>{{ t("ui.common.provider") }}</Label>
            <Select
              :model-value="speaker.provider || defaultSpeechProvider"
              @update:model-value="(value) => handleProviderChange(name, value)"
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
            <Select
              :model-value="speaker.voiceId"
              @update:model-value="(value) => handleSpeakerVoiceChange(name, String(value))"
            >
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
              @update:model-value="(value) => handleSpeechOptionsChange(name, 'speed', value)"
              class="h-8"
              type="number"
            />
          </div>
          <div v-if="speaker.provider === 'openai'">
            <Label class="text-xs">{{ t("parameters.speechParams.instruction") }}</Label>
            <Input
              :model-value="speaker.instruction || ''"
              @update:model-value="(value) => handleSpeechOptionsChange(name, 'instruction', value)"
              class="h-8"
            />
          </div>
          <div v-if="speaker.displayName">
            <div class="mb-2">
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
            <div>
              <Label class="text-xs"
                >{{ t("parameters.speechParams.displayName") }} ({{
                  t("languages." + (selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE))
                }})
              </Label>
              <Input
                :model-value="speaker.displayName[selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE] || ''"
                @update:model-value="
                  (value) =>
                    handleDisplayNameChange(name, selectedLanguages[name] || SPEECH_DEFAULT_LANGUAGE, String(value))
                "
                class="h-8"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="template-dropdown-container flex items-center gap-4">
        <Input v-model="speechKey" :invalid="!validateKey && speechKey !== ''" class="w-64" />

        <Button variant="outline" size="sm" @click="handleAddSpeaker" :disabled="!validateKey">{{
          t("ui.actions.addThing", { thing: t("ui.common.speaker") })
        }}</Button>
      </div>
      <div></div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
    <div v-else>
      <p class="text-muted-foreground mb-2 text-sm">{{ t("parameters.speechParams.noSpeakersDefined") }}</p>
      <Button variant="outline" size="sm" @click="initializeSpeechParams">{{
        t("parameters.speechParams.initializeSpeechParameters")
      }}</Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { Card, Button, Label, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MulmoError from "./mulmo_error.vue";
import { SPEECH_LANGUAGES, SPEECH_DEFAULT_LANGUAGE, VOICE_LISTS, defaultSpeechProvider } from "@/../shared/constants";
import type { MulmoPresentationStyle } from "mulmocast/browser";
import SettingsAlert from "../settings_alert.vue";

import { useI18n } from "vue-i18n";

type SpeechParams = MulmoPresentationStyle["speechParams"];
type Provider = keyof typeof VOICE_LISTS;
type Speaker = NonNullable<SpeechParams>["speakers"][string];

const providers = Object.keys(VOICE_LISTS);

const DEFAULT_VOICE_IDS: Record<string, string> = providers.reduce((tmp, provider) => {
  tmp[provider] = VOICE_LISTS[provider][0].id;
  return tmp;
}, {});

const props = defineProps<{
  speechParams?: SpeechParams;
  mulmoError: string[];
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  update: [speechParams: SpeechParams];
}>();

const { t } = useI18n();

const selectedLanguages = ref<Record<string, string>>({});

const speakers = computed<Record<string, Speaker>>(() => props.speechParams?.speakers || {});
const speakerCount = computed(() => Object.keys(speakers.value).length);
const canDeleteSpeaker = computed(() => speakerCount.value > 1);

const getVoiceList = (provider: string) => {
  return VOICE_LISTS[provider as Provider] || VOICE_LISTS.openai;
};

const updateSpeechParams = (updates: Partial<NonNullable<SpeechParams>>): void => {
  const baseParams = props.speechParams || {
    provider: "openai" as Provider,
    speakers: {},
  };

  emit("update", {
    ...baseParams,
    ...updates,
  });
};

const updateSpeakers = (speakerUpdates: NonNullable<SpeechParams>["speakers"]): void => {
  updateSpeechParams({ speakers: speakerUpdates });
};

const updateSpeaker = (name: string, updates: Partial<Speaker>): void => {
  const updatedSpeakers = { ...speakers.value };
  updatedSpeakers[name] = {
    ...updatedSpeakers[name],
    ...updates,
  };
  updateSpeakers(updatedSpeakers);
};

const handleProviderChange = async (name: string, provider: string) => {
  updateSpeaker(name, { provider });
  await nextTick();
  const voiceId = DEFAULT_VOICE_IDS[provider];
  updateSpeaker(name, { voiceId });
};

const handleLanguageChange = (name: string, language: string) => {
  selectedLanguages.value[name] = language;
};

const handleSpeechOptionsChange = (name: string, key: string, value: string) => {
  updateSpeaker(name, { speechOptions: { [key]: key === "speed" ? Number(value) : value } });
};

const handleSpeakerVoiceChange = (name: string, voiceId: string) => {
  updateSpeaker(name, { voiceId });
};

const handleDisplayNameChange = (name: string, language: string, value: string) => {
  const speaker = speakers.value[name];
  if (!speaker) return;

  updateSpeaker(name, {
    displayName: {
      ...speaker.displayName,
      [language]: value,
    },
  });
};

const defaultSpeakerName = computed(() => {
  const entries = Object.entries(speakers.value);
  if (entries.length === 0) return "";
  const found = entries.find(([, s]) => Boolean(s.isDefault));
  return found ? found[0] : entries[0][0];
});

const handleDefaultSpeakerChange = (name: string) => {
  const updated: NonNullable<SpeechParams>["speakers"] = {};
  for (const [key, sp] of Object.entries(speakers.value)) {
    updated[key] = { ...sp, isDefault: key === name } as Speaker;
  }
  updateSpeakers(updated);
};

const handleDeleteSpeaker = (name: string) => {
  if (!canDeleteSpeaker.value) return;

  const { [name]: __, ...remainingSpeakers } = speakers.value;
  updateSpeakers(remainingSpeakers);
};

// add or update key
const validateKeyFunc = (key: string) => {
  return key !== "" && /^[a-zA-Z0-9]+$/.test(key) && !Object.keys(speakers.value).includes(key);
};

const isUpdate = ref(false);
const updateSpeakerId = ref("");
const validUpdateKey = computed(() => {
  return validateKeyFunc(updateSpeakerId.value);
});

const updateKey = ref("");
const changeKey = (key: string) => {
  if (isUpdate.value) {
    return;
  }
  isUpdate.value = true;
  updateSpeakerId.value = key;
  updateKey.value = key;
};
const handleUpdateSpeakerId = () => {
  if (!isUpdate.value || !validUpdateKey.value) {
    return;
  }
  const { [updateKey.value]: __, ...newSpeakers } = speakers.value;
  newSpeakers[updateSpeakerId.value] = speakers.value[updateKey.value];
  updateSpeakers({
    ...newSpeakers,
    [updateSpeakerId.value]: speakers.value[updateKey.value],
  });

  isUpdate.value = false;
  updateSpeakerId.value = "";
  updateKey.value = "";
};

const speechKey = ref("");

const validateKey = computed(() => {
  return validateKeyFunc(speechKey.value);
});

const handleAddSpeaker = () => {
  if (!validateKey.value) {
    return;
  }
  updateSpeakers({
    ...speakers.value,
    [speechKey.value]: {
      provider: defaultSpeechProvider,
      voiceId: DEFAULT_VOICE_IDS[defaultSpeechProvider],
      displayName: {
        [SPEECH_DEFAULT_LANGUAGE]: speechKey.value,
      },
    },
  });
  speechKey.value = "";
};

const initializeSpeechParams = () => {
  updateSpeechParams({
    speakers: {
      Presenter: {
        voiceId: DEFAULT_VOICE_IDS[defaultSpeechProvider],
        displayName: {
          [SPEECH_DEFAULT_LANGUAGE]: "Presenter",
        },
        isDefault: true,
      },
    },
  });
};
</script>
