import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { loadSettings } from "../settings_manager";

export interface ClonedVoice {
  voice_id: string;
  name: string;
  category?: string;
  previewUrl?: string;
}

interface ApiError {
  status?: number;
  statusCode?: number;
  body?: {
    detail?: {
      status?: string;
      message?: string;
    };
  };
}

// Helper function to handle ElevenLabs 400 errors
const handleBadRequestError = (error: unknown, operationName: string): void => {
  const apiError = error as ApiError;

  if (apiError?.status === 400 || apiError?.statusCode === 400) {
    const status = apiError?.body?.detail?.status;
    const message = apiError?.body?.detail?.message;

    console.error("ElevenLabs API 400 error:", {
      status,
      message,
    });

    if (status === "voice_limit_reached") {
      throw new Error("Voice clone limit reached", {
        cause: {
          action: "voiceClone",
          type: "voice_limit_reached",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    if (status === "can_not_use_instant_voice_cloning") {
      throw new Error("Instant voice cloning not available", {
        cause: {
          action: "voiceClone",
          type: "can_not_use_instant_voice_cloning",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    // Handle other 400 errors generically
    throw new Error(`${operationName}: ${message || "Bad request"}`, {
      cause: {
        action: "voiceClone",
        type: status || "badRequest",
        agentName: "voiceCloneElevenlabsAgent",
      },
    });
  }
};

// Get cloned voices from ElevenLabs
export const getClonedVoices = async (): Promise<ClonedVoice[]> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set", {
      cause: {
        action: "voiceClone",
        type: "apiKeyMissing",
        agentName: "voiceCloneElevenlabsAgent",
      },
    });
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  let result;
  try {
    result = await client.voices.search({
      category: "cloned",
    });
  } catch (error: unknown) {
    // Handle 400 errors first
    handleBadRequestError(error, "Failed to get cloned voices");

    // Handle ElevenLabs API errors with structured cause
    const apiError = error as {
      status?: number;
      statusCode?: number;
      body?: {
        detail?: {
          status?: string;
          message?: string;
        };
      };
    };

    console.error("ElevenLabs API error:", {
      status: apiError?.status,
      statusCode: apiError?.statusCode,
      body: apiError?.body,
    });

    if (apiError?.status === 401 || apiError?.statusCode === 401) {
      throw new Error("Failed to get cloned voices: Invalid API key", {
        cause: {
          action: "voiceClone",
          type: "apiKeyInvalid",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    if (apiError?.status === 403 || apiError?.statusCode === 403) {
      throw new Error("Failed to get cloned voices: Permission denied", {
        cause: {
          action: "voiceClone",
          type: "permissionDenied",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    // Re-throw other errors as-is
    throw error;
  }

  // Extract relevant voice information
  const voices: ClonedVoice[] = result.voices.map((voice) => ({
    voice_id: voice.voiceId,
    name: voice.name,
    category: voice.category,
    previewUrl: voice.previewUrl,
  }));

  return voices;
};

// Update voice name
export const updateVoiceName = async (voiceId: string, name: string): Promise<void> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set", {
      cause: {
        action: "voiceClone",
        type: "apiKeyMissing",
        agentName: "voiceCloneElevenlabsAgent",
      },
    });
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  try {
    await client.voices.update(voiceId, { name });
  } catch (error: unknown) {
    // Handle 400 errors first
    handleBadRequestError(error, "Failed to update voice name");

    const apiError = error as {
      status?: number;
      statusCode?: number;
    };

    if (apiError?.status === 401 || apiError?.statusCode === 401) {
      throw new Error("Failed to update voice name: Invalid API key", {
        cause: {
          action: "voiceClone",
          type: "apiKeyInvalid",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    throw error;
  }
};

// Upload voice clone
export const uploadVoiceClone = async (
  name: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
): Promise<{ voice_id: string }> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set", {
      cause: {
        action: "voiceClone",
        type: "apiKeyMissing",
        agentName: "voiceCloneElevenlabsAgent",
      },
    });
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  // Convert ArrayBuffer to File
  const blob = new Blob([fileBuffer]);
  const file = new File([blob], fileName, {
    type: "audio/mpeg", // Default to mp3, could be detected from fileName
  });

  let result;
  try {
    result = await client.voices.ivc.create({
      name,
      files: [file],
      removeBackgroundNoise: false,
    });
  } catch (error: unknown) {
    // Handle 400 errors first
    handleBadRequestError(error, "Voice clone operation failed");

    const apiError = error as {
      status?: number;
      statusCode?: number;
    };

    if (apiError?.status === 401 || apiError?.statusCode === 401) {
      throw new Error("Failed to upload voice clone: Invalid API key", {
        cause: {
          action: "voiceClone",
          type: "apiKeyInvalid",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    throw error;
  }

  return {
    voice_id: result.voiceId,
  };
};

// Delete voice clone
export const deleteVoice = async (voiceId: string): Promise<void> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set", {
      cause: {
        action: "voiceClone",
        type: "apiKeyMissing",
        agentName: "voiceCloneElevenlabsAgent",
      },
    });
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  try {
    await client.voices.delete(voiceId);
  } catch (error: unknown) {
    // Handle 400 errors first
    handleBadRequestError(error, "Failed to delete voice clone");

    const apiError = error as {
      status?: number;
      statusCode?: number;
    };

    if (apiError?.status === 401 || apiError?.statusCode === 401) {
      throw new Error("Failed to delete voice clone: Invalid API key", {
        cause: {
          action: "voiceClone",
          type: "apiKeyInvalid",
          agentName: "voiceCloneElevenlabsAgent",
        },
      });
    }

    throw error;
  }
};
