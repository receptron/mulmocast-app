import { type MulmoBeat } from "mulmocast";
import { INITIAL_TITLE, INITIAL_DESCRIPTION } from "./constants";

export const initMulmoScript = (title: string) => ({
  title: title || INITIAL_TITLE,
  description: INITIAL_DESCRIPTION,
  $mulmocast: {
    version: "1.1",
    credit: "closing",
  },
  beats: [
    {
      speaker: "Presenter",
      text: "",
      imagePrompt: "",
    },
  ],
});

// key is i18n key
export const beatTemplate: { key: string; beat: MulmoBeat }[] = [
  {
    key: "imagePrompt",
    beat: {
      speaker: "",
      text: "",
      imagePrompt: "",
      moviePrompt: "",
    },
  },
  {
    key: "mediaFile",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "image",
        source: {
          kind: "path",
          path: "",
        },
      },
    },
  },
  {
    key: "htmlPrompt",
    beat: {
      speaker: "",
      text: "",
      htmlPrompt: {
        prompt: "",
      },
    },
  },
  {
    key: "textSlide",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "textSlide",
        slide: {
          title: "",
          bullets: [""],
        },
      },
    },
  },
  {
    key: "markdown",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "markdown",
        markdown: [],
      },
    },
  },
  {
    key: "chart",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "chart",
        title: "",
        chartData: undefined,
      },
    },
  },
  {
    key: "mermaid",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "mermaid",
        title: "",
        code: {
          kind: "text",
          text: "",
        },
      },
    },
  },
  {
    key: "html_tailwind",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "html_tailwind",
        html: [],
      },
    },
  },
];
