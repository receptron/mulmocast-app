export const intro01_ja = {
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
          instruction: "スポーツインストラクターのように元気に",
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
          instruction: "明るく親しみやすく、わくわくする感じで",
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
          instruction: "情熱的で創造性にあふれる感じで",
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
  title: "導入1. ようこそ、マルモキャスト へ!! ",
  description: "右側の「動画生成ボタン」を押してください。動画生成が完了してから動画をご覧ください。",
  lang: "ja",
  beats: [
    {
      id: "b1e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "narrator",
      text: "ようこそ、マルモキャスト へ",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# ようこそ マルモキャストへ",
          "",
          "</div>",
        ],
      },
    },
    {
      id: "b2e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "narrator",
      text: "あなたのアイデアが、AIの魔法で美しい映像に変わります。",
      imagePrompt: "AIの魔法で、アイデアが美しい映像に変わる様子。やさしいタッチの水彩画風。",
    },
    {
      id: "b3e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "guide",
      text: "マルモキャストなら、言葉で伝えるだけで素敵な動画が作れます。",
      imagePrompt: "言葉が映像に変わっていく様子。明るいピクセルアート風。",
    },
    {
      id: "b4e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "creator",
      text: "今すぐマルモキャストで創造の旅を始めましょう！",
      imagePrompt: "創造の翼を持つ人が、未来の作品が浮かぶ空を飛んでいる。希望に満ちた朝日。日本の90年代アニメ風。",
    },
    {
      id: "b5e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "guide",
      text: "それでは、戻るボタンを押してホームに戻り、新規作成ボタンから次のプロジェクトを始めてみましょう！",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# 🚀 次のプロジェクトを始めよう！",
          "",
          "## 📝 戻るボタン → 新規作成ボタン",
          "",
          "### ✨ あなたの創造力を発揮する時です",
          "",
          "</div>",
        ],
      },
    },
  ],
};
