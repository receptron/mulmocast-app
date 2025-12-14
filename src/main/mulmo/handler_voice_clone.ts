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
