export const intro02_ja = {
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
          instruction: "はっきりと分かりやすく、プレゼンテーション調で",
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
          instruction: "知的で専門的な雰囲気で、説得力のある話し方で",
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
  title: "導入2. 表現の可能性を広げよう",
  description: "右側の「動画生成ボタン」を押してください。動画生成が完了してから動画をご覧ください。",
  lang: "ja",
  beats: [
    {
      speaker: "presenter",
      text: "マルモキャストの真の力は、様々なメディアを組み合わせられることです。まずは、生成AI画像から始めてみましょう。",
      image: {
        type: "markdown",
        markdown: [
          "# 🎨 MulmoCastの表現力",
          "",
          "🖼️ **生成AI画像** - 想像を現実に",
          "",
          "📸 **写真・動画** - リアルな素材も活用",
          "",
          "✨ **Markdownスライド** - 美しいプレゼンテーション",
          "",
          "🎵 **音声合成** - 自然な読み上げ",
        ],
      },
    },
    {
      speaker: "expert",
      text: "生成AI画像の魅力をご覧ください。あなたのアイデアを視覚的に表現することで、メッセージがより印象的になります。",
      imagePrompt:
        "様々なメディア要素（スライド、AIアート、写真）が調和して一つの作品になる様子。未来的で鮮やかなイラスト。",
    },
    {
      speaker: "presenter",
      text: "そして、実際の写真や",
      image: {
        type: "image",
        source: {
          kind: "url",
          url: "https://github.com/ystknsh/media/blob/main/sample_image.jpeg?raw=true",
        },
      },
    },
    {
      speaker: "presenter",
      text: "動画も簡単に組み込めます。",
      image: {
        type: "movie",
        source: {
          kind: "url",
          url: "https://github.com/ystknsh/media/raw/refs/heads/main/sample_movie.mp4",
        },
      },
    },
    {
      speaker: "expert",
      text: "この動画を見終わってから、「BEAT」タブで試してみましょう。ビートとビートの間には、新しいビートを追加するためのプルダウンと「追加」ボタンがあります。プルダウンから「画像または動画ファイル」を選択して「追加」ボタンを押すと、新しいビートが作成されます。そこに好きな画像や動画ファイルをドラッグ＆ドロップするか、URLを入力して「取得」ボタンを押してみましょう。",
      image: {
        type: "markdown",
        markdown: [
          "# ✍️ やってみよう：画像/動画を追加",
          "",
          "**「BEAT」** タブの、ビート間のプルダウンで **「画像または動画ファイル**」 を選択",
          "",
          "ビート隣の **「追加」** ボタンをクリック",
          "",
          "ファイルを **ドラッグ＆ドロップ**するか、 **URLを入力** して **「取得」**  ",
          "",
          "**「動画生成ボタン」** を押す",
        ],
      },
    },
    {
      speaker: "expert",
      text: "このように、テキスト、生成画像、実写素材を自由に組み合わせることで、あなただけの独創的な動画が完成します。表現の可能性は無限大です！",
      image: {
        type: "markdown",
        markdown: [
          "# 🚀 無限の創造性",
          "",
          "## あなたの作品が世界を変える",
          "",
          '> *"創造性に制限はない"*',
          "",
          "- 🎯 **目的に合わせた表現**",
          "- 🌈 **多様なスタイル**",
          "- ⚡ **簡単操作**",
          "- 🌍 **世界に発信**",
          "",
          "**今すぐ始めて、あなたの物語を伝えよう！**",
        ],
      },
    },
    {
      speaker: "expert",
      text: "これで2つ目の導入は終了です。それでは、ホームに戻り、新規作成ボタンから最後の3つ目のプロジェクトを始めてみましょう！",
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
