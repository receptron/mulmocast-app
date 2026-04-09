<template>
  <div class="flex items-start space-x-3">
    <div class="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full" :class="color.bg">
      <component :is="icon" :size="16" :class="color.text" @click="isOpen = !isOpen" />
    </div>
    <div class="flex-1">
      <div
        class="mb-2 max-w-md cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold break-words whitespace-pre-wrap"
        :class="[color.bg, color.text]"
        @click="isOpen = !isOpen"
        v-if="data"
      >
        {{ data?.func }}({{ argments }})
      </div>
      <div
        v-if="data?.isExecuting"
        class="block max-w-md rounded-lg p-3 text-sm break-words whitespace-pre-wrap"
        :class="[color.bodyBg, color.bodyText]"
      >
        <Loader2 class="h-5 w-5 animate-spin" />
      </div>
      <div
        v-else-if="!isOpen"
        class="block max-w-md rounded-lg p-3 text-sm break-words whitespace-pre-wrap"
        :class="[color.bodyBg, color.bodyText]"
      >
        {{ message.split("\n").slice(0, 3).join("\n") }}...
      </div>
      <div
        v-else
        class="block max-w-md rounded-lg p-3 text-sm break-words whitespace-pre-wrap"
        :class="[color.bodyBg, color.bodyText]"
      >
        {{ message }}
      </div>

      <div class="mt-1 flex items-center gap-2">
        <p class="text-muted-foreground text-xs">{{ formatedTime }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, ScrollText, Globe, Loader2 } from "@lucide/vue";
import { computed, ref } from "vue";
import { useFormatedDate } from "./date_format";

const props = defineProps<{
  message: string;
  time?: number;
  data?: {
    isExecuting?: boolean;
    agent: string;
    func: string;
    arg: unknown;
  };
}>();

const isOpen = ref(false);

const toolsMessageStyles = {
  exaToolsAgent: {
    icon: Search,
    color: {
      text: "text-indigo-700",
      bg: "bg-indigo-100",
      bodyText: "text-indigo-600",
      bodyBg: "bg-indigo-50",
    },
  },
  mulmoScriptValidatorAgent: {
    icon: ScrollText,
    color: {
      text: "text-emerald-700",
      bg: "bg-emerald-100",
      bodyText: "text-emerald-600",
      bodyBg: "bg-emerald-50",
    },
  },
  puppeteerAgent: {
    icon: Globe,
    color: {
      text: "text-amber-700",
      bg: "bg-amber-100",
      bodyText: "text-amber-600",
      bodyBg: "bg-amber-50",
    },
  },
};

const toolsMessageDefaultStyles = {
  icon: Search,
  color: {
    text: "text-blue-600",
    bg: "bg-blue-100",
    bodyText: "text-blue-600",
    bodyBg: "bg-blue-100",
  },
};

const icon = toolsMessageStyles[props.data.agent]?.icon ?? toolsMessageDefaultStyles.icon;
const color = toolsMessageStyles[props.data.agent]?.color ?? toolsMessageDefaultStyles.color;

const argments = computed(() => {
  if (!props.data?.arg) return "";
  const text = JSON.stringify(props.data?.arg);

  if (isOpen.value || text.length < 30) {
    return text;
  }
  return text.slice(0, 30) + "...";
});
const { formatedTime } = useFormatedDate(props.time ?? Date.now(), "L LT");
</script>
