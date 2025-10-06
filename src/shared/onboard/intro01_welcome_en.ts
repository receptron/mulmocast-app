export const intro01_en = {
  $mulmocast: {
    version: "1.1",
    credit: "closing",
  },
  canvasSize: {
    width: 1280,
    height: 720,
  },
  speechParams: {
    speakers: {
      narrator: {
        displayName: {
          ja: "ナレーター",
          en: "Narrator",
        },
        voiceId: "alloy",
        speechOptions: {
          instruction: "Energetically, like a sports instructor",
        },
        provider: "openai",
      },
      guide: {
        displayName: {
          ja: "ガイド",
          en: "Guide",
        },
        voiceId: "nova",
        speechOptions: {
          instruction: "Bright, friendly, and with a sense of excitement",
        },
        provider: "openai",
      },
      creator: {
        displayName: {
          ja: "クリエイター",
          en: "Creator",
        },
        voiceId: "echo",
        speechOptions: {
          instruction: "Passionately and full of creativity",
        },
        provider: "openai",
      },
    },
  },
  imageParams: {
    provider: "openai",
    model: "dall-e-3",
    quality: "auto",
    images: {},
  },
  movieParams: {
    provider: "mock",
    model: "",
    transition: {
      type: "fade",
      duration: 1,
    },
  },
  soundEffectParams: {
    provider: "replicate",
  },
  audioParams: {
    padding: 0.3,
    introPadding: 1,
    closingPadding: 0.8,
    outroPadding: 1,
    bgmVolume: 0.2,
    audioVolume: 1,
    suppressSpeech: false,
  },
  title: "Intro 1. Welcome to Mulmocast!!",
  description:
    "Please press the 'Generate Video' button on the right. Please watch the video after the video generation is complete.",
  lang: "en",
  beats: [
    {
      speaker: "narrator",
      text: "Welcome to Mulmocast",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# Welcome to Mulmocast",
          "",
          "</div>",
        ],
      },
    },
    {
      speaker: "narrator",
      text: "Your ideas will be transformed into beautiful videos with the magic of AI.",
      imagePrompt:
        "The process of ideas turning into beautiful videos through the magic of AI. In the style of a gentle watercolor painting.",
    },
    {
      speaker: "guide",
      text: "With Mulmocast, you can create wonderful videos just by describing them with words.",
      imagePrompt: "The process of words transforming into video. In a bright pixel art style.",
    },
    {
      speaker: "creator",
      text: "Start your creative journey with Mulmocast now!",
      imagePrompt:
        "A person with creative wings flying in a sky where future works are floating. A hopeful sunrise. In the style of 90s Japanese anime.",
    },
    {
      speaker: "guide",
      text: "Now, let's go back to the dashboard by pressing the back button and start your next project from the 'New Project' button!",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# 🚀 Let's start the next project!",
          "",
          "## 📝 Back Button → New Project Button",
          "",
          "### ✨ It's time to unleash your creativity",
          "",
          "</div>",
        ],
      },
    },
  ],
};
