export const ja_notify = {
  mulmoScript: {
    successMessage: "MulmoScript生成成功!!",
  },
  audio: {
    successMessage: "音声生成成功!!",
    errorMessage: "音声生成失敗",
  },
  image: {
    successMessage: "画像生成成功!!",
    errorMessage: "画像生成失敗",
  },
  imageReference: {
    successMessage: "素材生成成功!!",
    errorMessage: "素材生成失敗",
  },
  translate: {
    successMessage: "翻訳成功!!",
    errorMessage: "翻訳失敗",
  },
  content: {
    successMessage: "成果物作成成功!!",
    errorMessage: "成果物作成失敗",
  },
  // BeatSessionType
  beat: {
    imageReference: "素材",
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
    caption: "Caption",
  },
  apiKey: {
    error: "{keyName} を設定してください",
    setup: "設定へ移動",
  },
  error: {
    unknownError: "不明なエラーです",
    noContext: "MulmoScriptが正しくありません",
    // action, type, target
    movie: {
      fileNotExist: {
        imageFile: "ビート{beatIndex}の画像が存在しない、もしくは正しくないようです",
        audioFile: "ビート{beatIndex}の音声が存在しない、もしくは正しくないようです",
      },
      undefinedSourceType: {
        audioSource: "動画ソースが指定されていません。",
      },
    },
    images: {
      fileNotExist: {
        imageFile: "ビート{beatIndex}の画像が存在しない、もしくは正しくないようです",
        audioFile: "ビート{beatIndex}の音声が存在しない、もしくは正しくないようです",
      },
      urlFileNotFound: {
        imageFile: "ビートの画像が存在しない、もしくは正しくないようです",
        movieFile: "ビートの動画が存在しない、もしくは正しくないようです",
        codeText: "Mermaidのコードがが存在しない、もしくは正しくないようです",
      },
      unknownMedia: "不明なメディアタイプです",
      invalidResponse: {
        imageReplicateAgent: "画像生成（Replicate）でエラーが発生しました。",
        imageGenAIAgent: "画像生成（Google）でエラーが発生しました。",
        imageOpenaiAgent: "画像生成（OpenAI）でエラーが発生しました。",
        movieGenAIAgent: "動画生成（Google）でエラーが発生しました。",
        movieReplicateAgent: "動画生成（Replicate）でエラーが発生しました。",
      },
      apiError: {
        imageReplicateAgent: "画像生成（Replicate）でエラーが発生しました。",
        imageGenAIAgent: "画像生成（Google）でエラーが発生しました。",
        imageOpenaiAgent: "画像生成（OpenAI）でエラーが発生しました。",
        movieGenAIAgent: "動画生成（Google）でエラーが発生しました。",
        movieReplicateAgent: "動画生成（Replicate）でエラーが発生しました。",
        lipSyncReplicateAgent: "リップシンク（Replicate）でエラーが発生しました。",
        soundEffectReplicateAgent: "効果音生成（Replicate）でエラーが発生しました。",
        videoDuration: "指定した再生時間はモデルがサポートしていません。対応する長さに変更して再度お試しください。",
        unsupportedModel: "選択したモデルはこの動画生成では利用できません。対応モデルを選び直してください。",
        openAIError: {
          need_verified_organization:
            "画像生成（OpenAI）エラー: gpt-image-1 モデルを利用するためには組織認証行ってください。 https://platform.openai.com/settings/organization/general",
          billing_hard_limit_reached:
            "画像生成（OpenAI）でエラーが発生しました。OpenAI APIのクレジット残高を確認してください",
          moderation_blocked:
            "画像生成がブロックされました: コンテンツがOpenAIの利用規約に違反しています。プロンプトを修正してください。",
        },
      },
    },
    imageReference: {
      urlFileNotFound: {
        imageFile: "素材が存在しない、もしくは正しくないようです",
      },
      apiError: {
        imageOpenaiAgent: "OpenAIのAPI Keyが正しくありません",
        imageReplicateAgent: "ReplicateのAPI Keyが正しくありません",
        imageGenAIAgent: "GoogleのAPI Keyが正しくありません",
      },
      unknownMedia: "不明なメディアタイプです",
    },
    media: {
      tooLarge: "登録できるファイルサイズは{maxSizeMB}MBまでです",
      unsupportedType: "{fileType}ファイルはサポートされていません",
      unsupportedMovie: "動画ファイルはサポートされていません",
      // Unsupported file type: ${fileType}
    },
    audio: {
      fileNotExist: {
        audioFile: "ビート{beatIndex}の音声が存在しない、もしくは正しくないようです",
      },
      undefinedSourceType: {
        audioSource: "音声ソースが指定されていません。",
      },
      apiError: {
        addBGMAgent: "BGM追加処理でエラーが発生しました。",
        ttsGoogleAgent: "音声合成（Google TTS）でエラーが発生しました。",
        ttsOpenaiAgent: "音声合成（OpenAI TTS）でエラーが発生しました。",
        ttsGeminiAgent: "音声合成（Gemini TTS）でエラーが発生しました。",
        ttsNijivoiceAgent: "音声合成（Nijivoice）でエラーが発生しました。",
        ttsElevenlabsAgent: "音声合成（ElevenLabs）でエラーが発生しました。",
        ttsKotodamaAgent: "音声合成（Kotodama）でエラーが発生しました。",
      },
      generateAudioSpeechParam: "{speechParams} (speechParams) がセットされていません",
      voice_limit_reached: {
        ttsElevenlabsAgent: "ElevenLabsのカスタムボイスの上限に達しました。",
      },
    },
    music: {
      badPrompt: {
        bgmElevenlabsAgent:
          "BGM生成（ElevenLabs）では指定できない内容が含まれています。プロンプトの条件はリンク先をご確認ください。",
        bgmElevenlabsAgentLink: "https://elevenlabs.io/ja/music-terms",
      },
    },
    multilinguals: {
      errorMessage: "翻訳データ取得に失敗しました",
    },
    apiKeyInvalid: {
      imageOpenaiAgent: "OpenAIのAPI Keyが正しくありません",
      imageReplicateAgent: "ReplicateのAPI Tokenが正しくありません",
      imageGenAIAgent: "GeminiのAPI Keyが正しくありません",
      movieGenAIAgent: "GeminiのAPI Keyが正しくありません",
      movieReplicateAgent: "ReplicateのAPI Tokenが正しくありません",
      ttsOpenaiAgent: "OpenAIのAPI Keyが正しくありません",
      ttsGoogleAgent: "GeminiのAPI Keyが正しくありません",
      ttsGeminiAgent: "GeminiのAPI Keyが正しくありません",
      ttsNijivoiceAgent: "NijiVoiceのAPI Keyが正しくありません",
      ttsElevenlabsAgent: "ElevenLabsのAPI Keyが正しくありません",
      ttsKotodamaAgent: "KotodamaのAPI Keyが正しくありません",
      bgmElevenlabsAgent: "ElevenLabsのAPI Keyが正しくありません",
      voiceCloneElevenlabsAgent: "ElevenLabsのAPI Keyが正しくありません",
      openaiAgent: "OpenAIのAPI Keyが正しくありません",
      openAIAgent: "OpenAIのAPI Keyが正しくありません",
      anthropicAgent: "AnthropicのAPI Keyが正しくありません",
    },
    apiRateLimit: {
      imageOpenaiAgent:
        "OpenAIのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      imageReplicateAgent:
        "ReplicateのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      imageGenAIAgent: "GeminiのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      movieGenAIAgent: "GeminiのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      movieReplicateAgent:
        "ReplicateのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      ttsOpenaiAgent: "OpenAIのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      ttsGoogleAgent: "GeminiのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      ttsGeminiAgent: "GeminiのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      ttsElevenlabsAgent:
        "ElevenLabsのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      ttsKotodamaAgent: "KotodamaのAPIの利用制限に引っかかっています。しばらくしてから再度試してください",
      bgmElevenlabsAgent:
        "ElevenLabsのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
      voiceCloneElevenlabsAgent:
        "ElevenLabsのAPIの利用制限に引っかかっています。課金追加、もしくはしばらくしてから再度試してください",
    },
    translate: {
      apiError: {
        translateBeat: "翻訳処理でエラーが発生しました。",
        multiLingualFile: "翻訳結果のファイル生成に失敗しました。設定や対象データを確認してから再実行してください。",
      },
    },
    apiKeyMissing: {
      OPENAI_API_KEY: "OpenAIのAPI Keyが設定されていません",
      NIJIVOICE_API_KEY: "NijiVoiceのAPI Keyが設定されていません",
      TAVILY_API_KEY: "TavilyのAPI Keyが設定されていません",
      ELEVENLABS_API_KEY: "ElevenLabsのAPI Keyが設定されていません",
      KOTODAMA_API_KEY: "KotodamaのAPI Keyが設定されていません",
      REPLICATE_API_TOKEN: "ReplicateのAPI Tokenが設定されていません",
      GEMINI_API_KEY: "GeminiのAPI Keyが設定されていません",
      ANTHROPIC_API_KEY: "AnthropicのAPI Keyが設定されていません",
      GROQ_API_KEY: "GROQのAPI Keyが設定されていません",
      EXA_API_KEY: "EXAのAPI Keyが設定されていません",
    },
  },
};
