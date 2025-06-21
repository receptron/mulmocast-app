import { GraphAI, GraphData } from "graphai";
import * as agents from "@graphai/vanilla";
import { MulmoScript, mulmoScriptSchema, readTemplatePrompt, validateSchemaAgent } from "mulmocast";
import { openAIAgent } from "@graphai/openai_agent";
import { ChatMessage } from "../../types";

const graphData: GraphData = {
  version: 0.5,
  nodes: {
    systemPrompt: {
      value: "",
    },
    chatMessages: {
      value: "",
    },
    // generate the mulmo script
    mulmoScript: {
      agent: "nestedAgent",
      inputs: {
        chatMessages: ":chatMessages",
        systemPrompt: ":systemPrompt",
      },
      graph: {
        loop: {
          while: ":continue",
        },
        nodes: {
          counter: {
            value: 0,
            update: ":counter.add(1)",
          },
          llm: {
            agent: "openAIAgent",
            inputs: {
              prompt: ":chatMessages",
              params: {
                system: ":systemPrompt",
                model: "gpt-4o-mini",
              },
            },
          },
          validateSchemaAgent: {
            agent: "validateSchemaAgent",
            inputs: {
              text: ":llm.text.codeBlock()",
              schema: mulmoScriptSchema,
            },
            isResult: true,
          },
          continue: {
            agent: ({ isValid, counter }) => {
              return !isValid && counter < 3;
            },
            inputs: {
              isValid: ":validateSchemaAgent.isValid",
              counter: ":counter",
            },
          },
        },
      },
      isResult: true,
      output: {
        data: ".validateSchemaAgent.data",
      },
    },
  },
};

export const createMulmoScript = async (messages: ChatMessage[], templateName: string) => {
  const graph = new GraphAI(graphData, {
    ...agents,
    openAIAgent,
    validateSchemaAgent,
  });
  graph.injectValue("chatMessages", messages.map((message) => `${message.role}: ${message.content}`).join("\n"));
  graph.injectValue("systemPrompt", readTemplatePrompt(templateName));
  const result = await graph.run<{ data: MulmoScript }>();
  return result.mulmoScript.data;
};
