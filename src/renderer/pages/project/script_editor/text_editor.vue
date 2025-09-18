<template>
  <div class="text-foreground flex items-center justify-between font-bold">
    <span>{{ t("ui.common.beat") }} {{ index + 1 }}</span>
    <Badge variant="outline">{{ t("beat." + getBadge(beat) + ".badge") }}</Badge>
  </div>
  <div>
    <Label>{{ t("ui.common.speaker") }}</Label>
    <Select :model-value="beat?.speaker" @update:model-value="(value) => update(index, 'speaker', String(value))">
      <SelectTrigger class="h-8">
        <SelectValue :placeholder="t('beat.speaker.selectSpeaker')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(_, name) in speakers" :key="name" :value="name">
          {{ name }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div>
    <Label>{{ t("beat.speaker.text") }} ({{ t("languages." + lang) }})</Label>
    <Textarea
      :model-value="beat.text"
      @update:model-value="(value) => update(index, 'text', String(value))"
      @blur="justSaveAndPushToHistory"
      :placeholder="
        t('beat.speaker.placeholder', {
          speaker: beat?.speaker || t('ui.common.speaker'),
          language: t('languages.' + lang),
        })
      "
      rows="1"
      class="min-h-8 resize-y"
    />
  </div>
  <Button variant="outline" size="sm" @click="generateAudio(index)" class="w-fit">{{
    t("ui.actions.generateAudio")
  }}</Button>
  <span v-if="mulmoEventStore.sessionState?.[projectId]?.['beat']?.['audio']?.[index]">{{
    t("ui.status.generating")
  }}</span>
  <audio :src="audioFile" v-if="!!audioFile" controls />
  <!-- multi lingal -->
  <div v-if="supporLanguages.length > 0">
    <Button variant="outline" size="sm" @click="translateBeat(index)" class="w-fit">{{
      t("ui.actions.translateBeat")
    }}</Button>
  </div>
  <div v-for="(lang, key) in supporLanguages" :key="key">
    {{ t("languages." + lang) }}
    <Input
      :model-value="multiLingualDataset[lang]"
      @blur="saveMultiLingual"
      @update:model-value="(val) => (multiLingualDataset[lang] = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  type MulmoBeat,
  type MultiLingualTexts,
  type MulmoPresentationStyle,
  type MulmoScript,
  languages,
  splitText,
  provider2TTSAgent,
  MulmoStudioContextMethods,
} from "mulmocast/browser";

import { Button, Label, Input, Badge, Textarea } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBadge } from "@/lib/beat_util.js";

import { useMulmoEventStore, useMulmoGlobalStore } from "@/store";
import { notifyProgress } from "@/lib/notification";
import { getConcurrentTaskStatusMessageComponent } from "../concurrent_task_status_message";

const { t } = useI18n();
const mulmoEventStore = useMulmoEventStore();
const globalStore = useMulmoGlobalStore();

interface Props {
  index: number;
  beat: MulmoBeat;
  audioFile?: string;
  projectId: string;
  lang: string;
  mulmoMultiLingual: MultiLingualTexts;
  speakers?: MulmoPresentationStyle["speechParams"]["speakers"];
  mulmoScript: MulmoScript;
}
const props = defineProps<Props>();

const emit = defineEmits(["update", "justSaveAndPushToHistory", "updateMultiLingual"]);

const supporLanguages = computed(() => {
  const data = (globalStore.settings ?? {})?.USE_LANGUAGES ?? {};
  return Object.keys(data).reduce((tmp, current) => {
    if (data[current]) {
      tmp.push(current);
    }
    return tmp;
  }, []);
});

const update = (index: number, path: string, value: unknown) => {
  emit("update", index, path, value);
};
const justSaveAndPushToHistory = () => {
  emit("justSaveAndPushToHistory");
};
const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(props.projectId);

const generateAudio = async (index: number) => {
  const { provider }  = MulmoStudioContextMethods.getAudioParam({...props.mulmoScript, presentationStyle: props.mulmoScript }, props.beat, props.lang);
  const { keyName } = provider2TTSAgent[provider];
  if (!globalStore?.hasApiKey(keyName)) {
    alert("You need setup " + keyName);
    return;
  }
  
  notifyProgress(window.electronAPI.mulmoHandler("mulmoGenerateBeatAudio", props.projectId, index), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: t("notify.audio.successMessage"),
    errorMessage: t("notify.audio.errorMessage"),
  });
};

const translateBeat = async (index: number) => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoTranslateBeat", props.projectId, index, supporLanguages.value), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: t("notify.translate.successMessage"),
    errorMessage: t("notify.translate.errorMessage"),
  });
};

const multiLingualDataset = ref({});

const saveMultiLingual = async () => {
  const data = supporLanguages.value.reduce((tmp, key) => {
    tmp[key] = {
      ...props.mulmoMultiLingual[key],
      text: multiLingualDataset.value[key] ?? "",
      texts: splitText({ localizedText: { text: multiLingualDataset.value[key] ?? "" }, targetLang: key }),
      ttsTexts: splitText({ localizedText: { text: multiLingualDataset.value[key] ?? "" }, targetLang: key }),
      lang: key,
    };
    return tmp;
  }, {});
  await window.electronAPI.mulmoHandler("mulmoUpdateMultiLingual", props.projectId, props.index, data);
  emit("updateMultiLingual");
};

const convMultiLingualData = (mulmoMultiLingual?: MultiLingualTexts) => {
  const newData = {};
  languages.forEach((lang) => {
    if (mulmoMultiLingual?.[lang]?.text) {
      newData[lang] = mulmoMultiLingual?.[lang]?.text;
    }
  });
  return newData;
};

watch(
  () => props.mulmoMultiLingual,
  (mulmoMultiLingual) => {
    multiLingualDataset.value = convMultiLingualData(mulmoMultiLingual);
  },
  { deep: true, immediate: true },
);
</script>
