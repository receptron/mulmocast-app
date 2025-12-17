import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { loadSettings } from "../settings_manager";

export interface ClonedVoice {
  voice_id: string;
  name: string;
  category?: string;
  previewUrl?: string;
}

// Get cloned voices from ElevenLabs
export const getClonedVoices = async (): Promise<ClonedVoice[]> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set");
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  const result = await client.voices.search({
    category: "cloned",
  });

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
    throw new Error("ElevenLabs API Key is not set");
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  await client.voices.update(voiceId, {
    name,
  });
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
    throw new Error("ElevenLabs API Key is not set");
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  // Convert ArrayBuffer to File
  const blob = new Blob([fileBuffer]);
  const file = new File([blob], fileName, {
    type: "audio/mpeg", // Default to mp3, could be detected from fileName
  });

  const result = await client.voices.ivc.create({
    name,
    files: [file],
    removeBackgroundNoise: false,
  });

  return {
    voice_id: result.voiceId,
  };
};

// Delete voice clone
export const deleteVoice = async (voiceId: string): Promise<void> => {
  const settings = await loadSettings();
  const apiKey = settings.APIKEY["ELEVENLABS_API_KEY"];

  if (!apiKey) {
    throw new Error("ElevenLabs API Key is not set");
  }

  const client = new ElevenLabsClient({
    apiKey,
  });

  await client.voices.delete(voiceId);
};
