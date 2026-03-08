<template>
  <div class="mb-3 rounded-md border p-3">
    <Label class="mb-2 block font-medium">{{ t("beat.html_tailwind.effectLabel") }}</Label>

    <!-- Effect preset select -->
    <div class="mb-2">
      <Select v-model="selectedEffect">
        <SelectTrigger class="w-full">
          <SelectValue :placeholder="t('beat.html_tailwind.effectPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="effect in EFFECT_TYPES" :key="effect" :value="effect">
            {{ t(`beat.html_tailwind.effect.${effect}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Source image from materials -->
    <div class="mb-2">
      <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.sourceImage") }}</Label>
      <div class="flex items-center gap-2">
        <Button @click="openMediaLibrary" type="button" size="sm" variant="outline" class="shrink-0">
          {{ t("ui.actions.openImageLibrary") }}
        </Button>
        <span v-if="selectedImagePath" class="text-muted-foreground truncate text-sm">
          {{ selectedImageFileName }}
        </span>
      </div>
      <!-- Selected image preview -->
      <div v-if="selectedImagePreviewUrl" class="mt-2">
        <img :src="selectedImagePreviewUrl" class="h-20 rounded border object-cover" />
      </div>
    </div>

    <!-- Parameters -->
    <div class="mb-2 flex gap-3">
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.duration") }}</Label>
        <Input v-model="durationSec" type="number" min="1" max="30" />
      </div>
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.zoom") }}</Label>
        <Input v-model="zoomPercent" type="number" min="100" max="200" />
      </div>
    </div>

    <!-- Set button + custom badge -->
    <div class="flex items-center justify-between">
      <div>
        <Badge v-if="isCustomEdited" variant="secondary" class="text-xs">
          {{ t("beat.html_tailwind.customEdited") }}
        </Badge>
      </div>
      <Button size="sm" @click="applyEffect" :disabled="!selectedEffect || !selectedImagePath">
        {{ t("ui.actions.set") }}
      </Button>
    </div>
  </div>

  <MediaLibraryDialog
    ref="mediaLibraryRef"
    :project-id="projectId"
    :allowed-media-types="['image']"
    @select="handleMediaSelect"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { Label, Input, Button, Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import {
  type EffectType,
  EFFECT_TYPES,
  effectDefaults,
  generateEffectTemplate,
  isTemplateMatch,
} from "./image_effect_data";
import MediaLibraryDialog, {
  type MediaLibraryDialogExposed,
  type ProjectScriptMedia,
} from "./media_library_dialog.vue";

const { t } = useI18n();
const route = useRoute();
const projectId = computed(() => route.params.id as string);

interface Props {
  beat: MulmoBeat;
}

const props = defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const selectedEffect = ref<EffectType | null>(null);
const selectedImagePath = ref<string | null>(null);
const selectedImagePreviewUrl = ref<string | null>(null);
const durationSec = ref<number>(effectDefaults.duration);
const zoomPercent = ref<number>(effectDefaults.zoom);

// Last applied values for custom detection
const lastAppliedEffect = ref<EffectType | null>(null);
const lastAppliedImagePath = ref<string | null>(null);
const lastAppliedZoom = ref<number>(effectDefaults.zoom);

const mediaLibraryRef = ref<MediaLibraryDialogExposed | null>(null);

const selectedImageFileName = computed(() => {
  if (!selectedImagePath.value) return "";
  return selectedImagePath.value.split("/").pop() ?? "";
});

const isCustomEdited = computed(() => {
  if (!lastAppliedEffect.value || !lastAppliedImagePath.value) return false;
  return !isTemplateMatch(
    props.beat.image?.html as string | string[] | undefined,
    props.beat.image?.script as string | string[] | undefined,
    lastAppliedEffect.value,
    lastAppliedImagePath.value,
    lastAppliedZoom.value,
  );
});

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const openMediaLibrary = async () => {
  if (mediaLibraryRef.value) {
    await mediaLibraryRef.value.open();
  }
};

const handleMediaSelect = (media: ProjectScriptMedia) => {
  selectedImagePath.value = media.projectRelativePath;

  // Create preview URL from ArrayBuffer
  if (selectedImagePreviewUrl.value) {
    URL.revokeObjectURL(selectedImagePreviewUrl.value);
  }
  const blob = new Blob([media.data], { type: media.mimeType });
  selectedImagePreviewUrl.value = URL.createObjectURL(blob);
};

const applyEffect = () => {
  if (!selectedEffect.value || !selectedImagePath.value) return;

  const template = generateEffectTemplate(selectedEffect.value, selectedImagePath.value, zoomPercent.value);

  update("image.html", template.html);
  update("image.script", template.script);
  update("image.animation", true);
  update("duration", durationSec.value);

  // Track last applied for custom detection
  lastAppliedEffect.value = selectedEffect.value;
  lastAppliedImagePath.value = selectedImagePath.value;
  lastAppliedZoom.value = zoomPercent.value;

  emit("save");
};

// Reset custom detection when effect selection changes
watch(selectedEffect, () => {
  lastAppliedEffect.value = null;
});

onBeforeUnmount(() => {
  if (selectedImagePreviewUrl.value) {
    URL.revokeObjectURL(selectedImagePreviewUrl.value);
  }
});
</script>
