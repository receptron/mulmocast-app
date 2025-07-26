import languages from "./languages";
import { beat_badge } from "./common";

const lang = {
  message: {
    hello: "こんにちは、世界",
  },
  menu: {
    top: "Home",
    mypage: "マイページ",
    signin: "ログイン",
    signout: "ログアウト",
    about: "Abount",
  },
  settings: {
    title: "設定",
    appSettings: {
      title: "アプリ設定",
      description: "アプリケーションの設定を行います",
      language: {
        label: "表示言語",
        placeholder: "言語を選択",
        description: "アプリケーションの表示言語を選択してください",
      },
    },
    apiKeys: {
      title: "APIキー設定",
      description: "外部サービスのAPIキーを設定します",
    },
    notifications: {
      success: "設定を保存しました",
      error: "設定の保存に失敗しました",
    },
  },
  form: {
    cancel: "キャンセル",
    template_selector: {
      insert: "追加",
      change: "変更",
    },
    changeBeatTypeFirst: "Change beat type first",
    generateImage: "画像生成",
    generateMovie: "動画生成",
    generating: "生成中...",
  },
  generating: "生成中...",
  dashboard: {
    createNew: "新規作成",
    project: "{count} 件のプロジェクト",
    sortBy: "並び替え",
    sort: {
      updatedAtDesc: "更新日時（新しい順）",
      updatedAtAsc: "更新日時（古い順）",
      titleAsc: "タイトル（昇順）",
      titleDesc: "タイトル（降順）",
    },
  },
  panels: {
    openAiChat: "AI アシスタントチャットパネルを開く",
    openOutputProduct: "出力設定 & 生成 / 成果物パネルを開く",
    aiAssistantChat: "AI アシスタントチャット",
    outputProduct: "出力設定 & 生成 / 成果物",
    outputSettingsGeneration: "出力設定 & 生成",
    aiPoweredGuide: "AI搭載MulmoScript生成ガイド",
    beginnerDescription: "AI アシスタントとの会話を通じてスクリプトを作成しましょう",
    advancedDescription: "ChatGPT や他の AI ツールを使用して、実証済みのプロンプトでスクリプトコンテンツを生成",
  },
  project: {
    header: {
      back: "戻る",
      openProjectFolder: "プロジェクトのフォルダを開く",
    },
    generate: {
      generateContents: "Generate Contents",
      movie: "Movie",
      audio: "Podcast",
      pdfSlide: "PDF (Presenter)",
      pdfHandout: "PDF (Handout)",
    },
    scriptEditor: {
      movieParams: {
        title: "Movie Parameters",
        provider: "Provider",
        model: "Model",
        transitionType: "Transition Type",
        transitionDuration: "Transition Duration (seconds)",
        providerNone: "None",
        modelAuto: "Auto",
        transitionFade: "Fade",
        transitionSlideoutLeft: "Slide Out Left",
      },
    },
    generateStatus: {
      success: "Contents generated successfully",
      error: "Failed to generate contents",
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
      enterMessage: "メッセージを入力してください:",
      clearChat: "チャットリセット",
      createButtonDescription:
        "スクリプトを作成するには、テンプレートを選択して「チャットへコピー」「スクリプト作成」ボタンを押してください。",
      copyScript: "チャットへコピー",
      creating: "作成中...",
      createScript: "スクリプト作成",
    },
  },
  beat: {
    videoPreview: "動画プレビュー",
    imagePreview: "画像プレビュー",
    badge: beat_badge,
    form: {
      image: {
        url: "URL",
      },
      textSlide: {
        title: "スライドタイトル",
        contents: "スライドの内容\nMarkdown形式の箇条書き\n- 項目1\n- 項目2",
      },
      markdown: {
        contents: "Markdownの内容\n# タイトル\nここに内容を記入してください。\n- 項目1\n- 項目2\n- 項目3",
      },
      htmlPrompt: {
        contents: "カスタムスライドコンテンツを生成するためのHTMLプロンプトを入力してください。",
      },
      chart: {
        contents:
          "チャートデータをJSON形式で入力してください\n{'{'}\n  \"type\": \"bar\",\n  \"data\": {'{'} ... {'}'}\n{'}'}",
      },
      mermaid: {
        contents: "Mermaidダイアグラムコードを入力してください。",
      },
      htmlTailwind: {
        contents: "Tailwind CSSクラスを使用したHTMLを入力してください。",
      },
      reference: {
        id: "参照するビートIDを入力してください（例: beat_1）",
      },
      imagePrompt: {
        contents: "画像を生成するためのプロンプトを入力してください。",
      },
      moviePrompt: {
        contents: "空白では動作しません。スペースを入力してください。",
      },
    },
  },
  modal: {
    clickOutsideToClose: "外側をクリックするとモーダルが閉じます",
  },
  languages,
};

export default lang;
