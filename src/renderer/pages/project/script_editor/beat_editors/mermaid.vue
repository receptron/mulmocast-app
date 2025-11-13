<template>
  <Label class="mb-1 block">{{ t("beat.mermaid.label") }}</Label>
  <div class="mb-2">
    <Select v-model="selectedPreset">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="t('beat.mermaid.selectDiagramType')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(preset, key) in presets" :value="key" :key="preset.name">
          {{ t("beat.mermaid.preset." + preset.name) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div class="mb-2 flex justify-end">
    <Button size="sm" @click="updatePreset" :disabled="selectedPreset === null">
      {{ t("ui.actions.set") }}
    </Button>
  </div>

  <Input
    :placeholder="t('beat.mermaid.titleField')"
    :model-value="beat?.image?.title"
    @update:model-value="(value) => update('image.title', String(value))"
    @blur="save"
    class="mb-2"
  />
  <Textarea
    :placeholder="t('beat.mermaid.placeholder')"
    :model-value="beat?.image?.code?.text"
    @update:model-value="(value) => update('image.code.text', String(value))"
    @blur="save"
    class="font-mono"
    rows="8"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Label, Input, Textarea, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
}
defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const save = () => {
  emit("save");
};

const selectedPreset = ref<number | null>(null);

const presets = [
  {
    name: "flowchart",
    code: `graph TD
    A[Inspiration] --> B{Brainstorm}
    B -->|Yes| C[Sketch]
    B -->|No| D[Research]
    C --> E{Review}
    E -->|Polish| F[Launch]
    E -->|Revise| B`,
  },
  {
    name: "sequence",
    code: `sequenceDiagram
    participant User
    participant App
    participant AI
    User->>App: Open editor
    App->>AI: Request ideas
    AI-->>App: Return draft
    App-->>User: Show masterpiece
    User->>App: Celebrate 🎉`,
  },
  {
    name: "class",
    code: `classDiagram
    class Visionary {
      +igniteIdea()
      +refineStory()
    }
    class Muse {
      +whisper()
      +inspire()
    }
    Visionary <|-- Muse : fuels
    Visionary o-- Project : crafts
    Project : title
    Project : timeline`,
  },
  {
    name: "state",
    code: `stateDiagram-v2
    [*] --> Dreaming
    Dreaming --> Drafting : spark
    Drafting --> Editing : feedback
    Editing --> Premiere : approval
    Premiere --> [*]
    Editing --> Dreaming : reboot`,
  },
  {
    name: "gantt",
    code: `gantt
    dateFormat  YYYY-MM-DD
    title  Creative Voyage
    section Inspire
    Moodboard        :done,    a1, 2024-05-01, 3d
    Story Research   :active,  a2, 2024-05-04, 5d
    section Craft
    Script Draft     :        a3, 2024-05-09, 4d
    Visual Design    :        a4, after a3, 5d
    section Launch
    Final Cut        :crit,   a5, after a4, 3d
    Premiere Party   :milestone, 2024-05-25, 1d`,
  },
  {
    name: "journey",
    code: `journey
    title Hero's Journey
    section Call to Adventure
      Discover idea: 5: Creator
      Rally team: 4: Producer
    section Trials
      Build prototype: 3: Studio
      Iterate magic: 5: Studio
    section Triumph
      Showcase vision: 5: Audience
      Share impact: 4: Creator`,
  },
];

const updatePreset = () => {
  if (selectedPreset.value === null) return;
  const data = presets[selectedPreset.value].code.trim();
  update("image.code.text", data);
};
</script>
