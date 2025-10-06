export const intro02_en = {
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
      presenter: {
        displayName: {
          ja: "プレゼンター",
          en: "Presenter",
        },
        voiceId: "shimmer",
        speechOptions: {
          instruction: "Clearly and understandably, in a presentation style",
        },
        provider: "openai",
      },
      expert: {
        displayName: {
          ja: "エキスパート",
          en: "Expert",
        },
        voiceId: "fable",
        speechOptions: {
          instruction: "With an intelligent and professional atmosphere, in a persuasive manner of speaking",
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
  title: "Intro 2. Let's expand the possibilities of expression",
  description:
    "Please press the 'Generate Video' button on the right. Please watch the video after the video generation is complete.",
  lang: "en",
  beats: [
    {
      id: "c1e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "presenter",
      text: "The true power of Mulmocast is the ability to combine various media. First, let's start with generative AI images.",
      image: {
        type: "markdown",
        markdown: [
          "# 🎨 Expressive Power of MulmoCast",
          "",
          "🖼️ **Generative AI Images** - Turn imagination into reality",
          "",
          "📸 **Photos & Videos** - Utilize real materials too",
          "",
          "✨ **Markdown Slides** - Beautiful presentations",
          "",
          "🎵 **Speech Synthesis** - Natural read-aloud",
        ],
      },
    },
    {
      id: "c2e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "expert",
      text: "Discover the appeal of generative AI images. Visually expressing your ideas makes your message more impactful.",
      imagePrompt:
        "Various media elements (slides, AI art, photos) harmonizing into a single piece of work. A futuristic and vibrant illustration.",
    },
    {
      id: "c3e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "presenter",
      text: "And also actual photos,",
      image: {
        type: "image",
        source: {
          kind: "url",
          url: "https://github.com/ystknsh/media/blob/main/sample_image.jpeg?raw=true",
        },
      },
    },
    {
      id: "c4e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "presenter",
      text: "and videos can be easily incorporated.",
      image: {
        type: "movie",
        source: {
          kind: "url",
          url: "https://github.com/ystknsh/media/raw/refs/heads/main/sample_movie.mp4",
        },
      },
    },
    {
      id: "c5e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "expert",
      text: "After watching this movie, let's try it in the 'BEAT' tab. Between the beats, there is a dropdown and an 'Insert' button to add a new beat. Select 'Image or Movie file' from the dropdown and press the 'Insert' button to create a new beat. Try dragging and dropping your favorite image or video file there, or enter a URL and press the 'Fetch' button.",
      image: {
        type: "markdown",
        markdown: [
          "# ✍️ Let's try: Add Image/Video",
          "",
          "In the **'BEAT'** tab, select **'Image or Movie file'** from the dropdown between beats",
          "",
          "Click the **'Insert'** button next to the beat",
          "",
          "**Drag & drop** a file or **enter a URL** and click **'Fetch'**",
          "",
          "Press the **'Generate Video' button**",
        ],
      },
    },
    {
      id: "c6e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "expert",
      text: "In this way, by freely combining text, generated images, and live-action materials, you can complete your own original video. The possibilities for expression are endless!",
      image: {
        type: "markdown",
        markdown: [
          "# 🚀 Infinite Creativity",
          "",
          "## Your work will change the world",
          "",
          '> *"Creativity has no limits"*',
          "",
          "- 🎯 **Expression tailored to the purpose**",
          "- 🌈 **Diverse styles**",
          "- ⚡ **Easy operation**",
          "- 🌍 **Broadcast to the world**",
          "",
          "**Start now and tell your story!**",
        ],
      },
    },
    {
      id: "c7e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "expert",
      text: "This concludes the second introduction. Now, let's return to the dashboard and start the final, third project from the 'New Project' button!",
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
