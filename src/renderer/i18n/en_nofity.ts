export const en_notify = {
  mulmoScript: {
    successMessage: "Success to create MulmoScript!!",
  },
  audio: {
    successMessage: "Audio generated successfully",
    errorMessage: "Failed to generate audio",
  },
  image: {
    successMessage: "Image generated successfully",
    errorMessage: "Failed to generate image",
  },
  imageReference: {
    successMessage: "Material generated successfully",
    errorMessage: "Failed to generate material",
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
    imageReference: "Material",
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
    caption: "Caption",
  },
  apiKey: {
    error: "You need setup {keyName}.",
    setup: "Setup",
  },
  error: {
    unknownError: "Unknown error occurred",
    noContext: "Inlvaid MulmoScript.",
    // action, type, target
    movie: {
      fileNotExist: {
        imageFile: "The image for beat {beatIndex} does not exist or is invalid",
        audioFile: "The audio for beat {beatIndex} does not exist or is invalid",
      },
      undefinedSourceType: {
        audioSource: "Video source is not specified.",
      },
    },
    images: {
      fileNotExist: {
        imageFile: "The image for beat {beatIndex} does not exist or is invalid",
        audioFile: "The audio for beat {beatIndex} does not exist or is invalid",
      },
      urlFileNotFound: {
        imageFile: "The beat image does not exist or is invalid",
        movieFile: "The beat movie does not exist or is invalid",
        codeText: "Mermaid code does not exist or is invalid",
      },
      unknownMedia: "Unknown media type",
      invalidResponse: {
        imageReplicateAgent: "An error occurred with image generation (Replicate).",
        imageGenAIAgent: "An error occurred with image generation (Google).",
        imageOpenaiAgent: "An error occurred with image generation (OpenAI).",
        movieGenAIAgent: "An error occurred with video generation (Google).",
        movieReplicateAgent: "An error occurred with video generation (Replicate).",
      },
      apiError: {
        imageReplicateAgent: "An error occurred with image generation (Replicate).",
        imageGenAIAgent: "An error occurred with image generation (Google).",
        imageOpenaiAgent: "An error occurred with image generation (OpenAI).",
        movieGenAIAgent: "An error occurred with video generation (Google).",
        movieReplicateAgent: "An error occurred with video generation (Replicate).",
        lipSyncReplicateAgent: "An error occurred with lip sync (Replicate).",
        soundEffectReplicateAgent: "An error occurred with sound effect generation (Replicate).",
        videoDuration:
          "The specified video duration is not supported by the model. Please adjust to a supported duration and try again.",
        unsupportedModel:
          "The selected model is not available for this video generation. Please select a compatible model.",
        openAIError: {
          need_verified_organization:
            "Image generation (OpenAI) error: Please complete organization verification to use the gpt-image-1 model.  https://platform.openai.com/settings/organization/general",
          billing_hard_limit_reached: "Image generation (OpenAI) error: Please check your OpenAI API credit balance",
          moderation_blocked:
            "Image generation blocked: Content violates OpenAI's usage policies. Please modify your prompt.",
        },
      },
    },
    imageReference: {
      urlFileNotFound: {
        imageFile: "Material does not exist or is invalid",
      },
      apiError: {
        imageOpenaiAgent: "The OpenAI API Key is invalid",
        imageReplicateAgent: "The Replicate API Key is invalid",
        imageGenAIAgent: "The Google API Key is invalid",
      },
      unknownMedia: "Unknown media type",
    },
    media: {
      tooLarge: "The maximum file size that can be add is {maxSizeMB}MB.",
      unsupportedType: "Unsupported file type: {fileType}",
      unsupportedMovie: "Unsupported file type: movie",
    },
    audio: {
      fileNotExist: {
        audioFile: "The audio for beat {beatIndex} does not exist or is invalid",
      },
      undefinedSourceType: {
        audioSource: "Audio source is not specified.",
      },
      apiError: {
        addBGMAgent: "An error occurred while adding BGM.",
        ttsGoogleAgent: "An error occurred with speech synthesis (Google TTS).",
        ttsOpenaiAgent: "An error occurred with speech synthesis (OpenAI TTS).",
        ttsGeminiAgent: "An error occurred with speech synthesis (Gemini TTS).",
        ttsNijivoiceAgent: "An error occurred with speech synthesis (Nijivoice).",
        ttsElevenlabsAgent: "An error occurred with speech synthesis (ElevenLabs).",
        ttsKotodamaAgent: "An error occurred with speech synthesis (Kotodama).",
      },
      generateAudioSpeechParam: "{speechParams} (speechParams) are not set",
      voice_limit_reached: {
        ttsElevenlabsAgent: "You have reached your maximum amount of custom voices with ElevenLabs.",
      },
    },
    music: {
      badPrompt: {
        bgmElevenlabsAgent:
          "Your prompt contains content that cannot be used for BGM generation (ElevenLabs). Please check the link for the prompt requirements.",
        bgmElevenlabsAgentLink: "https://elevenlabs.io/music-terms",
      },
    },
    multilinguals: {
      errorMessage: "Failed to get translation data",
    },
    apiKeyInvalid: {
      imageOpenaiAgent: "The OpenAI API Key is invalid",
      imageReplicateAgent: "The Replicate API Token is invalid",
      imageGenAIAgent: "The Gemini API Key is invalid",
      movieGenAIAgent: "The Gemini API Key is invalid",
      movieReplicateAgent: "The Replicate API Token is invalid",
      ttsOpenaiAgent: "The OpenAI API Key is invalid",
      ttsGoogleAgent: "The Gemini API Key is invalid",
      ttsGeminiAgent: "The Gemini API Key is invalid",
      ttsNijivoiceAgent: "The NijiVoice API Key is invalid",
      ttsElevenlabsAgent: "The ElevenLabs API Key is invalid",
      ttsKotodamaAgent: "The Kotodama API Key is invalid",
      bgmElevenlabsAgent: "The ElevenLabs API Key is invalid",
      voiceCloneElevenlabsAgent: "The ElevenLabs API Key is invalid",
      openaiAgent: "The OpenAI API Key is invalid",
      openAIAgent: "The OpenAI API Key is invalid",
      anthropicAgent: "Anthropic API Key is invalid",
    },
    apiRateLimit: {
      imageOpenaiAgent: "The OpenAI API usage limit has been reached. Please add billing or try again later.",
      imageReplicateAgent: "The Replicate API usage limit has been reached. Please add billing or try again later.",
      imageGenAIAgent: "The Gemini API usage limit has been reached. Please try again later.",
      movieGenAIAgent: "The Gemini API usage limit has been reached. Please try again later.",
      movieReplicateAgent: "The Replicate API usage limit has been reached. Please add billing or try again later.",
      ttsOpenaiAgent: "The OpenAI API usage limit has been reached. Please add billing or try again later.",
      ttsGoogleAgent: "The Gemini API usage limit has been reached. Please try again later.",
      ttsGeminiAgent: "The Gemini API usage limit has been reached. Please try again later.",
      ttsElevenlabsAgent: "The ElevenLabs API usage limit has been reached. Please add billing or try again later.",
      ttsKotodamaAgent: "The Kotodama API usage limit has been reached. Please try again later.",
      bgmElevenlabsAgent: "The ElevenLabs API usage limit has been reached. Please add billing or try again later.",
      voiceCloneElevenlabsAgent:
        "The ElevenLabs API usage limit has been reached. Please add billing or try again later.",
    },
    translate: {
      apiError: {
        translateBeat: "An error occurred during translation.",
        multiLingualFile:
          "Failed to generate translation file. Please check your settings and target data, then try again.",
      },
    },
    apiKeyMissing: {
      OPENAI_API_KEY: "OpenAI API key is not set",
      NIJIVOICE_API_KEY: "NijiVoice API key is not set",
      TAVILY_API_KEY: "Tavily API key is not set",
      ELEVENLABS_API_KEY: "ElevenLabs API key is not set",
      KOTODAMA_API_KEY: "Kotodama API key is not set",
      REPLICATE_API_TOKEN: "Replicate API token is not set",
      GEMINI_API_KEY: "Gemini API key is not set",
      ANTHROPIC_API_KEY: "Anthropic API key is not set",
      GROQ_API_KEY: "GROQ API key is not set",
      EXA_API_KEY: "EXA API key is not set",
    },
  },
};
