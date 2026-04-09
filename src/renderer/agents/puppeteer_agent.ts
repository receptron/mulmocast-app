import { type AgentFunction, type AgentFunctionInfo, type DefaultResultData } from "graphai";

export const puppeteerAgent: AgentFunction = async ({ namedInputs }) => {
  const { arg } = {
    ...namedInputs,
  };
  const { url } = arg;
  const content = await window.electronAPI.mulmoHandler("graphaiPuppeteerAgent", { url });
  console.log(content);
  return content as DefaultResultData;
};

const puppeteerAgentInfo: AgentFunctionInfo = {
  name: "puppeteerAgent",
  agent: puppeteerAgent,
  mock: puppeteerAgent,
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
        name: "puppeteerAgent--openUrl",
        description: "open web url",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "web site url",
            },
          },
          required: ["url"],
        },
      },
    },
  ],
  description: "Puppeteer Agent",
  category: ["net"],
  repository: "https://github.com/receptron/mulmocast-app",
  author: "Receptron team",
  license: "MIT",
};

export default puppeteerAgentInfo;
