import languages from "./languages";
import { beat_badge } from "./common";

const lang = {
  message: {
    hello: "hello world",
  },
  menu: {
    top: "Home",
    mypage: "MyPage",
    signin: "SignIn",
    signout: "SignOut",
    about: "Abount",
  },
  settings: {
    title: "Settings",
    appSettings: {
      title: "App Settings",
      description: "Configure application settings",
      language: {
        label: "Display Language",
        placeholder: "Select a language",
        description: "Select your preferred display language for the application",
      },
    },
    apiKeys: {
      title: "API Key Settings",
      description: "Configure API keys for external services",
    },
    notifications: {
      success: "Settings saved",
      error: "Failed to save settings",
    },
  },
  form: {
    cancel: "Cancel",
    template_selector: {
      insert: "Insert",
      change: "Change",
    },
    changeBeatTypeFirst: "Change beat type first",
    generateImage: "Generate image",
    generateMovie: "Generate movie",
    generating: "Generating...",
  },
  generating: "Generating...",
  dashboard: {
    createNew: "Create New",
    project: "No projects | One project | {count} projects",
  },
  project: {
    generate: {
      generateContents: "Generate Contents",
      movie: "Movie",
      audio: "Podcast",
      pdfSlide: "PDF (Presenter)",
      pdfHandout: "PDF (Handout)",
    },
    productTabs: {
      tabs: {
        movie: "Movie",
        pdf: "PDF",
        html: "HTML",
        podcast: "Podcast",
        slide: "Slide",
      },
      movie: {
        title: "Movie Preview",
        description: "Video content playback and preview",
        play: "Play",
        download: "Download MP4",
        details: "Duration: 12:34 | Resolution: 1920x1080 | Size: 145 MB",
      },
      pdf: {
        title: "PDF Preview",
        description: "PDF document display and download",
        view: "View PDF",
        download: "Download PDF",
        details: "8 pages | A4 format | Size: 2.1 MB",
      },
      html: {
        title: "HTML Preview",
        description: "Interactive web format display",
        view: "View HTML",
        download: "Download HTML",
        details: "Interactive content | Responsive design",
      },
      podcast: {
        title: "Podcast Preview",
        description: "Audio content playback and preview",
        play: "Play",
        download: "Download MP3",
        details: "Duration: 12:34 | Size: 8.2 MB",
      },
      slide: {
        title: "Slide Preview",
        description: "Slide format display and navigation",
        start: "Start Slideshow",
        export: "Export Images",
        details: "8 slides | 1920x1080 resolution",
      },
    },
  },
  beat: {
    videoPreview: "Video Preview",
    imagePreview: "Image Preview",
    badge: beat_badge,
    form: {
      image: {
        url: "url",
      },
      textSlide: {
        title: "Slide Title",
        contents: "Slide Contents\nMarkdown bullets\n- one\n- two",
      },
      markdown: {
        contents: "Markdown Contents\n# Title\nWrite your content here.\n- Item 1\n- Item 2\n- Item 3",
      },
      htmlPrompt: {
        contents: "Enter HTML prompt to generate custom slide content.",
      },
      chart: {
        contents: "Enter chart data in JSON format\n{'{'}\n  \"type\": \"bar\",\n  \"data\": {'{'} ... {'}'}\n{'}'}",
      },
      mermaid: {
        contents: "Enter Mermaid diagram code.",
      },
      htmlTailwind: {
        contents: "Enter HTML with Tailwind CSS classes.",
      },
      reference: {
        id: "Enter beat ID to reference (e.g., beat_1)",
      },
      imagePrompt: {
        contents: "Enter prompt to generate image.",
      },
      moviePrompt: {
        contents: "Blank won't work, space will.",
      },
    },
  },
  languages,
};

export default lang;
