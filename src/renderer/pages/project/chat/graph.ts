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

// chat with tools and loop support - continues until attempt_completion is called
export const graphChatWithSearchLoop = (isChoice = false, isOpenAI = false): GraphData => {
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
    loop: {
      while: ":continue",
    },
    nodes: {
      messages: {
        update: ":llm.messages",
      },
      prompt: {
        update: "",
      },
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
      continue: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agent: ({ messages, loop }: any) => {
          // Check if attempt_completion has been called
          const hasAttemptCompletion = messages.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (msg: any) => msg.role === "tool" && msg.name && msg.name.includes("attempt_completion"),
          );

          // Continue if: loop < 10 AND attempt_completion hasn't been called yet
          const shouldContinue = loop < 10 && !hasAttemptCompletion;

          return shouldContinue;
        },
        inputs: {
          messages: ":llm.messages",
          loop: "${@loop}",
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
