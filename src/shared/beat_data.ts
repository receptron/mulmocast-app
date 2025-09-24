import { type MulmoBeat } from "mulmocast";
import { INITIAL_DESCRIPTION } from "./constants";

export const initMulmoScript = (title: string, lang: string = "en") => ({
  title: title,
  description: INITIAL_DESCRIPTION,
  $mulmocast: {
    version: "1.1",
    credit: "closing",
  },
  lang,
  beats: [
    {
      speaker: "Presenter",
      text: "",
      imagePrompt: "",
    },
  ],
});

// key is i18n key
export const beatTemplates: { key: string; beat: MulmoBeat }[] = [
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
        chartData: {},
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
    key: "vision",
    beat: {
      text: "",
      speaker: "",
      image: {
        type: "vision",
        style: "",
        data: {},
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

// for beginner
export const simpleTemplates = beatTemplates.filter((temp) => {
  return ["imagePrompt", "mediaFile", "markdown"].includes(temp.key);
});
