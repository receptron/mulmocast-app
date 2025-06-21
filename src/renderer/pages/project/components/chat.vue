<template>
  <div class="space-y-4">
    <!-- Chat history -->
    <div ref="chatHistoryRef" class="bg-white border rounded-lg p-4 h-80 overflow-y-auto space-y-4">
      <div v-for="(message, key) in messages" :key="key">
        <BotMessage :message="message.content" time="14:30" v-if="message.role === 'assistant'" />
        <UserMessage :message="message.content" time="14:30" v-if="message.role === 'user'" />
      </div>
      <BotMessage v-if="isStreaming['llm']" :message="streamData['llm']" time="14:30" />
    </div>

    <!-- Chat input area - Slack-style design -->
    <div class="space-y-4">
      <!-- Message input field -->
      <div class="chat-input-wrapper">
        <label class="text-sm font-medium text-gray-700 mb-2 block"> Enter your message: </label>
        <div
          class="chat-input-container border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:border-2 transition-colors duration-200 flex justify-between"
        >
          <textarea
            v-model="userInput"
            :disabled="events.length == 0"
            placeholder="ex) Thank you very much! Please proceed with the creation."
            class="flex-1 border-none outline-none px-3 py-2 text-sm bg-transparent min-w-0"
            @keydown="handleKeydown"
          />
          <Button
            size="sm"
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 m-1 rounded-md"
            @click="submitText(events[0])"
            :disabled="isCreatingScript"
          >
            <Send :size="16" />
          </Button>
        </div>
      </div>

      <!-- Template selection section -->
      <div class="template-section">
        <div class="rounded-lg p-1">
          <label class="text-sm font-medium text-gray-700 mb-3 block">
            To create a script with the content so far, please select a template and press the Create button.
          </label>

          <!-- Template dropdown and create button -->
          <div class="template-dropdown-container flex items-center gap-4">
            <select
              v-model="selectedTemplateFileName"
              class="template-dropdown border-2 border-gray-300 rounded-full px-4 py-2 text-sm text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200"
              :disabled="isCreatingScript"
            >
              <option v-for="(template, k) in templates" :key="k" :value="template.filename">
                {{ template.title }}
              </option>
            </select>
            <Button
              size="sm"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full"
              @click="createScript"
              :disabled="isCreatingScript"
            >
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
import { ref, onMounted } from "vue";
import { Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

import { GraphAI, GraphData } from "graphai";
import { useStreamData } from "@/lib/stream";
import { textInputEvent, useChatPlugin } from "@/lib/graphai";

import BotMessage from "./bot_message.vue";
import UserMessage from "./user_message.vue";

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
  align-items: center;
}
</style>
