<template>
  <div class="flex items-start space-x-3">
    <div class="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
      <Bot :size="16" class="text-primary" />
    </div>

    <div class="flex-1">
      <div
        class="chat-markdown bg-primary/10 text-foreground block max-w-md rounded-lg p-3 text-sm break-words whitespace-pre-wrap"
        v-html="safeHtml"
      />
      <p class="text-foreground mt-1 text-xs">{{ formatedTime }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Bot } from "@lucide/vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useFormatedDate } from "./date_format";

const props = defineProps<{
  message: string;
  time?: number;
}>();

const { formatedTime } = useFormatedDate(props.time ?? Date.now(), "L LT");

function markdownCodeBlocks(input: string): string {
  return input.replace(/```markdown\s*\n([\s\S]*?)\n```/g, (_, code) => {
    return marked.parse(code.trim());
  });
}

const safeHtml = computed(() => DOMPurify.sanitize(markdownCodeBlocks(props.message)));
</script>

<style>
.chat-markdown pre,
.chat-markdown code,
.chat-markdown pre code {
  white-space: pre-wrap !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  display: block !important;
}
</style>
