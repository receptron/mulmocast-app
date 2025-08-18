import { commonLanguages } from "./common";

const lang = {
  message: {
    hello: "こんにちは、世界",
  },
  // UI common vocabulary (reuse-focused)
  ui: {
    common: {
      // Navigation
      back: "戻る",

      // File operations
      drophere: "画像をここにドロップ",
      or: "または",

      // Common labels and nouns
      title: "タイトル",
      description: "説明",
      key: "キー",
      image: "画像",
      audio: "音声",
      video: "動画",
      movie: "動画",
      file: "ファイル",
      url: "URL",
      prompt: "プロンプト",
      contents: "内容",
      content: "コンテンツ",
      data: "データ",
      code: "コード",
      name: "名前",
      size: "サイズ",
      width: "幅",
      height: "高さ",
      duration: "再生時間",
      quality: "品質",
      style: "スタイル",
      type: "種類",
      format: "フォーマット",
      language: "言語",
      provider: "プロバイダ",
      model: "モデル",
      speed: "速度",
      volume: "音量",
      padding: "パディング",
      beat: "ビート",
      slide: "スライド",
      chart: "チャート",
      speaker: "スピーカー",
      chat: "チャット",
      panel: "パネル",
      parameters: "パラメータ",
      example: "例)",

      // Modal
      clickOutsideToClose: "外側をクリックするとモーダルが閉じます",

      enable: "有効",
      disable: "無効",
    },

    // Common actions (placeholder pairs)
    actions: {
      // Basic actions (no placeholder)
      create: "作成",
      update: "更新",
      generate: "生成",
      generateThing: "{thing}を生成",
      fetch: "取得",
      cancel: "キャンセル",
      runningThing: "{thing}を実行中",

      // Media actions (placeholder pairs)
      play: "再生",
      playThing: "{thing}を再生",
      download: "ダウンロード",
      downloadThing: "{thing}をダウンロード",
      view: "表示",
      viewThing: "{thing}を表示",

      // Content generation
      generateImage: "画像生成",
      generateMovie: "動画生成",
      changeBeatTypeFirst: "まずビートタイプを変更してください",
      generateReference: "参照イメージ生成",
      generateAudio: "音声生成",
      translateBeat: "翻訳",

      // CRUD operations (placeholder pairs)
      add: "追加",
      addThing: "{thing}を追加",
      delete: "削除",
      deleteThing: "{thing}を削除",
      edit: "編集",
      editThing: "{thing}を編集",
      open: "開く",
      openThing: "{thing}を開く",

      // Chat actions
      clearChat: "チャットリセット",
      copy: "コピー",
      copyScript: "チャットへコピー",
      createScript: "スクリプト作成",

      // Template actions
      insert: "追加",
      change: "変更",
      reference: "画像をセット",

      // Project actions
      createNew: "新規作成",
      openProjectFolder: "プロジェクトのフォルダを開く",
    },

    // Status messages
    status: {
      // Processing states
      loading: "読み込み中...",
      loadingThing: "{thing}読み込み中...",
      generating: "生成中...",
      generatingThing: "{thing}生成中...",
      creating: "作成中...",
      saving: "保存中...",
      processing: "処理中...",

      // Completion states
      complete: "完了",
      success: "成功",
      ready: "準備完了",

      // Error states
      error: "エラー",
      failed: "失敗",
      cancelled: "キャンセル",

      // Specific loading states
      loadingProjects: "プロジェクト読み込み中...",
      generatingImage: "画像生成中...",
      generatingAudio: "音声生成中...",
      generatingMovie: "動画生成中...",
    },

    // Common UI element names
    elements: {
      button: "ボタン",
      input: "入力",
      textarea: "テキストエリア",
      select: "選択",
      checkbox: "チェックボックス",
      radio: "ラジオボタン",
      slider: "スライダー",
      tab: "タブ",
      panel: "パネル",
      dialog: "ダイアログ",
      modal: "モーダル",
      dropdown: "ドロップダウン",
      menu: "メニュー",
      tooltip: "ツールチップ",
      placeholder: "プレースホルダー",
      label: "ラベル",
      field: "フィールド",
      form: "フォーム",
      table: "テーブル",
      list: "リスト",
      card: "カード",
      badge: "バッジ",
    },

    // Tab related vocabulary
    tabs: {
      text: "テキスト",
      yaml: "YAML",
      json: "JSON",
      media: "メディア",
      style: "スタイル",
      ref: "参照",
    },

    // Validation messages
    validation: {
      required: "この項目は必須です",
      invalid: "無効な形式です",
      tooShort: "短すぎます",
      tooLong: "長すぎます",
      mustBeNumber: "数値である必要があります",
      mustBeUrl: "有効なURLである必要があります",
    },
  },
  common: {
    defaultTitle: "(無題)",
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
    top: "ホーム",
    settings: "設定",
    mypage: "マイページ",
    signin: "ログイン",
    signout: "ログアウト",
    about: "About",
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
      llmDescription: "※ LLM処理: スクリプト生成・翻訳・リサーチなどのテキスト生成・処理に使用されます",
      getApiKey: "APIキーを取得",
      features: {
        tts: "音声生成",
        "tts-jp": "日本語音声生成",
        imageGeneration: "画像生成",
        videoGeneration: "動画生成",
        llm: "LLM処理",
        webSearch: "Web検索",
        soundEffects: "効果音生成",
        lipSync: "リップシンク",
      },
    },
    notifications: {
      success: "設定を保存しました",
      error: "設定の保存に失敗しました",
      createSuccess: "Script created successfully 🎉",
      copiedToClipboard: "クリップボードにコピーしました",
      copyFailed: "クリップボードへのコピーに失敗しました",
    },
    languages: {
      title: "言語設定",
      description: "スクリプトの言語および翻訳言語の設定",
      mainTitle: "スクリプトの主言語",
      translatedTitle: "翻訳先の言語",
    },
    llmSettings: {
      title: "LLM設定",
      description: "LLMの設定を行います",
      llm: {
        label: "LLMエージェント",
        placeholder: "LLM",
        description: "Chatで使うLLMを選択してください",
      },
      ollama: {
        label: "Ollama設定",
        url: "URL",
        model: "モデル",
      },
    },
  },
  generating: "生成中...",
  generate: "生成",
  update: "更新",
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
    empty: "まだプロジェクトはありません。最初のプロジェクトを作成して始めましょう！",
    confirmDelete: "「{title}」を削除しますか？",
    errors: {
      createProjectFailed: "プロジェクトの作成に失敗しました。再試行してください。",
      deleteProjectFailed: "プロジェクトの削除に失敗しました。再試行してください。",
    },
  },
  project: {
    newProject: {
      title: "新規プロジェクト作成",
      placeholder: "プロジェクトタイトルを入力",
    },
    header: {
      back: "戻る",
      openProjectFolder: "プロジェクトのフォルダを開く",
    },
    menu: {
      script: "編集",
      product: "成果物",
      debugLog: "デバッグログ",
    },
    generate: {
      openPanel: "出力設定 & 生成 / 成果物パネルを開く",
      outputProduct: "出力設定 & 生成 / 成果物",
      outputSettingsGeneration: "出力設定 & 生成",
      generateContents: "コンテンツ生成",
      movie: "動画",
      audio: "音声",
      pdfSlide: "PDF (プレゼン)",
      pdfHandout: "PDF (資料)",
    },
    scriptEditor: {
      menu: {
        textMode: "Text モード",
        textModeDescription: "話者と会話や字幕へ編集ができます",
        yamlMode: "YAML モード",
        yamlModeDescription: "MulmoScript を直接編集します",
        jsonMode: "JSON モード",
        jsonModeDescription: "MulmoScript を直接編集します",
        mediaMode: "Media モード",
        mediaModeDescription: "Beatごとのイメージや動画の編集とプレビュー",
        styleMode: "Style",
        styleModeDescription: "音声/動画/画像/字幕などの設定",
        referenceMode: "参照",
        referenceModeDescription: "キャラクターの一貫性のための参照イメージ",
      },
      validationStatus: "検証ステータス",
    },
    productTabs: {
      tabs: {
        movie: "動画",
        pdf: "PDF",
        html: "HTML",
        podcast: "Podcast",
        slide: "スライド",
      },
      movie: {
        title: "動画プレビュー",
        description: "動画コンテンツの再生とプレビュー",
        play: "再生",
        pause: "停止",
        download: "MP4をダウンロード",
        details: "再生時間: {duration} - 解像度: {resolution} - サイズ: {size}",
      },
      pdf: {
        title: "PDFプレビュー",
        description: "PDFファイルの表示とダウンロード",
        view: "PDFを表示",
        download: "PDFをダウンロード",
        details: "{pages} ページ - サイズ: {size}",
        empty: "PDF未生成",
      },
      html: {
        title: "HTML Preview",
        description: "Interactive web format display",
        view: "View HTML",
        download: "Download HTML",
        details: "Interactive content - Responsive design",
      },
      podcast: {
        title: "ポッドキャスト プレビュー",
        description: "音声の再生とプレビュー",
        play: "再生",
        download: "MP3をダウンロード",
        details: "再生時間: {duration} - サイズ: {size}",
      },
      slide: {
        title: "スライド プレビュー",
        description: "スライド形式の表示とナビゲーション",
        start: "スライドショーの開始",
        export: "スライドをエクスポート",
        details: "8 スライド - 解像度: 1920x1080",
      },
    },
    chat: {
      openPanel: "AI アシスタントチャットパネルを開く",
      title: "AI アシスタントチャット",
      aiPoweredGuide: "AI搭載MulmoScript生成ガイド",
      beginnerDescription: "AI アシスタントとの会話を通じてスクリプトを作成しましょう",
      advancedDescription: "ChatGPT や他の AI ツールを使用して、実証済みのプロンプトでスクリプトコンテンツを生成",
      enterMessage: "メッセージを入力してください:",
      clearChat: "チャットリセット",
      undoChat: "編集をやめる",
      createButtonDescription:
        "スクリプトを作成するには、テンプレートを選択して「チャットへコピー」「スクリプト作成」ボタンを押してください。",
      copyScript: "チャットへコピー",
      creating: "作成中...",
      createScript: "スクリプト作成",
      exampleMessage: "例）ありがとうございます！作成を進めてください。",
    },
  },
  beat: {
    videoPreview: "動画プレビュー",
    imagePreview: "画像プレビュー",
    // Beat speaker settings
    speaker: {
      selectSpeaker: "スピーカーを選択",
      placeholder: "{language}入力: {speaker}の音声生成内容",
    },
    // Beat type structures (moved from beat.form.*)
    mediaFile: {
      badge: "Media File",
      label: "画像または動画ファイル",
      remoteLabel: "リモートメディア",
      urlField: "URL",
      placeholder: "画像URLを入力するかファイルをアップロード",
    },
    textSlide: {
      badge: "Text Slide",
      label: "スライドコンテンツ",
      titleField: "タイトル",
      contentsField: "内容",
      placeholder: "スライドの内容\nMarkdown形式の箇条書き\n- 項目1\n- 項目2",
    },
    markdown: {
      badge: "Markdown",
      label: "Markdownテキスト",
      contentsField: "内容",
      placeholder: "Markdownの内容\n# タイトル\nここに内容を記入してください。\n- 項目1\n- 項目2\n- 項目3",
    },
    htmlPrompt: {
      badge: "HTML Prompt",
      label: "HTML生成プロンプト",
      promptField: "プロンプト",
      placeholder: "カスタムスライドコンテンツを生成するためのHTMLプロンプトを入力してください。",
    },
    chart: {
      badge: "Chart",
      label: "グラフ描画 (Chart JSON)",
      titleField: "タイトル",
      chartDataField: "チャートデータ",
      placeholder:
        "グラフ描画データをJSON形式で入力してください\n{'{'}\n  \"type\": \"bar\",\n  \"data\": {'{'} ... {'}'}\n{'}'}",
    },
    mermaid: {
      badge: "Mermaid",
      label: "Mermaidダイアグラム",
      titleField: "タイトル",
      codeField: "コード",
      placeholder: "Mermaidダイアグラムコードを入力してください。",
    },
    html_tailwind: {
      badge: "Tailwind HTML",
      label: "HTML(Tailwind)",
      htmlField: "HTML",
      placeholder: "Tailwind CSSクラスを使用したHTMLを入力してください。",
    },
    beat: {
      badge: "Beat",
      label: "参照画像",
      idField: "ビートID",
      referenceField: "ビート参照",
      placeholder: "参照するビートIDを入力してください（例: beat_1）",
      placeholderUrl: "画像URLを入力してください",
    },
    imagePrompt: {
      badge: "Image Prompt",
      label: "画像生成プロンプト",
      promptField: "プロンプト",
      placeholder: "画像を生成するためのプロンプトを入力してください。空の場合はテキストが使われます。",
    },
    moviePrompt: {
      badge: "動画",
      label: "動画生成プロンプト",
      promptField: "プロンプト",
      placeholder: "空白では動作しません。スペースを入力してください。",
    },
    imageReference: {
      badge: "画像参照",
      keyField: "画像参照キー",
      placeholder: "キー(英数字のみ)",
    },
    image: {
      badge: "画像",
    },
    movie: {
      badge: "動画",
    },
    lipSync: {
      label: "リップシンク(声に合わせて口を動かす)",
    },
  },

  // Parameters structure (extracted from project.scriptEditor.*)
  parameters: {
    movieParams: {
      title: "動画設定",
      transitionType: "トランジションの種類",
      transitionDuration: "トランジションの長さ（秒）",
      providerNone: "なし",
      modelAuto: "自動",
      transitionFade: "フェード",
      transitionSlideoutLeft: "左にスライドアウト",
    },
    speechParams: {
      title: "音声設定",
      language: "言語",
      displayName: "表示名",
    },
    canvasSizeParams: {
      title: "キャンバスサイズ",
      sizePreset: "サイズ設定",
      width: "幅",
      height: "高さ",
      custom: "カスタム",
    },
    captionParams: {
      title: "字幕設定",
      language: "言語",
      languageDescription: "字幕の言語",
      styles: "スタイル",
      stylesDescription: "CSSスタイルを入力してください(1行に1つずつ)",
    },
    textSlideParams: {
      title: "テキストスライド設定",
      css: "CSSスタイル",
      cssDescription: "CSSスタイルを単一文字列または複数行で入力してください",
    },
    imageParams: {
      title: "画像設定",
      modelAuto: "自動",
      stylePlaceholder: "例) 鮮やか、自然",
      moderation: "モデレーション",
      moderationPlaceholder: "例) 低、自動",
      images: "画像",
    },
    audioParams: {
      title: "オーディオ設定",
      padding: "パディング",
      introPadding: "イントロ パディング",
      closingPadding: "クロージング パディング",
      outroPadding: "アウトロ パディング",
      bgmVolume: "BGM音量",
      audioVolume: "オーディオ音量",
      bgm: "バックグラウンドミュージック",
    },
  },

  modal: {
    clickOutsideToClose: "外側をクリックするとモーダルが閉じます",
  },
  notify: {
    audio: {
      successMessage: "音声生成成功!!",
      errorMessage: "音声生成失敗",
    },
    image: {
      successMessage: "画像生成成功!!",
      errorMessage: "画像生成失敗",
    },
    translate: {
      successMessage: "翻訳成功!!",
      errorMessage: "翻訳失敗",
    },
    content: {
      successMessage: "作成成功!!",
      errorMessage: "作成失敗",
    },
    // BeatSessionType
    beat: {
      imageReference: "参照画像",
      audio: "音声",
      image: "画像",
      multiLingual: "多言語テキスト",
      caption: "キャプション",
      movie: "動画",
      html: "HTML",
      soundEffect: "効果音",
      lipSync: "リップシンク",
    },
    task: {
      audio: "音声",
      video: "動画",
      image: "画像",
      pdf: "PDF",
    },
  },
  provider: {
    openai: "OpenAI",
    nijivoice: "Nijivoice",
    google: "Google",
    elevenlabs: "ElevenLabs",
    alert: {
      OPENAI_API_KEY: "設定画面でOpenAI API KEYを設定してください",
      NIJIVOICE_API_KEY: "設定画面でNIJIVOICE API KEYを設定してください",
      GEMINI_API_KEY: "設定画面でGEMINI API KEYを設定してください",
      REPLICATE_API_TOKEN: "設定画面でREPLICATE API TOKENを設定してください",
      ELEVENLABS_API_KEY: "設定画面でELEVENLABS API KEYを設定してください",
      ANTHROPIC_API_KEY: "設定画面でANTHROPIC API KEYを設定してください",
      GROQ_API_KEY: "設定画面でGROQ API KEYを設定してください",
    },
  },
  languages: {
    ja: "日本語",
    en: "英語",
    fr: "フランス語",
    es: "イスパニア語",
    de: "ドイツ語",
    ru: "ロシア語",
    pt: "ポルトガル語",
    tr: "トルコ語",
    it: "イタリア語",
    fa: "ペルシャ語",
    nl: "オランダ語",
    pl: "ポーランド語",
    zh: "中国語",
    vi: "ベトナム語",
    id: "インドネシア語",
    cs: "チェコ語",
    ko: "韓国語",
    ar: "アラビア語",
    uk: "ウクライナ語",
    el: "ギリシャ語",
    "zh-CN": "簡体字中国語",
    "zh-TW": "繁体字中国語",
    hi: "ヒンディー語",
  },
  commonLanguages,
};

export default lang;
