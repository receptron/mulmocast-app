import { type GraphData, graphDataLatestVersion } from "graphai";
import { mulmoScriptSchema } from "mulmocast/browser";

// just chat
export const graphChat: GraphData = {
  version: graphDataLatestVersion,
  nodes: {
    messages: {
      value: [],
    },
    prompt: {},
    llmAgent: {},
    llm: {
      agent: ":llmAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
        isResult: true,
      },
      inputs: { messages: ":messages", prompt: ":prompt" },
    },
  },
};

// just chat with tools
export const graphChatWithSearch = (isChoice = false, isOpenAI = false): GraphData => {
  const tool_choice = (() => {
    if (isChoice) {
      return {
        type: "function",
        function: {
          name: "mulmoScriptAgent--createBeatsOnMulmoScript",
        },
      };
    } else {
      return "auto";
    }
  })();

  return {
    version: graphDataLatestVersion,
    nodes: {
      messages: {},
      prompt: {},
      llmAgent: {},
      llmModel: {},
      tools: {
        value: [],
      },
      passthrough: {
        value: {},
      },
      llm: {
        isResult: true,
        agent: "toolsAgent",
        inputs: {
          llmAgent: ":llmAgent",
          llmModel: ":llmModel",
          tools: ":tools",
          messages: ":messages",
          passthrough: ":passthrough",
          userInput: {
            text: ":prompt",
            message: {
              role: "user",
              content: ":prompt",
            },
          },
          ...(isOpenAI
            ? {
                tool_choice,
              }
            : {}),
        },
      },
    },
  };
};

export const graphGenerateMulmoScriptInternal: GraphData = {
  version: graphDataLatestVersion,
  loop: {
    while: ":continue",
  },
  nodes: {
    messages: {
      update: ":newMessages.array",
    },
    newMessages: {
      agent: "pushAgent",
      inputs: {
        array: ":messages",
        items: [{ role: "user", content: ":prompt" }, ":llm.message"],
      },
      console: { after: true },
    },
    prompt: {
      update: ":nextPrompt.text",
    },
    llm: {
      agent: ":llmAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
        isResult: true,
      },
      console: { before: true },
      inputs: {
        prompt: ":prompt",
        messages: ":messages",
      },
    },
    validateSchema: {
      agent: "validateSchemaAgent",
      console: { after: true },
      inputs: {
        // text: ":llm.text",
        text: ":llm.text.codeBlockOrRaw()",
        schema: mulmoScriptSchema,
      },
      isResult: true,
    },
    nextPrompt: {
      agent: "copyAgent",
      inputs: {
        text: "Those are zod errors in the previous generation, fix them!! Perfect.\n\n${:validateSchema.error}",
      },
    },
    continue: {
      agent: ({ isValid, loop }) => {
        return !isValid && loop < 3;
      },
      inputs: {
        isValid: ":validateSchema.isValid",
        loop: "${@loop}",
      },
    },
  },
};

// called by graphai
export const graphGenerateMulmoScript: GraphData = {
  version: graphDataLatestVersion,
  nodes: {
    messages: {
      value: [],
    },
    llmAgent: {},
    prompt: {},
    mulmoScript: {
      agent: "nestedAgent",
      inputs: {
        messages: ":messages",
        prompt: ":prompt",
        llmAgent: ":llmAgent",
      },
      graph: graphGenerateMulmoScriptInternal,
      isResult: true,
      output: {
        data: ".validateSchema.data",
      },
    },
  },
};
