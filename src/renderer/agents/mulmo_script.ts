import { type AgentFunctionInfo, type AgentFunction } from "graphai";

const mulmoScriptAgent: AgentFunction = async () => {
  return {
    content: "Successfully created",
  };
};

export const generateTools = (speakers?: string[], imageNames?: string[]) => {
  const itemRequired = ["text"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemProperties: Record<string, any> = {
    id: {
      type: "string",
      description: "Unique beat id. It is automatically assigned when creating, so there is no need to specify it.",
    },
    text: { type: "string", description: "talk script for each beat" },
    imagePrompt: {
      type: "string",
      description: "prompt to generate image. It is exclusive to the image object element in this object.",
    },
    moviePrompt: {
      type: "string",
      description: "prompt to generate image. It is exclusive to the movie object element in this object.",
    },
  };
  if (speakers && speakers.length > 0) {
    itemProperties.speaker = {
      type: "string",
      description: "speaker role",
      enum: speakers,
    };
    itemRequired.push("speaker");
  } else {
    itemProperties.speaker = { type: "string", description: "speaker" };
  }
  if (imageNames && imageNames.length > 0) {
    itemProperties.imageNames = {
      type: "array",
      description: "Image names referenced during image generation",
      items: {
        type: "string",
        enum: imageNames,
      },
      minItems: 0,
      maxItems: imageNames.length,
      uniqueItems: true,
    };
    itemRequired.push("imageNames");
  }

  return {
    type: "function",
    function: {
      name: "mulmoScriptAgent--createBeatsOnMulmoScript",
      description: "create mulmo script with beats.",
      parameters: {
        type: "object",
        properties: {
          beats: {
            type: "array",
            description: "current list of beats",
            items: {
              type: "object",
              required: itemRequired,
              properties: itemProperties,
            },
          },
          title: {
            type: "string",
            description: "The title of this mulmo script.",
          },
        },
        required: ["beats", "title"],
      },
    },
  };
};

export const mulmoScriptAgentInfo: AgentFunctionInfo = {
  name: "mulmoScriptAgent",
  agent: mulmoScriptAgent,
  mock: mulmoScriptAgent,
  samples: [],
  tools: [
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--createBeatsOnMulmoScript",
        description: "create mulmo script with beats.",
        parameters: {
          type: "object",
          properties: {
            beats: {
              type: "array",
              description: "current list of beats",
              items: {
                type: "object",
                required: ["text"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "Unique beat id. It is automatically assigned when creating, so there is no need to specify it.",
                  },
                  text: { type: "string", description: "talk script for each beat" },
                  speaker: { type: "string", description: "speaker" },
                  imagePrompt: {
                    type: "string",
                    description:
                      "prompt to generate image. It is exclusive to the image object element in this object.",
                  },
                  moviePrompt: {
                    type: "string",
                    description:
                      "prompt to generate image. It is exclusive to the movie object element in this object.",
                  },
                },
              },
            },
            title: {
              type: "string",
              description: "The title of this mulmo script.",
            },
          },
          required: ["beats", "title"],
        },
      },
    },
    /*
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--addBeatToMulmoScript",
        description: "add beat to mulmo script.",
        parameters: {
          type: "object",
          properties: {
            beat: {
              type: "object",
              properties: {
                text: { type: "string", description: "talk script for each beat" },
                speaker: { type: "string", description: "speaker" },
                imagePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the image object element in this object.",
                },
                moviePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the movie object element in this object.",
                },
                imageNames: {
                  type: "array",
                  description: "Array of speaker names whose images should be displayed",
                  items: {
                    type: "string",
                    pattern: "^[a-z]+$",
                  },
                },
              },
              required: ["text", "imageNames"],
            },
          },
          required: ["beat"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--insertAtBeatToMulmoScript",
        description: "insert beat to mulmo script.",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "position index of beats array" },
            beat: {
              type: "object",
              properties: {
                text: { type: "string", description: "talk script for each beat" },
                speaker: { type: "string", description: "speaker" },
                imagePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the image object element in this object.",
                },
                moviePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the movie object element in this object.",
                },
              },
              required: ["text"],
            },
          },
          required: ["beat", "index"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--updateBeatOnMulmoScript",
        description: "update beat on mulmo script.",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "index of beats array" },
            beat: {
              type: "object",
              properties: {
                text: { type: "string", description: "talk script for each beat" },
                speaker: { type: "string", description: "speaker" },
                imagePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the image object element in this object.",
                },
                moviePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the movie object element in this object.",
                },
              },
              required: [],
            },
          },
          required: ["beat", "index"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--replaceBeatOnMulmoScript",
        description: "update beat on mulmo script.",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "index of beats array" },
            beat: {
              type: "object",
              properties: {
                text: { type: "string", description: "talk script for each beat" },
                speaker: { type: "string", description: "speaker" },
                imagePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the image object element in this object.",
                },
                moviePrompt: {
                  type: "string",
                  description: "prompt to generate image. It is exclusive to the movie object element in this object.",
                },
              },
              required: [],
            },
          },
          required: ["beat", "index"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--deleteBeatOnMulmoScript",
        description: "delete beat from mulmo script.",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "position index of beats array" },
          },
          required: ["index"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--setImagePromptOnBeat",
        description: "set image prompt on beat. Generated by looking at the text and the surrounding beats",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "index of beats array" },
            imagePrompt: { type: "string", description: "image prompt" },
          },
          required: ["index", "imagePrompt"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--setMoviePromptOnBeat",
        description: "set movie prompt on beat. Generated by looking at the text and the surrounding beats",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "index of beats array" },
            moviePrompt: { type: "string", description: "movie prompt" },
          },
          required: ["index", "moviePrompt"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mulmoScriptAgent--addSpeaker",
        description: "add speaker",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "speaker name [a-z]+",
              pattern: "^[a-z]+$",
            },
            voiceId: {
              type: "string",
              description: "OpenAI TTS voice",
              oneOf: [
                { const: "shimmer", title: "shimmer", description: "Bright, light, youthful" },
                { const: "alloy", title: "alloy", description: "Calm mid-low, persuasive" },
                { const: "ash", title: "ash", description: "Deep, mature, slightly rough" },
                { const: "ballad", title: "ballad", description: "Gentle, soothing; good for narration" },
                { const: "coral", title: "coral", description: "Soft, friendly" },
                { const: "echo", title: "echo", description: "Clear, neutral, easy to understand" },
                { const: "fable", title: "fable", description: "Expressive; great for storytelling" },
                { const: "nova", title: "nova", description: "Energetic, modern, crisp" },
                { const: "onyx", title: "onyx", description: "Strong, deep, powerful" },
                { const: "sage", title: "sage", description: "Calm, thoughtful, intellectual" },
              ],
              default: "echo",
            },
            imagePrompt: {
              type: "string",
              description: "prompt to generate speaker's image.",
            },
          },
          required: ["name"],
        },
      },
    },
    */
  ],
  description: "generate mulmo script json data from prompt messages",
  category: ["net"],
  author: "Receptron team",
  repository: "https://github.com/receptron/mulmocast-app",
  license: "MIT",
};

export default mulmoScriptAgentInfo;
