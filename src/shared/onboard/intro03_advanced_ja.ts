export const intro03_ja = {
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
      ai_expert: {
        displayName: {
          ja: "AIエキスパート",
          en: "AI Expert",
        },
        voiceId: "onyx",
        speechOptions: {
          instruction: "深い知識と経験に基づいて、権威のある専門的な口調で",
        },
        provider: "openai",
      },
      tech_guide: {
        displayName: {
          ja: "テックガイド",
          en: "Tech Guide",
        },
        voiceId: "alloy",
        speechOptions: {
          instruction: "親切で丁寧に、技術的な内容を分かりやすく説明する感じで",
        },
        provider: "openai",
      },
      creator_pro: {
        displayName: {
          ja: "プロクリエイター",
          en: "Pro Creator",
        },
        voiceId: "ash",
        speechOptions: {
          instruction: "熱意と経験に満ちた、インスピレーションを与える感じで",
        },
        provider: "openai",
      },
      business_advisor: {
        displayName: {
          ja: "ビジネスアドバイザー",
          en: "Business Advisor",
        },
        voiceId: "echo",
        speechOptions: {
          instruction: "プロフェッショナルで信頼感のある、ビジネス的な視点で説明する感じで",
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
  title: "導入3. 次世代AIクリエイターへの道",
  description: "右側の「動画生成ボタン」を押してください。動画生成が完了してから動画をご覧ください。",
  lang: "ja",
  beats: [
    {
      id: "d01e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "ai_expert",
      text: "マルモキャストの基本はマスターしましたね。ここからは、さらに高度な機能で、あなたの創造性をネクストレベルに引き上げます。",
      imagePrompt:
        "未来的なクリエイティブの司令室。ホログラムディスプレイが並び、AIのアイコンが輝いている。サイバーパンク風イラスト。",
    },
    {
      id: "d02e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "ai_expert",
      text: "より高度な画像を生成したいですか？OpenAIの上位モデルを使ったり、GoogleやReplicateといった他のAIプロバイダーを選択して、ユニークなスタイルの画像を作り出すことができます。",
      image: {
        type: "markdown",
        markdown: [
          "# 🎨 高度な画像生成",
          "",
          "## AIプロバイダーを使いこなす",
          "",
          "- **OpenAI 上位モデル (gpt-image-1)**",
          "- **Google**",
          "- **Replicate**",
          "> スタイル設定からプロバイダーを切り替えよう！",
          "",
          "> ※ 各プロバイダーの利用にはAPIキーの設定が必要です。",
          "",
          "> ※ OpenAI (gpt-image-1) の利用にはOrganization認証が別途必要です。",
        ],
      },
    },
    {
      id: "d03e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "ai_expert",
      text: "キャラクターの見た目を一貫させたい場合は、キャラクター設定機能が効果的です。参考画像をアップロードするか、AIで生成したキャラクターを参照できます。ストーリー性のある作品作りに最適です。",
      image: {
        type: "markdown",
        markdown: [
          "# 👤 キャラクター設定機能",
          "",
          "## キャラクターの一貫性を保つ",
          "",
          "📸 **参考設定方法**",
          "  - 画像アップロード または キャラクター生成",
          "",
          "🎯 **一貫したキャラクター生成**",
          "  - 同じ人物で複数シーン",
          "  - ストーリー展開に最適",
          "",
          "> **設定方法**: キャラクター設定 → アップロード or 画像生成から選択",
        ],
      },
    },
    {
      id: "d04e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "tech_guide",
      text: "動画生成も、ReplicateやGoogleのAIを使えば、テキストから映像を生み出すことができます。あなたの言葉が、映像になるのです。",
      image: {
        type: "markdown",
        markdown: [
          "# 🎬 テキストから動画生成",
          "",
          "## 脚本を映像に",
          "",
          "- **Replicate**",
          "- **Google**",
          "",
          "> プロンプト一つで、世界に一つだけの映像を。",
          "",
          "> ※ 各プロバイダーの利用にはAPIキーの設定が必要です。",
        ],
      },
    },
    {
      id: "d05e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "tech_guide",
      text: "声にもこだわりたいですよね。OpenAIだけでなく、日本語が得意なニジボイスや、高品質な音声合成で知られるElevenLabsなど、様々な声のプロバイダーを利用できます。",
      image: {
        type: "markdown",
        markdown: [
          "# 🎙️ 多彩な音声合成",
          "",
          "## キャラクターに命を吹き込む",
          "",
          "- **OpenAI**",
          "- **Nijivoice**",
          "- **ElevenLabs**",
          "",
          "> キャラクター設定に合わせて声を選ぼう！",
          "",
          "> ※ 各プロバイダーの利用にはAPIキーの設定が必要です。",
        ],
      },
    },
    {
      id: "d06e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "tech_guide",
      text: "さらに、動画の見た目や雰囲気も自由にカスタマイズできます。スライド切り替え効果でスムーズな演出を、BGM変更で作品に合った音楽を、キャンバスサイズ変更で縦動画や正方形など、用途に応じたフォーマットで制作可能です。",
      image: {
        type: "markdown",
        markdown: [
          "# 🎬 動画の見た目をカスタマイズ",
          "",
          "## 簡単設定で印象的な動画に",
          "",
          "🔄 **スライド切り替え効果**",
          "",
          "🎵 **BGM変更/追加**",
          "",
          "📐 **キャンバスサイズ変更**",
          "- 横動画",
          "- 縦動画",
          "- カスタム",
          "",
          "> どのモードでも簡単に設定できます！",
        ],
      },
    },
    {
      id: "d07e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "tech_guide",
      text: "マルモキャストには、あなたのスキルに合わせたモードがあります。入門モードから始め、慣れてきたら中級モードのAIチャット機能や、上級モードの詳細設定、多彩なスライドテンプレートに挑戦してみましょう。",
      image: {
        type: "markdown",
        markdown: [
          "# ⚙️ スキルに合わせた制作モード",
          "",
          "## ３つのモードを使いこなそう",
          "",
          "🌱 **入門モード**",
          "- シンプルな操作で、すぐに動画作成",
          "",
          "🚀 **中級モード**",
          "- AIチャットでアイデアを膨らませる",
          "",
          "🌟 **上級モード**",
          "- 詳細な設定項目、多彩なスライドテンプレート",
        ],
      },
    },
    {
      id: "d08e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "business_advisor",
      text: "箇条書きのスライドも簡単です。見やすいテキストスライドが完成します。",
      image: {
        type: "textSlide",
        slide: {
          title: "テキストスライドの例",
          bullets: ["箇条書きリスト", "シンプルで分かりやすい", "要点を整理するのに最適"],
        },
      },
    },
    {
      id: "d09e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "business_advisor",
      text: "マークダウンを使えば、箇条書きだけでなく表、画像の挿入などの表現が可能です。",
      image: {
        type: "markdown",
        markdown: [
          "# マークダウンの例",
          "## テーブル",
          "| 機能      | サポート |",
          "| :-------- | :------: |",
          "| テーブル  |    ✅    |",
          "| リンク    |    ✅    |",
          "| コード    |    ✅    |",
        ],
      },
    },
    {
      id: "d10e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "business_advisor",
      text: "データを視覚的に見せたい場合は、チャート機能が便利です。",
      image: {
        type: "chart",
        title: "チャートの例：月間売上",
        chartData: {
          type: "bar",
          data: {
            labels: ["1月", "2月", "3月"],
            datasets: [
              {
                label: "売上 (万円)",
                data: [120, 135, 180],
                backgroundColor: "rgba(54, 162, 235, 0.5)",
              },
            ],
          },
          options: {
            responsive: true,
            animation: false,
          },
        },
      },
    },
    {
      id: "d11e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "business_advisor",
      text: "マーメイドを使えば、フローチャートやシーケンス図などの描画ができます。",
      image: {
        type: "mermaid",
        title: "Mermaid図の例：フローチャート",
        code: {
          kind: "text",
          text: "graph LR\n    A[企画] --> B{設計}\n    B --> C[UIデザイン]\n    B --> D[API設計]\n    B --> E[DB設計]\n    C --> F{実装}\n    D --> F\n    E --> F\n    F --> G[リリース]",
        },
      },
    },
    {
      id: "d12e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "business_advisor",
      text: "さらに、HTMLとTailwind CSSを直接記述して、完全にカスタムされたデザインのスライドを作成することも可能です。",
      image: {
        type: "html_tailwind",
        html: [
          '<div class="flex items-center justify-center" style="width: 1280px; height: 720px;">',
          '  <div class="w-full h-full flex items-center justify-center bg-gray-100 p-8">',
          '    <div class="text-center p-8 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg">',
          '      <h1 class="text-6xl font-bold text-blue-600 mb-4">HTML & Tailwind CSS</h1>',
          '      <p class="text-2xl text-gray-700 mt-4">自由なデザインを実現</p>',
          '      <div class="mt-8 p-6 bg-white rounded-lg shadow-md">',
          '        <p class="text-xl text-gray-800">Web制作のスキルが活かせます</p>',
          "      </div>",
          "    </div>",
          "  </div>",
          "</div>",
        ],
      },
    },
    {
      id: "d13e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "tech_guide",
      text: "このように、マルモキャストでは様々な形式のスライドを組み合わせることで、表現力豊かな動画コンテンツを効率的に制作できます。",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# 🎨 表現の可能性は無限大",
          "# あなたのアイデアを形にしよう",
          "",
          "</div>",
        ],
      },
    },
    {
      id: "d14e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "creator_pro",
      text: "これで、あなたもAIクリエイターの仲間入りです。技術の力を借りながら、人間らしい創造性を発揮してください。マルモキャストならできる、あなたも始められる！未来のコンテンツ制作は、あなたの手の中にあります。",
      imagePrompt:
        "未来の指令室でAIを指揮するクリエイター。ホログラムディスプレイに囲まれている。希望に満ちたSFアニメ風。",
    },
    {
      id: "d15e8a0c1-f2d3-4a5b-8c9e-1f2a3b4c5d6e",
      speaker: "creator_pro",
      text: "お疲れ様でした！3つの導入は完了しました。今度はあなた自身のアイデアで作品を作ってください！",
      image: {
        type: "markdown",
        markdown: [
          "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;'>",
          "",
          "# 🚀 あなたのプロジェクトを始めよう！",
          "",
          "## 📝 戻るボタン → 新規作成ボタン",
          "",
          "## ✨ あなたの創造力を発揮する時です",
          "",
          "</div>",
        ],
      },
    },
  ],
};
