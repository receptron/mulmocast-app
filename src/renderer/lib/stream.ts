import { AgentFunctionContext, TransactionLog } from "graphai";

import { ref } from "vue";
import { streamAgentFilterGenerator } from "@graphai/stream_agent_filter";

type DataChunk = {
  response: {
    output: {
      type: string;
      text?: string;
      data?: {
        id: string;
        function: {
          arguments: string;
        };
      }[];
    }[];
  };
};

export const useStreamData = () => {
  const streamData = ref<Record<string, string>>({});
  const toolsData = ref<Record<string, Record<string, unknown>>>({});
  const isStreaming = ref<Record<string, boolean>>({});

  const outSideFunciton = (context: AgentFunctionContext, token: string | DataChunk) => {
    const { nodeId } = context.debugInfo;
    if (typeof token === "string") {
      streamData.value[nodeId] = (streamData.value[nodeId] || "") + token;
    } else if (typeof token === "object" && token !== null) {
      if (token?.response?.output?.[0]?.type === "text") {
        streamData.value[nodeId] = (streamData.value[nodeId] || "") + token.response.output[0].text;
      }
      if (token?.response?.output?.[0]?.type === "tool_calls") {
        if (token?.response?.output?.[0]?.data?.[0]?.id) {
          toolsData.value[nodeId] = token?.response?.output?.[0]?.data?.[0]?.function;
        } else if (token?.response?.output?.[0]?.data?.[0]?.function?.arguments) {
          toolsData.value[nodeId].arguments =
            toolsData.value[nodeId].arguments + token?.response?.output?.[0]?.data?.[0].function.arguments;
        }
        if (toolsData.value[nodeId]) {
          streamData.value[nodeId] = JSON.stringify(toolsData.value[nodeId], null, 2);
        }
      }
    }
  };

  const resetStreamData = (nodeId: string) => {
    if (streamData.value[nodeId]) {
      streamData.value[nodeId] = "";
    }
    if (toolsData.value[nodeId]) {
      delete toolsData.value[nodeId];
    }
  };

  const streamAgentFilter = streamAgentFilterGenerator<string>(outSideFunciton);

  const streamPlugin = (targetNodeId: string[]) => {
    return (log: TransactionLog) => {
      const { nodeId, state } = log;
      if (targetNodeId.includes(nodeId)) {
        if (state === "completed") {
          isStreaming.value[nodeId] = false;
        }
        if (state === "queued") {
          resetStreamData(nodeId);
        }
        if (state === "executing") {
          isStreaming.value[nodeId] = true;
        }
      }
    };
  };

  return {
    streamData,
    streamAgentFilter,
    resetStreamData,
    streamPlugin,
    isStreaming,
  };
};
