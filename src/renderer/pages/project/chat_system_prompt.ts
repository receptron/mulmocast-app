import { ref, computed } from "vue";
import type { MulmoScript } from "mulmocast/browser";

const anthropicSystemPrompt = [
  "<use_parallel_tool_calls>",
  "For maximum efficiency, whenever you perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially. Prioritize calling tools in parallel whenever possible. For example, when reading 3 files, run 3 tool calls in parallel to read all 3 files into context at the same time. When running multiple read-only commands like `ls` or `list_dir`, always run all of the commands in parallel. Err on the side of maximizing parallel tool calls rather than running too many tools sequentially.",
  "</use_parallel_tool_calls>",
].join("\n");

type ConversationMode = "presentation" | "dialogue" | "story";
export const conversationModes = [
  { value: "presentation", label: "presentation" },
  { value: "dialogue", label: "dialogue" },
  { value: "story", label: "story" },
];

export const useSystemPrompt = () => {
  const conversationMode = ref<ConversationMode>("presentation");
  const conversationSystemPrompt = computed(() => {
    const conversationSystemPrompts = {
      presentation:
        "You are generating a script in the style of a single presenter giving a presentation or lecture. The script should be written as if one person is speaking to an audience, explaining content clearly and logically.",
      dialogue:
        "You are generating a script in the style of a two-person dialogue. The script should alternate between two characters, making it clear who is speaking each time. The tone should resemble a natural conversation.",
      story:
        "You are generating a script in the style of a story or multi-person conversation. The script should involve three or more characters, each with distinct voices. Clearly indicate the speaker for each line, and write it in a narrative or dialogue style suitable for storytelling.",
    };
    return conversationSystemPrompts[conversationMode.value];
  });

  const systemMessage = (scriptLang: string) => {
    return `Always reply in ${scriptLang}, regardless of the language of the user's input or previous conversation.  If the user's message is in a different language, translate it into ${scriptLang} before replying.`;
  };

  const currentBeats = (currentMulmoScript: MulmoScript) => {
    const beats = currentMulmoScript?.beats ?? [];
    const speakers = Object.keys(currentMulmoScript?.speechParams?.speakers ?? {}) ?? [];
    const speakerMessage =
      (speakers.length > 0 ? "Speaker(s) is " + JSON.stringify(speakers ?? []) + ". " : "") +
      "If any speakers are missing, please add them.  ";

    return [
      speakerMessage,
      (beats.length > 0 ? "current beats is " + JSON.stringify(beats) : "") +
        "Update, add, or delete them according to the instructions.",
      "Ask the user for any necessary information, and once the information is complete, generate the script.",
      "Proceed as much as possible within a single conversation. Multiple tools may be invoked if necessary. ",
      "If the task cannot be completed in one pass, indicate to the user that there is a continuation.",
    ].join("\n");
  };

  const getSystemPrompt = (scriptLang: string, currentMulmoScript: MulmoScript, isAnthropic: boolean) => {
    const systemPrompts = [systemMessage(scriptLang), conversationSystemPrompt.value, currentBeats(currentMulmoScript)];
    if (isAnthropic) {
      systemPrompts.push(anthropicSystemPrompt);
    }
    return systemPrompts.join("\n");
  };

  return {
    getSystemPrompt,
    conversationMode,
  };
};
