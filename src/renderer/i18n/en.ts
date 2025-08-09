import { commonLanguages, beatBadge } from "./common";

const lang = {
  message: {
    hello: "hello world",
  },
  // UI common vocabulary (reuse-focused)
  ui: {
    common: {
      // Navigation
      back: "Back",

      // File operations
      drophere: "Drop file here",
      or: "or",

      // Common labels and nouns
      title: "Title",
      description: "Description",
      key: "Key",
      image: "Image",
      audio: "Audio",
      video: "Video",
      movie: "Movie",
      file: "File",
      url: "URL",
      prompt: "Prompt",
      contents: "Contents",
      content: "Content",
      data: "Data",
      code: "Code",
      name: "Name",
      size: "Size",
      width: "Width",
      height: "Height",
      duration: "Duration",
      quality: "Quality",
      style: "Style",
      type: "Type",
      format: "Format",
      language: "Language",
      provider: "Provider",
      model: "Model",
      speed: "Speed",
      volume: "Volume",
      padding: "Padding",
      beat: "Beat",
      slide: "Slide",
      chart: "Chart",
      speaker: "Speaker",
      chat: "Chat",
      panel: "Panel",
      parameters: "Parameters",

      // Modal
      clickOutsideToClose: "Click outside to close",
    },

    // Common actions (placeholder pairs)
    actions: {
      // Basic actions (no placeholder)
      create: "Create",
      update: "Update",
      generate: "Generate",
      generateThing: "Generate {thing}",
      fetch: "Fetch",
      cancel: "Cancel",

      // Media actions (placeholder pairs)
      play: "Play",
      playThing: "Play {thing}",
      download: "Download",
      downloadThing: "Download {thing}",
      view: "View",
      viewThing: "View {thing}",

      // Content generation
      generateImage: "Generate image",
      generateMovie: "Generate movie",
      changeBeatTypeFirst: "Change beat type first",
      generateReference: "Generate Reference",
      generateAudio: "Generate audio",
      translateBeat: "Translate",

      // CRUD operations (placeholder pairs)
      add: "Add",
      addThing: "Add {thing}",
      delete: "Delete",
      deleteThing: "Delete {thing}",
      edit: "Edit",
      editThing: "Edit {thing}",
      open: "Open",
      openThing: "Open {thing}",

      // Chat actions
      clearChat: "Clear chat",
      copyScript: "Copy script",
      createScript: "Create Script",

      // Template actions
      insert: "Insert",
      change: "Change",
      reference: "Set Reference",

      // Project actions
      createNew: "Create New",
      openProjectFolder: "Open Project Folder",
    },

    // Status messages
    status: {
      // Processing states
      loading: "Loading...",
      loadingThing: "Loading {thing}...",
      generating: "Generating...",
      generatingThing: "Generating {thing}...",
      creating: "Creating...",
      saving: "Saving...",
      processing: "Processing...",

      // Completion states
      complete: "Complete",
      success: "Success",
      ready: "Ready",

      // Error states
      error: "Error",
      failed: "Failed",
      cancelled: "Cancelled",

      // Specific loading states
      loadingProjects: "Loading projects...",
      generatingImage: "Generating Image...",
      generatingAudio: "Generating audio...",
      generatingMovie: "Generating movie...",
    },

    // Common UI element names
    elements: {
      button: "Button",
      input: "Input",
      textarea: "Textarea",
      select: "Select",
      checkbox: "Checkbox",
      radio: "Radio",
      slider: "Slider",
      tab: "Tab",
      panel: "Panel",
      dialog: "Dialog",
      modal: "Modal",
      dropdown: "Dropdown",
      menu: "Menu",
      tooltip: "Tooltip",
      placeholder: "Placeholder",
      label: "Label",
      field: "Field",
      form: "Form",
      table: "Table",
      list: "List",
      card: "Card",
      badge: "Badge",
    },

    // Tab related vocabulary
    tabs: {
      text: "Text",
      yaml: "YAML",
      json: "JSON",
      media: "Media",
      style: "Style",
      ref: "Ref",
    },

    // Validation messages
    validation: {
      required: "This field is required",
      invalid: "Invalid format",
      tooShort: "Too short",
      tooLong: "Too long",
      mustBeNumber: "Must be a number",
      mustBeUrl: "Must be a valid URL",
    },
  },
  common: {
    drophere: "Drop file here",
    or: "or",
    fetch: "Fetch",
    imagePrompt: "Image Prompt",
    moviePrompt: "Movie Prompt",
    htmlPrompt: "HTML Prompt",
    defaultTitle: "[untitled]",
  },
  llms: {
    openAIAgent: "OpenAI",
    ollamaAgent: "Ollama",
    geminiAgent: "Gemini",
    anthropicAgent: "Anthropic",
    replicateAgent: "Replicate",
    groqAgent: "Groq",
  },
  menu: {
    top: "Dashboard",
    settings: "Settings",
    mypage: "MyPage",
    signin: "SignIn",
    signout: "SignOut",
    about: "About",
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
      llmDescription:
        "* LLM Processing: Used for script generation, translation, research, and other text generation/processing",
      getApiKey: "Get API Key",
      features: {
        tts: "Text-to-Speech",
        "tts-jp": "Japanese TTS",
        imageGeneration: "Image Generation",
        videoGeneration: "Video Generation",
        llm: "LLM Processing",
        webSearch: "Web Search",
        soundEffects: "Sound Effects",
        lipSync: "Lip Sync",
      },
    },
    notifications: {
      success: "Settings saved",
      error: "Failed to save settings",
      createSuccess: "Script created successfully 🎉",
    },
    languages: {
      title: "Language Settings",
      description: "Script language and translation language settings",
      mainTitle: "The main language of the script",
      translatedTitle: "Language to be translated",
    },
    llmSettings: {
      title: "LLM Settings",
      description: "Configure your LLM settings",
      llm: {
        label: "LLM Agent",
        placeholder: "LLM",
        description: "Select the LLM to use in chat",
      },
      ollama: {
        label: "Ollama Setting",
        url: "URL",
        model: "Model",
      },
    },
  },
  generating: "Generating...",
  generate: "Generate",
  update: "Update",
  dashboard: {
    createNew: "Create New",
    project: "No projects | One project | {count} projects",
    sortBy: "Sort by",
    sort: {
      updatedAtDesc: "Last updated (newest first)",
      updatedAtAsc: "Last updated (oldest first)",
      titleAsc: "Title (A-Z)",
      titleDesc: "Title (Z-A)",
    },
    empty: "No projects yet. Create your first project to get started!",
    confirmDelete: 'Are you sure you want to delete "{title}"?',
    errors: {
      createProjectFailed: "Failed to create project. Please try again.",
      deleteProjectFailed: "Failed to delete project. Please try again.",
    },
  },
  project: {
    newProject: {
      title: "Create New Project",
      placeholder: "Enter project title",
    },
    header: {
      back: "Back",
      openProjectFolder: "Open Project Folder",
    },
    menu: {
      script: "Script",
      debugLog: "Debug Logs",
    },
    generate: {
      openPanel: "Open Output & Product panel",
      outputProduct: "Output Settings & Generation / Production",
      outputSettingsGeneration: "Output Settings & Generation",
      generateContents: "Generate Contents",
      movie: "Movie",
      audio: "Podcast",
      pdfSlide: "PDF (Presenter)",
      pdfHandout: "PDF (Handout)",
    },
    scriptEditor: {
      menu: {
        textMode: "Text Mode",
        textModeDescription: "Speaker and dialogue editing only",
        yamlMode: "YAML Mode",
        yamlModeDescription: "Complete MulmoScript editing",
        jsonMode: "JSON Mode",
        jsonModeDescription: "Complete MulmoScript editing",
        mediaMode: "Media Mode",
        mediaModeDescription: "Beat-by-beat media editing and preview",
        styleMode: "Style",
        styleModeDescription: "Presentation style editing",
        referenceMode: "Reference",
        referenceModeDescription: "Reference image for character consistency",
      },
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
        details: "Duration: 12:34 - Resolution: 1920x1080 - Size: 145 MB",
      },
      pdf: {
        title: "PDF Preview",
        description: "PDF document display and download",
        view: "View PDF",
        download: "Download PDF",
        details: "8 pages - A4 format - Size: 2.1 MB",
      },
      html: {
        title: "HTML Preview",
        description: "Interactive web format display",
        view: "View HTML",
        download: "Download HTML",
        details: "Interactive content - Responsive design",
      },
      podcast: {
        title: "Podcast Preview",
        description: "Audio content playback and preview",
        play: "Play",
        download: "Download MP3",
        details: "Duration: 12:34 - Size: 8.2 MB",
      },
      slide: {
        title: "Slide Preview",
        description: "Slide format display and navigation",
        start: "Start Slideshow",
        export: "Export Images",
        details: "8 slides - 1920x1080 resolution",
      },
    },
    chat: {
      openPanel: "Open AI Assistant Chat panel",
      title: "AI Assistant Chat",
      aiPoweredGuide: "AI-Powered MulmoScript Generation Guide",
      beginnerDescription: "Let's Create Scripts Through Conversation with AI Assistants",
      advancedDescription: "Use ChatGPT or other AI tools to generate your Script content with these proven prompts",
      enterMessage: "Enter your message:",
      clearChat: "Clear chat",
      createButtonDescription:
        "To create a script with the content so far, please select a template and press the Create button.",
      copyScript: "Copy script",
      creating: "Creating...",
      createScript: "Create Script",
      exampleMessage: "ex) Thank you very much! Please proceed with the creation.",
    },
  },
  beat: {
    videoPreview: "Video Preview",
    imagePreview: "Image Preview",
    badge: beatBadge,
    // Beat speaker settings
    speaker: {
      selectSpeaker: "Select a speaker",
      placeholder: "{language} input: {speaker}'s voice content",
    },
    // Beat type structures (moved from beat.form.*)
    image: {
      urlField: "URL",
      placeholder: "Enter image URL or upload file",
    },
    textSlide: {
      titleField: "Title",
      contentsField: "Contents",
      placeholder: "Slide Contents\nMarkdown bullets\n- one\n- two",
    },
    markdown: {
      contentsField: "Contents",
      placeholder: "Markdown Contents\n# Title\nWrite your content here.\n- Item 1\n- Item 2\n- Item 3",
    },
    htmlPrompt: {
      promptField: "Prompt",
      placeholder: "Enter HTML prompt to generate custom slide content.",
    },
    chart: {
      titleField: "Title",
      chartDataField: "Chart Data",
      placeholder: "Enter chart data in JSON format\n{'{'}\n  \"type\": \"bar\",\n  \"data\": {'{'} ... {'}'}\n{'}'}",
    },
    mermaid: {
      titleField: "Title",
      codeField: "Code",
      placeholder: "Enter Mermaid diagram code.",
    },
    htmlTailwind: {
      htmlField: "HTML",
      placeholder: "Enter HTML with Tailwind CSS classes.",
    },
    reference: {
      idField: "Beat ID",
      referenceField: "Beat Reference",
      placeholder: "Enter beat ID to reference (e.g., beat_1)",
    },
    imagePrompt: {
      promptField: "Prompt",
      placeholder: "Enter prompt to generate image.",
    },
    moviePrompt: {
      promptField: "Prompt",
      placeholder: "Blank won't work, space will.",
    },
    imageReference: {
      keyField: "Image Reference Key",
      placeholder: "Image Reference Key (a-z0-9)",
    },
  },

  // Parameters structure (extracted from project.scriptEditor.*)
  parameters: {
    movieParams: {
      title: "Movie Parameters",
      transitionType: "Transition Type",
      transitionDuration: "Transition Duration (seconds)",
      providerNone: "None",
      modelAuto: "Auto",
      transitionFade: "Fade",
      transitionSlideoutLeft: "Slide Out Left",
    },
    speechParams: {
      title: "Speech Parameters",
      language: "Language",
      displayName: "Display Name",
    },
  },

  modal: {
    clickOutsideToClose: "Click outside to close",
  },
  notify: {
    audio: {
      successMessage: "Audio generated successfully",
      errorMessage: "Failed to generate audio",
    },
    image: {
      successMessage: "Image generated successfully",
      errorMessage: "Failed to generate image",
    },
    translate: {
      successMessage: "Translate successfully",
      errorMessage: "Failed to translate text",
    },
    content: {
      successMessage: "Contents generated successfully",
      errorMessage: "Failed to generate contents",
    },
    beat: {
      imageReference: "Reference Image",
      audio: "Audio",
      image: "Image",
      multiLingual: "Multilingual Text",
      caption: "Caption",
      movie: "Movie",
      html: "HTML",
      soundEffect: "Sound Effect",
      lipSync: "Lip Sync",
    },
    task: {
      audio: "Audio",
      video: "Video",
      image: "Image",
      pdf: "PDF",
    },
  },
  provider: {
    openai: "OpenAI",
    nijivoice: "Nijivoice",
    google: "Google",
    elevenlabs: "ElevenLabs",
  },
  languages: {
    ja: "Japanese",
    en: "English",
    fr: "French",
    es: "Spanish",
    de: "German",
    ru: "Russian",
    pt: "Portuguese",
    tr: "Turkish",
    it: "Italian",
    fa: "Persian",
    nl: "Dutch",
    pl: "Polish",
    zh: "Chinese",
    vi: "Vietnamese",
    id: "Indonesian",
    cs: "Czech",
    ko: "Korean",
    ar: "Arabic",
    uk: "Ukrainian",
    el: "Greek",
    "zh-CN": "Simplified Chinese",
    "zh-TW": "Traditional Chinese",
    hi: "Hindi",
  },
  commonLanguages,
};

export default lang;
