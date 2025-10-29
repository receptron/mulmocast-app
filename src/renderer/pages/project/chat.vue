<template>
  <div class="flex h-full flex-col space-y-2">
    <div class="flex flex-wrap">
      <SelectLanguage :mulmoScript="mulmoScript" @updateMulmoScript="(script) => emit('updateMulmoScript', script)" />
      <div class="template-dropdown-container flex items-center gap-4">
        <Select v-model="conversationMode">
          <SelectTrigger class="border-border ml-2 h-6! w-auto text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="mode in conversationModes" :key="mode.value" :value="mode.value">
              {{ t("project.chat.conversationModes." + mode.value) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <!-- Chat history -->
    <div
      ref="chatHistoryRef"
      class="border-border bg-muted/50 h-80 space-y-4 overflow-y-auto rounded-lg border p-4 lg:flex-1"
      v-show="messages.length > 0 || isRunning"
    >
      <div v-for="(message, key) in messages" :key="key">
        <BotMessage
          :message="message.content ?? ''"
          :time="message.time"
          v-if="message.role === 'assistant' && message.content"
        />
        <ToolsMessage
          :message="message.content ?? ''"
          :time="message.time"
          :data="message?.extra"
          v-if="message.role === 'tool' && message.content"
        />
        <UserMessage
          :message="message.content"
          :time="message.time"
          v-if="message.role === 'user'"
          @editUser="() => editUser(key)"
        />
      </div>
      <UserMessage :message="userInput" v-if="isRunning" />

      <ToolsMessage
        :message="liveToolsData.content ?? ''"
        :data="liveToolsData?.data"
        v-if="liveToolsData && isRunning"
      />
      <BotMessage v-if="isStreaming['llm'] && streamData['llm']" :message="streamData['llm'] ?? ''" />
      <BotMessage
        v-if="isStreaming['llmCallWithTools'] && streamData['llmCallWithTools']"
        :message="streamData['llmCallWithTools'] ?? ''"
      />
      <BotMessage
        v-if="isStreaming['toolsResponseLLM'] && streamData['toolsResponseLLM']"
        :message="streamData['toolsResponseLLM'] ?? ''"
      />
      <div
        v-if="isRunning"
        class="bg-muted text-muted-foreground flex max-w-md items-center rounded-lg p-3 text-xs break-words whitespace-pre-wrap"
      >
        {{ t("ui.actions.runningThing", { thing: `${currentRunningAgent}/${currentRunningNode}` }) }}
        <Loader2 class="h-3 w-3 animate-spin" />
      </div>
    </div>

    <!-- Chat input area - Slack-style design -->
    <div class="space-y-4">
      <!-- Message input field -->
      <div>
        <Label class="mb-2">
          {{ t("project.chat.enterMessage") }}
          <span class="text-muted-foreground">{{ `(${llmAgent}${hasExa ? " with Search" : ""})` }}</span>
        </Label>
        <div class="chat-input-container flex items-center justify-between">
          <Textarea
            ref="textareaRef"
            autofocus
            v-model="userInput"
            :disabled="isRunning"
            :placeholder="t('project.chat.exampleMessage')"
            class="border-border bg-background focus:border-primary focus:ring-primary/20 field-sizing-content max-h-48 min-h-0 min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:ring-2"
            @keydown="handleKeydown"
          />
          <Button
            size="sm"
            @click="run()"
            :disabled="isCreatingScript || isRunning || noChatText"
            class="ml-2 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <Send :size="16" />
          </Button>
          <Button
            size="sm"
            @click="run(true)"
            :disabled="isCreatingScript || isRunning"
            class="ml-2 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            v-if="messages.length > 0 && isOpenAI"
          >
            <FileCode :size="16" />
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap">
        <Button @click="undoMessages" variant="outline" size="xs" class="mr-4" v-if="messageHistory.length > 0">
          {{ t("project.chat.undoChat") }}
        </Button>
        <Button @click="() => (isClearChatDialogOpen = true)" variant="outline" size="xs">
          {{ t("project.chat.clearChat") }}
        </Button>
      </div>
      <div v-if="isDevelopment">
        <Button variant="outline" size="xs" @click="copyMessageToClipboard">
          {{ t("project.chat.copyMessage") }}
        </Button>
        <Label class="mt-2 ml-2 inline-flex">
          <Checkbox v-model="enableTools" variant="ghost" size="icon" />
          {{ t("project.chat.enableTools") }}
        </Label>
      </div>

      <!-- Template selection section -->
      <div class="template-section" v-if="false">
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
                  {{ t("project.chat.templates." + template.filename) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="mt-4 flex">
            <Button size="sm" @click="copyScript" :disabled="noChatMessages || isRunning" class="mr-2">
              {{ t("project.chat.copyScript") }}
            </Button>
          </div>
        </div>
      </div>
    </div>
    <ConfirmDialog
      :open="isClearChatDialogOpen"
      dialogTitleKey="project.chat.confirmClear"
      dialogDescriptionKey="ui.messages.cannotUndo"
      confirmVariant="destructive"
      confirmLabelKey="ui.actions.clearChat"
      @update:open="(v) => (isClearChatDialogOpen = v)"
      @confirm="
        () => {
          clearChat();
          isClearChatDialogOpen = false;
        }
      "
    />
  </div>
</template>

<script setup lang="ts">
// vue
import { ref, computed, useTemplateRef } from "vue";
import { Send, Loader2, FileCode } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

// graphai
import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";
import { openAIAgent, geminiAgent, anthropicAgent, groqAgent } from "@graphai/llm_agents";
import exaToolsAgent from "../../agents/exa_agent";
import puppeteerAgent from "../../agents/puppeteer_agent";
// import toolsAgent from "../../agents/tools_agent";
import mulmoCastHelpAgent from "../../agents/help_agent";
import { toolsAgent } from "@graphai/tools_agent";
import toolsAgentWithChoice from "../../agents/tools_agent";

// mulmo
import { validateSchemaAgent } from "mulmocast/browser";
import type { MulmoScript } from "mulmocast/browser";
import { promptTemplates, templateDataSet } from "mulmocast/data";

import { useApiErrorNotify } from "@/composables/notify";

// components
import { Button, Checkbox, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog.vue";

import { ChatMessage } from "@/types";
import { useStreamData } from "@/lib/stream";
import { setRandomBeatId } from "@/lib/beat_util.js";

import { useAutoScroll } from "@/pages/project/composable/use_auto_scroll";
import { useMulmoGlobalStore, useMulmoScriptHistoryStore } from "@/store";

import SelectLanguage from "./select_language.vue";
import BotMessage from "./chat/bot_message.vue";
import UserMessage from "./chat/user_message.vue";
import ToolsMessage from "./chat/tools_message.vue";
import { graphChatWithSearch } from "./chat/graph";
import mulmoScriptValidatorAgent from "../../agents/mulmo_script_validator";
import mulmoVisionAgent from "../../agents/mulmo_vision_agent";
import mulmoScriptAgent from "../../agents/mulmo_script";
// presentation manuscript

import { useSystemPrompt, conversationModes } from "./chat_system_prompt";
import { mulmoScriptTools } from "./chat_tools";

import enLang from "../../i18n/en";
import {
  LLM_OLLAMA_DEFAULT_CONFIG,
  LLM_OPENAI_DEFAULT_CONFIG,
  LLM_ANTHROPIC_DEFAULT_CONFIG,
  LLM_DEFAULT_AGENT,
  LLM_GROQ_DEFAULT_MODEL,
  llms,
} from "../../../shared/constants";

import { notifyError, notifySuccess } from "@/lib/notification";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();

const { apiErrorNotify, hasApiKey } = useApiErrorNotify();

const { messages = [] } = defineProps<{
  messages: ChatMessage[];
  mulmoScript?: MulmoScript;
}>();

const isDevelopment = import.meta.env.DEV;
const llmAgent = computed(() => {
  return globalStore.settings.CHAT_LLM || LLM_DEFAULT_AGENT;
});

const emit = defineEmits<{
  updateMulmoScript: [value: MulmoScript];
  "update:updateChatMessages": [value: ChatMessage[]];
  resetMediaFiles: [];
}>();

const selectedTemplateIndex = ref(0);
const isClearChatDialogOpen = ref(false);

const streamNodes = ["llm", "toolsResponseLLM", "llmCallWithTools"];

const userInput = ref("");
const textareaRef = useTemplateRef("textareaRef");
const enableTools = ref(true);

const { getSystemPrompt, conversationMode } = useSystemPrompt();

// for running...
const liveToolsData = ref<null | Record<string, unknown>>(null);
const isRunning = ref(false);
const currentRunningAgent = ref<string | null>(null);
const currentRunningNode = ref<string | null>(null);
const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
const agentFilters = [
  {
    name: "streamAgentFilter",
    agent: streamAgentFilter,
  },
];
// end of running

const chatHistoryRef = useAutoScroll([streamData, userInput, messages]);

const clearChat = () => {
  emit("update:updateChatMessages", []);
};

const filterMessage = (setTime = false) => {
  return (message) => {
    const { role, content, tool_calls, tool_call_id, name, extra } = message;
    if (setTime) {
      return { extra, role, content, tool_calls, tool_call_id, name, time: message.time ?? Date.now() };
    }
    return { extra, role, content, tool_calls, tool_call_id, name };
  };
};

const getGraphConfig = async () => {
  const ollamaConfig = globalStore.settings?.llmConfigs?.ollama ?? {};
  const anthropicConfig = globalStore.settings?.llmConfigs?.anthropic ?? {};
  const openaiConfig = globalStore.settings?.llmConfigs?.openai ?? {};
  const openaiApikey = globalStore.settings?.APIKEY?.OPENAI_API_KEY;
  const groqApikey = globalStore.settings?.APIKEY?.GROQ_API_KEY;
  const anthropicApikey = globalStore.settings?.APIKEY?.ANTHROPIC_API_KEY;
  const geminiApikey = globalStore.settings?.APIKEY?.GEMINI_API_KEY;
  const exaApikey = globalStore.settings?.APIKEY?.EXA_API_KEY;

  // console.log(openaiConfig, openaiConfig?.model ?? LLM_OPENAI_DEFAULT_CONFIG.model);
  return {
    openAIAgent: {
      apiKey: openaiApikey,
      model: openaiConfig?.model ?? LLM_OPENAI_DEFAULT_CONFIG.model,
    },
    groqAgent: {
      apiKey: groqApikey,
      model: LLM_GROQ_DEFAULT_MODEL,
    },
    geminiAgent: {
      apiKey: geminiApikey,
    },
    anthropicAgent: {
      apiKey: anthropicApikey,
      model: anthropicConfig?.model ?? LLM_ANTHROPIC_DEFAULT_CONFIG.model,
    },
    ollamaAgent: {
      baseURL: ollamaConfig?.url ?? LLM_OLLAMA_DEFAULT_CONFIG.url,
      model: ollamaConfig?.model ?? LLM_OLLAMA_DEFAULT_CONFIG.model,
      apiKey: "not-needed",
    },
    exaToolsAgent: {
      apiKey: exaApikey,
    },
  };
};

const isOpenAI = computed(() => {
  return llmAgent.value === "openAIAgent";
});
const isAnthropic = computed(() => {
  return llmAgent.value === "anthropicAgent";
});

const hasExa = computed(() => {
  return !!globalStore.settings?.APIKEY?.EXA_API_KEY && (isOpenAI.value || isAnthropic.value);
});

const apiKeyName = computed(() => {
  const llm = llms.find((_llm) => _llm.id === llmAgent.value);
  return llm.apiKey;
});

const run = async (isScript: false) => {
  if (isRunning.value) {
    return;
  }
  if (apiKeyName.value && !hasApiKey(apiKeyName.value)) {
    apiErrorNotify(apiKeyName.value);
    return;
  }

  liveToolsData.value = null;
  isRunning.value = true;

  try {
    const config = await getGraphConfig();
    const llmModel = config[llmAgent.value]?.model || ""; // The model setting in config can be overridden by params.model (even if it is a blank string).

    const tools = [
      // ...mulmoScriptValidatorAgent.tools,
      ...puppeteerAgent.tools,
      // ...mulmoVisionAgent.tools,
      ...mulmoCastHelpAgent.tools,
      ...mulmoScriptAgent.tools,
    ];

    const systemPrompt = getSystemPrompt(
      scriptLang.value,
      mulmoScriptHistoryStore.currentMulmoScript,
      isAnthropic.value,
    );
    const postMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages
        .map(filterMessage())
        .filter((message) => message.role !== "system")
        .filter((message) => {
          return message.content !== "" || message.tool_calls;
        }),
    ];
    const graphAIAgents = {
      ...agents,
      openAIAgent,
      ollamaAgent: openAIAgent,
      geminiAgent,
      anthropicAgent,
      groqAgent,
      validateSchemaAgent,
      exaToolsAgent,
      puppeteerAgent,
      mulmoCastHelpAgent,
      toolsAgent: isOpenAI.value ? toolsAgentWithChoice : toolsAgent,
      mulmoScriptValidatorAgent,
      mulmoVisionAgent,
      mulmoScriptAgent,
    };

    const graphai = new GraphAI(graphChatWithSearch(isScript, isOpenAI.value), graphAIAgents, {
      agentFilters,
      config,
    });
    graphai.registerCallback(streamPlugin(streamNodes));
    // graphai.registerCallback(console.log);
    graphai.registerCallback((data) => {
      const { agentId, nodeId, state, result, namedInputs } = data;
      if (state === "executing") {
        currentRunningAgent.value = agentId;
        currentRunningNode.value = nodeId;
      }
      if (nodeId === "toolCallAgent" && (state === "completed" || state === "executing")) {
        liveToolsData.value = {
          content: result?.content,
          data: {
            isExecuting: state === "executing",
            agent: agentId,
            arg: namedInputs?.arguments,
            func: namedInputs?.func,
          },
        };
      }
      if (agentId === "mulmoVisionAgent" && state === "completed") {
        const script = { ...mulmoScriptHistoryStore.currentMulmoScript };
        script.beats.push(data.result.data);

        emit("updateMulmoScript", script);

        console.log(data.result.data);
      }
      if (agentId === "mulmoScriptAgent" && state === "completed") {
        const script = { ...mulmoScriptHistoryStore.currentMulmoScript };
        const newScript = mulmoScriptTools(data.namedInputs, script);
        if (newScript) {
          emit("updateMulmoScript", newScript);
        }
        notifySuccess(t("notify.mulmoScript.successMessage"));
        // addBeatToMulmoScript -> beat
        // insertAtBeatToMulmoScript -> beat, index
        // deleteBeatOnMulmoScript -> index
        // setImagePromptOnBeat -> index, imagePrompt
      }
    });
    graphai.injectValue("messages", postMessages);
    graphai.injectValue("prompt", isOpenAI.value && userInput.value === "" ? "create mulmo script" : userInput.value);
    graphai.injectValue("llmAgent", llmAgent.value);
    graphai.injectValue("llmModel", llmModel);
    if (hasExa.value) {
      tools.push(...exaToolsAgent.tools);
      graphai.injectValue("passthrough", {
        exaToolsAgent: {
          messages: messages.map(filterMessage()),
        },
      });
    }
    graphai.injectValue("tools", enableTools.value ? tools : []);

    const res = await graphai.run();
    console.log(res);

    const newMessages = [...res.llm.messages.map((message) => filterMessage(true)(message))];
    userInput.value = "";
    emit("update:updateChatMessages", newMessages);
    if (res?.llm?.data?.["mulmoScriptValidatorAgent--pushScript"]?.data?.isValid) {
      const { script } = res?.llm?.data?.["mulmoScriptValidatorAgent--pushScript"]?.data ?? {};
      script.beats.map(setRandomBeatId);
      emit("updateMulmoScript", script);
    }
  } catch (error) {
    if (error.status === 401) {
      notifyError(t("notify.error.apiKeyInvalid." + llmAgent.value));
    } else if (llmAgent.value === "openAIAgent") {
      if (error.status === 429) {
        notifyError(t("notify.error.apiKeyInvalid.ttsOpenaiAgent"));
      } else {
        notifyError(t("ui.common.error"), error);
      }
    } else {
      const message = error instanceof Error ? error.message : String(error);
      notifyError(t("ui.common.error"), message);
    }
    console.error(error);
  }
  isRunning.value = false;
};

const isCreatingScript = ref(false);

const scriptLang = computed(() => {
  return enLang.languages[mulmoScriptHistoryStore.currentMulmoScript.lang ?? globalStore.settings.APP_LANGUAGE];
});

const scriptLangLocalize = computed(() => {
  return t("languages." + (mulmoScriptHistoryStore.currentMulmoScript.lang ?? globalStore.settings.APP_LANGUAGE));
});

const copyScript = async () => {
  // const head = `Generate a ${scriptLang.value} presentation script for this topic or story and pass it to tool 'pushScript.'`;
  const head = t("project.chat.prompt.generatePrompt", { scriptLang: scriptLangLocalize.value });
  // Generate a Japanese script for a presentation of the given topic and pass it to tool 'pushScript.'
  const template = templateDataSet[promptTemplates[selectedTemplateIndex.value].filename];

  userInput.value = head + " " + template;
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

const messageHistory = ref([]); // For undo when editUser.

const editUser = (index: number) => {
  textareaRef.value.focus();
  userInput.value = messages[index].content;

  messageHistory.value = [...messages];

  const newMessages = [...messages];
  newMessages.length = index;
  emit("update:updateChatMessages", newMessages);
};
const undoMessages = () => {
  userInput.value = "";
  emit("update:updateChatMessages", [...messageHistory.value]);
  messageHistory.value = [];
};

// for debug
const copyMessageToClipboard = async () => {
  await window.electronAPI.writeClipboardText(JSON.stringify(messageHistory.value ?? [], null, 2));
};
</script>
