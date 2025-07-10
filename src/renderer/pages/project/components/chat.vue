<template>
  <div class="h-full flex flex-col">
    <!-- Chat history (flexible height) -->
    <div
      ref="chatHistoryRef"
      class="flex-1 bg-white border rounded-lg p-4 overflow-y-auto space-y-4 min-h-0"
      v-show="messages.length > 0"
    >
      <div v-for="(message, key) in messages" :key="key">
        <BotMessage :message="message.content" time="14:30" v-if="message.role === 'assistant'" />
        <UserMessage :message="message.content" time="14:30" v-if="message.role === 'user'" />
      </div>
      <BotMessage v-if="isStreaming['llm']" :message="streamData['llm'] ?? ''" time="14:30" />
    </div>

    <!-- Chat input area (fixed height) -->
    <div class="flex-shrink-0 space-y-4 pt-4">
      <!-- Message input field -->
      <div class="chat-input-wrapper">
        <Label class="mb-2"> Enter your message: </Label>
        <div
          class="chat-input-container border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:border-2 transition-colors duration-200 flex justify-between"
        >
          <Textarea
            v-model="userInput"
            :disabled="events.length == 0"
            placeholder="ex) Thank you very much! Please proceed with the creation."
            class="flex-1 border-none outline-none px-3 py-2 text-sm bg-transparent min-w-0 field-sizing-content min-h-0"
            @keydown="handleKeydown"
          />
          <Button size="sm" @click="submitText(events[0])" :disabled="isCreatingScript">
            <Send :size="16" />
          </Button>
        </div>
      </div>

      <div>
        <Button @click="clearChat" variant="outline" size="xs"> clear chat </Button>
      </div>

      <!-- Template selection section -->
      <div class="template-section">
        <div class="rounded-lg p-1">
          <Label class="mb-3 block">
            To create a script with the content so far, please select a template and press the Create button.
          </Label>

          <!-- Template dropdown and create button -->
          <div class="template-dropdown-container flex items-center gap-4">
            <Select v-model="selectedTemplateFileName" :disabled="isCreatingScript">
              <SelectTrigger class="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(template, k) in templates" :key="k" :value="template.filename">
                  {{ template.title }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" @click="createScript" :disabled="!canCreateScript">
              <Loader2 v-if="isCreatingScript" class="w-4 h-4 mr-1 animate-spin" />
              {{ isCreatingScript ? "Creating..." : "Create Script" }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import { ref, onMounted, computed } from "vue";
import { Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { GraphAI, GraphData } from "graphai";
import { useStreamData } from "@/lib/stream";
import { textInputEvent, useChatPlugin } from "@/lib/graphai";

import BotMessage from "./chat/bot_message.vue";
import UserMessage from "./chat/user_message.vue";

import * as agents from "@graphai/vanilla";
import { openAIAgent } from "@graphai/llm_agents";
import type { MulmoScript, MulmoScriptTemplateFile } from "mulmocast";
import { ChatMessage } from "@/types";
import { useAutoScroll } from "@/pages/project/composable/use_auto_scroll";
import { notifyError } from "@/lib/notification";

const { initialMessages = [] } = defineProps<{
  initialMessages: ChatMessage[];
}>();

const emit = defineEmits<{
  "update:updateMulmoScript": [value: MulmoScript];
  "update:updateChatMessages": [value: ChatMessage[]];
}>();

const selectedTemplateFileName = ref("");

const graphChat: GraphData = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    continue: {
      value: true,
    },
    messages: {
      value: [],
      update: ":reducer.array",
    },
    userInput: {
      agent: "eventAgent",
      params: {
        message: "You:",
        isResult: true,
      },
    },
    llm: {
      agent: "openAIAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
        isResult: true,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", ":llm.message"] },
    },
  },
};

const streamNodes = ["llm"];
const outputNodes = ["llm", "userInput"];

const { eventAgent, userInput, events, submitText } = textInputEvent();
const { messages, chatMessagePlugin } = useChatPlugin(initialMessages, (messages) => {
  if (messages.at(-1)?.role === "assistant") {
    emit("update:updateChatMessages", messages);
  }
});
const chatHistoryRef = useAutoScroll(messages);
const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
const agentFilters = [
  {
    name: "streamAgentFilter",
    agent: streamAgentFilter,
  },
];

const clearChat = () => {
  messages.value = [];
  emit("update:updateChatMessages", []);
};
const run = async (initialMessages: ChatMessage[]) => {
  const env = await window.electronAPI.getEnv();
  // const prompt = await window.electronAPI.mulmoHandler("readTemplatePrompt", "podcast_standard");

  const graphai = new GraphAI(
    graphChat,
    {
      ...agents,
      openAIAgent,
      eventAgent,
    },
    {
      agentFilters,
      config: {
        openAIAgent: {
          apiKey: env.OPENAI_API_KEY,
        },
      },
    },
  );
  // graphai.injectValue("messages", [{ content: prompt, role: "system" }]);
  graphai.registerCallback(streamPlugin(streamNodes));
  graphai.registerCallback(chatMessagePlugin(outputNodes));
  graphai.injectValue("messages", initialMessages);
  await graphai.run();
};

const isCreatingScript = ref(false);
const createScript = async () => {
  try {
    isCreatingScript.value = true;
    const script = await window.electronAPI.mulmoHandler(
      "createMulmoScript",
      messages.value.map((m) => ({ role: m.role, content: m.content })),
      selectedTemplateFileName.value,
    );
    emit("update:updateMulmoScript", script as MulmoScript);
  } catch (error) {
    console.error("Failed to create script:", error);
    notifyError("Failed to create script", "Please try again");
  } finally {
    isCreatingScript.value = false;
  }
};

const templates = ref<MulmoScriptTemplateFile[]>([]);
onMounted(async () => {
  run(initialMessages);
  templates.value = await window.electronAPI.mulmoHandler("getAvailableTemplates");
  selectedTemplateFileName.value = templates.value[0].filename;
});

const canCreateScript = computed(() => messages.value.length > 0 && !isCreatingScript.value);

const handleKeydown = (e: KeyboardEvent) => {
  // Mac: command + enter, Win: ctrl + enter
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (events.value.length > 0) {
      submitText(events.value[0]);
    }
  }
};
</script>

<style scoped>
.chat-input-container {
  display: flex;
  align-items: flex-end;
}
</style>
