<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.speechParams.title") }}</h4>
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
            <h5 class="cursor-pointer text-sm font-medium" @click="changeKey(name)" v-else>{{ name }}</h5>
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
          <SpeachSpeaker
            :speaker="speaker"
            :name="name"
            @updateSpeakerData="(data, overridden) => updateSpeaker(name, data, overridden)"
            :settingPresence="settingPresence"
          />
        </div>
      </div>
      <div class="template-dropdown-container flex items-center gap-4">
        <Input
          v-model="speechKey"
          :invalid="!validateKey && speechKey !== ''"
          class="w-64"
          :placeholder="t('parameters.speechParams.placeholder')"
        />

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
import { ref, computed } from "vue";
import { Card, Button, Label, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MulmoError from "./mulmo_error.vue";
import { SPEECH_DEFAULT_LANGUAGE, VOICE_LISTS, defaultSpeechProvider } from "@/../shared/constants";
import { type MulmoSpeechParams, type Speaker, type SpeakerDictonary, defaultSpeaker } from "mulmocast/browser";
import SpeachSpeaker from "./speech_speaker.vue";

import { useI18n } from "vue-i18n";

type Provider = keyof typeof VOICE_LISTS;

const providers = Object.keys(VOICE_LISTS);

const DEFAULT_VOICE_IDS: Record<string, string> = providers.reduce((tmp, provider) => {
  tmp[provider] = VOICE_LISTS[provider][0].id;
  return tmp;
}, {});

const props = defineProps<{
  speechParams?: MulmoSpeechParams;
  mulmoError: string[];
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  update: [speechParams: MulmoSpeechParams];
}>();

const { t } = useI18n();

const speakers = computed<Record<string, Speaker>>(() => props.speechParams?.speakers || {});
const speakerCount = computed(() => Object.keys(speakers.value).length);
const canDeleteSpeaker = computed(() => speakerCount.value > 1);

const updateSpeechParams = (updates: Partial<NonNullable<MulmoSpeechParams>>): void => {
  const baseParams = props.speechParams || {
    provider: "openai" as Provider,
    speakers: {},
  };

  emit("update", {
    ...baseParams,
    ...updates,
  });
};

const updateSpeakers = (speakerUpdates: NonNullable<SpeakerDictonary>): void => {
  updateSpeechParams({ speakers: speakerUpdates });
};

const updateSpeaker = (name: string, updates: Partial<Speaker>, overridden = true): void => {
  const updatedSpeakers = { ...speakers.value };
  updatedSpeakers[name] = overridden
    ? {
        ...updatedSpeakers[name],
        ...updates,
      }
    : updates;
  updateSpeakers(updatedSpeakers);
};

const defaultSpeakerName = computed(() => {
  const entries = Object.entries(speakers.value);
  if (entries.length === 0) return "";
  const found = entries.find(([, s]) => Boolean(s.isDefault));
  return found ? found[0] : entries[0][0];
});

const handleDefaultSpeakerChange = (name: string) => {
  const updated: NonNullable<MulmoSpeechParams>["speakers"] = {};
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
  return key !== "" && /^[a-zA-Z0-9]+$/.test(key);
};

const isUpdate = ref(false);
const updateSpeakerId = ref("");
// for update
const validUpdateKey = computed(() => {
  return (
    validateKeyFunc(updateSpeakerId.value) &&
    (!Object.keys(speakers.value).includes(updateSpeakerId.value) || updateSpeakerId.value === updateKey.value)
  );
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

// for add
const validateKey = computed(() => {
  return validateKeyFunc(speechKey.value) && !Object.keys(speakers.value).includes(speechKey.value);
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
      [defaultSpeaker]: {
        voiceId: DEFAULT_VOICE_IDS[defaultSpeechProvider],
        displayName: {
          [SPEECH_DEFAULT_LANGUAGE]: defaultSpeaker,
        },
        isDefault: true,
      },
    },
  });
};
</script>
