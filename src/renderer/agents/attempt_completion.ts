import { type AgentFunctionInfo, type AgentFunction } from "graphai";

const attemptCompletionAgent: AgentFunction = async () => {
  return {
    content: "Task completed successfully",
  };
};

export const attemptCompletionAgentInfo: AgentFunctionInfo = {
  name: "attemptCompletionAgent",
  agent: attemptCompletionAgent,
  mock: attemptCompletionAgent,
  samples: [],
  description: "Agent to signal task completion",
  category: ["utility"],
  author: "receptron",
  license: "MIT",
  repository: "https://github.com/receptron/mulmocast-app",
  tools: [
    {
      type: "function",
      function: {
        name: "attemptCompletion",
        description:
          "Call this function when you have completed the task successfully. This signals that the conversation should end. Only call this after you have finished all required steps (e.g., fetching content AND creating the script).",
        parameters: {
          type: "object",
          properties: {
            result: {
              type: "string",
              description: "A brief summary of what was accomplished",
            },
          },
          required: ["result"],
        },
      },
    },
  ],
};

export default attemptCompletionAgentInfo;
