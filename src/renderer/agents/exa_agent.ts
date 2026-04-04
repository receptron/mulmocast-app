import { GraphAIOnError, GraphAIDebug, GraphAISupressError } from "@graphai/agent_utils";
import { AgentFunction, AgentFunctionInfo, DefaultConfigData } from "graphai";
import Exa from "exa-js";

type ExaSearchInputs = {
  arg?: {
    query: string;
    search_args?: Record<string, unknown>;
  };
  func?: string;
};

type ExaSearchParams = GraphAISupressError & GraphAIDebug;

type ExaSearchResponse = { content: string; data: unknown } | GraphAIOnError<string>;

// https://github.com/exa-labs/exa-js
export const exaToolsAgent: AgentFunction<
  ExaSearchParams,
  ExaSearchResponse,
  ExaSearchInputs,
  DefaultConfigData
> = async ({ params, namedInputs, config }) => {
  const { arg } = {
    ...params,
    ...namedInputs,
  };
  const { query, search_args } = arg ?? { query: "" };

  const { apiKey } = {
    ...(config || {}),
  };

  try {
    const exa = new Exa(apiKey);
    const basicResults = await (async () => {
      //if (func === "search") {
      return await exa.searchAndContents(query, { ...search_args, numResults: 3, maxCharacters: 3000, text: true });
      // return await exa.search(query, search_args);
      // }
      // return { result: [] };
    })();

    return {
      content: JSON.stringify(
        basicResults.results.map((item) => {
          return {
            title: item.title,
            link: item.url,
            snippet: item.text,
          };
        }),
        null,
        2,
      ),
      data: basicResults.results,
    };
  } catch (error) {
    const isErrorInstance = error instanceof Error;
    const errorMessage = isErrorInstance ? error.message : "Unknown error occurred";
    const errorObject = isErrorInstance ? error : new Error(errorMessage);

    if (params.supressError) {
      return {
        onError: {
          message: errorMessage,
          error: errorObject.toString(),
        },
      };
    }

    throw errorObject;
  }
};

const exaToolsAgentInfo: AgentFunctionInfo = {
  name: "exaToolsAgent",
  agent: exaToolsAgent,
  mock: exaToolsAgent,
  samples: [
    {
      params: {},
      inputs: {},
      result: {},
    },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "exaToolsAgent--search",
        description: "search web site",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "search query",
            },
          },
          required: ["query"],
        },
      },
    },
  ],
  description: "Exa Agent",
  category: ["net"],
  author: "Receptron team",
  repository: "https://github.com/receptron/graphai-agents/tree/main/net/exa_agent",
  source: "https://github.com/receptron/graphai-agents/tree/main/net/exa_agent/src/exa_agent.ts",
  package: "@graphai/exa_agent",
  license: "MIT",
};

export default exaToolsAgentInfo;
