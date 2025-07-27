<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Chat history -->
    <div
      ref="chatHistoryRef"
      class="bg-white border rounded-lg p-4 h-80 lg:flex-1 overflow-y-auto space-y-4"
      v-show="messages.length > 0 || isRunning"
    >
      <div v-for="(message, key) in messages" :key="key">
        <BotMessage :message="message.content" :time="message.time" v-if="message.role === 'assistant'" />
        <UserMessage
          :message="message.content"
          :time="message.time"
          v-if="message.role === 'user'"
          @editUser="() => editUser(key)"
        />
      </div>
      <UserMessage :message="userInput" v-if="userInput !== ''" />
      <BotMessage v-if="isStreaming['llm']" :message="streamData['llm'] ?? ''" />
    </div>

    <!-- Chat input area - Slack-style design -->
    <div class="space-y-4">
      <!-- Message input field -->
      <div class="chat-input-wrapper">
        <Label class="mb-2">{{ t("project.chat.enterMessage") }} </Label>
        <div class="chat-input-container transition-colors duration-200 flex justify-between items-center">
          <Textarea
            ref="textareaRef"
            autofocus
            v-model="userInput"
            :disabled="isRunning"
            placeholder="ex) Thank you very much! Please proceed with the creation."
            class="flex-1 border-none outline-none px-3 py-2 text-sm bg-transparent min-w-0 field-sizing-content min-h-0 max-h-48 border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:border-2"
            @keydown="handleKeydown"
          />
          <Button size="sm" @click="run()" :disabled="isCreatingScript || isRunning || noChatText" class="ml-2">
            <Send :size="16" />
          </Button>
        </div>
      </div>

      <div>
        <Button @click="clearChat" variant="outline" size="xs"> {{ t("project.chat.clearChat") }} </Button>
      </div>

      <!-- Template selection section -->
      <div class="template-section">
        <div class="rounded-lg p-1">
          <Label class="mb-3 block">
            {{ t("project.chat.createButtonDescription") }}
          </Label>

          <!-- Template dropdown and create button -->
          <div class="template-dropdown-container flex items-center gap-4">
            <Select v-model="selectedTemplateIndex" :disabled="isRunning">
              <SelectTrigger class="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(template, k) in promptTemplates" :key="k" :value="k">
                  {{ template.title }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" @click="copyScript" :disabled="noChatMessages || isRunning">
              {{ t("project.chat.copyScript") }}
            </Button>
            <Button size="sm" @click="createScript" :disabled="noChatMessages || noChatText || isRunning">
              {{ t(isCreatingScript ? "project.chat.creating" : "project.chat.createScript") }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { GraphAI } from "graphai";
import { useStreamData } from "@/lib/stream";

import { useI18n } from "vue-i18n";

import BotMessage from "./chat/bot_message.vue";
import UserMessage from "./chat/user_message.vue";

import * as agents from "@graphai/vanilla";
import { openAIAgent } from "@graphai/llm_agents";
import { validateSchemaAgent } from "mulmocast/browser";
import type { MulmoScript } from "mulmocast/browser";
import { promptTemplates, scriptTemplates } from "mulmocast/data";

import { ChatMessage } from "@/types";
import { useAutoScroll } from "@/pages/project/composable/use_auto_scroll";

// import { notifyError } from "@/lib/notification";
import { setRandomBeatId } from "@/lib/beat_util.js";

import { graphChat, graphGenerateMulmoScript } from "./chat/graph";
import { defaultSchema } from "./chat/utils";

const { t } = useI18n();
const { messages = [] } = defineProps<{
  messages: ChatMessage[];
}>();

const emit = defineEmits<{
  "update:updateMulmoScript": [value: MulmoScript];
  "update:updateChatMessages": [value: ChatMessage[]];
}>();

const selectedTemplateIndex = ref(0);

const streamNodes = ["llm"];

const userInput = ref("");
const textareaRef = useTemplateRef("textareaRef");

const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
const agentFilters = [
  {
    name: "streamAgentFilter",
    agent: streamAgentFilter,
  },
];
const chatHistoryRef = useAutoScroll([streamData, userInput, messages]);

const clearChat = () => {
  emit("update:updateChatMessages", []);
};

const graphAIAgents = {
  ...agents,
  openAIAgent,
  validateSchemaAgent,
};
const filterMessage = (message, setTime = false) => {
  if (setTime) {
    return { role: message.role, content: message.content, time: message.time ?? Date.now() };
  }
  return { role: message.role, content: message.content };
};

const isRunning = ref(false);
const run = async () => {
  if (isRunning.value) {
    return;
  }
  isRunning.value = true;

  try {
    const env = await window.electronAPI.getEnv();
    const graphai = new GraphAI(graphChat, graphAIAgents, {
      agentFilters,
      config: {
        openAIAgent: {
          apiKey: env.OPENAI_API_KEY,
        },
      },
    });
    graphai.registerCallback(streamPlugin(streamNodes));
    graphai.injectValue("messages", messages.map(filterMessage));
    graphai.injectValue("prompt", userInput.value);
    const res = await graphai.run();

    const newMessages = [
      ...messages.map((message) => filterMessage(message, true)),
      { content: userInput.value, role: "user", time: Date.now() },
      filterMessage(res.llm.message, true),
    ];
    //console.log(newMessages);
    userInput.value = "";
    emit("update:updateChatMessages", newMessages);
  } catch (error) {
    console.log(error);
  }
  isRunning.value = false;
};

const isCreatingScript = ref(false);

// system prompt and user prompt
// const specificOutputPrompt = `The output should follow the JSON schema specified below. Please provide your response as valid JSON within \`\`\`json code blocks for clarity..`;
const copyScript = async () => {
  const { scriptName, systemPrompt, presentationStyle } = promptTemplates[selectedTemplateIndex.value];
  const scriptTemplate = scriptName
    ? scriptTemplates.find((template) => {
        return template.filename === scriptName.split(".")[0];
      })
    : defaultSchema.properties;
  userInput.value = [systemPrompt, JSON.stringify({...scriptTemplate, presentationStyle})].join("\n\n");
};
// end of system prompt

const createScript = async () => {
  if (isRunning.value) {
    return;
  }
  isRunning.value = true;

  try {
    const env = await window.electronAPI.getEnv();
    const graphai = new GraphAI(graphGenerateMulmoScript, graphAIAgents, {
      agentFilters,
      config: {
        openAIAgent: {
          apiKey: env.OPENAI_API_KEY,
        },
      },
    });
    graphai.registerCallback(streamPlugin(streamNodes));
    graphai.injectValue("messages", messages.map(filterMessage));
    graphai.injectValue("prompt", userInput.value);
    // graphai.injectValue("systemPrompt", scriptTemplatePrompt);
    // graphai.injectValue("systemPrompt", specificOutputPrompt);
    const res = await graphai.run();

    const script = res.mulmoScript.data;
    script.beats.map(setRandomBeatId);
    emit("update:updateMulmoScript", script);

    const newMessages = [
      ...messages.map((message) => filterMessage(message, true)),
      { content: userInput.value, role: "user", time: Date.now() },
      { content: JSON.stringify(script ?? {}, null, 2), role: "assistant", time: Date.now() },
    ];
    userInput.value = "";
    emit("update:updateChatMessages", newMessages);
  } catch (error) {
    console.log(error);
  }
  isRunning.value = false;
};

const noChatMessages = computed(() => messages.length === 0);
const noChatText = computed(() => userInput.value.length === 0);

const handleKeydown = (e: KeyboardEvent) => {
  // Mac: command + enter, Win: ctrl + enter
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (userInput.value.length > 0 && !isRunning.value) {
      run();
    }
  }
};

const editUser = (index: number) => {
  textareaRef.value.focus();
  userInput.value = messages[index].content;

  const newMessages = [...messages];
  newMessages.length = index;
  emit("update:updateChatMessages", newMessages);
};
</script>
