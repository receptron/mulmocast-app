import { Readable } from "node:stream";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { randomUUID } from "crypto";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// BGM metadata structure
export interface BgmMetadata {
  id: string;
  fileName: string; // e.g., "20251102123311-abc123.mp3"
  title: string;
  prompt: string;
  duration: string; // "30s", "60s", "120s"
  createdAt: string; // ISO string
}

interface BgmData {
  items: BgmMetadata[];
}

// Get BGM directory path
const getBgmDirectory = (): string => {
  const userDataPath = app.getPath("userData");
  const bgmDir = path.join(userDataPath, "bgm");

  // Create directory if it doesn't exist
  if (!fs.existsSync(bgmDir)) {
    fs.mkdirSync(bgmDir, { recursive: true });
  }

  return bgmDir;
};

// Get data.json path
const getDataJsonPath = (): string => {
  return path.join(getBgmDirectory(), "data.json");
};

// Load BGM data from data.json
const loadBgmData = (): BgmData => {
  const dataPath = getDataJsonPath();

  if (!fs.existsSync(dataPath)) {
    return { items: [] };
  }

  try {
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content) as BgmData;
  } catch (error) {
    console.error("Failed to load BGM data:", error);
    return { items: [] };
  }
};

// Save BGM data to data.json
const saveBgmData = (data: BgmData): void => {
  const dataPath = getDataJsonPath();

  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save BGM data:", error);
    throw error;
  }
};

// Generate filename with timestamp and random ID
const generateFileName = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").split(".")[0]; // YYYYMMDDHHMMSS
  const randomId = randomUUID().split("-")[0]; // First part of UUID
  return `${timestamp}-${randomId}.mp3`;
};

// Convert duration string to milliseconds
const durationToMs = (duration: string): number => {
  const value = parseInt(duration.replace("s", ""));
  return value * 1000;
};

/**
 * List all BGM items
 */
export const bgmList = async (): Promise<BgmMetadata[]> => {
  const data = loadBgmData();
  return data.items;
};

/**
 * Get BGM audio file as ArrayBuffer
 */
export const bgmAudioFile = async (id: string): Promise<ArrayBuffer | null> => {
  const data = loadBgmData();
  const item = data.items.find((i) => i.id === id);

  if (!item) {
    return null;
  }

  const filePath = path.join(getBgmDirectory(), item.fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.buffer;
  } catch (error) {
    console.error("Failed to read BGM file:", error);
    return null;
  }
};

/**
 * Generate new BGM using ElevenLabs API
 */
export const bgmGenerate = async (prompt: string, duration: string, title: string): Promise<BgmMetadata> => {
  const elevenlabs = new ElevenLabsClient();

  // Generate music
  let track;
  try {
    track = await elevenlabs.music.compose({
      prompt,
      musicLengthMs: durationToMs(duration),
    });
  } catch (error: any) {
    // Handle ElevenLabs API errors with structured cause
    if (error?.status === 401 || error?.statusCode === 401) {
      throw new Error("Failed to generate music: Invalid API key", {
        cause: {
          action: "music",
          type: "apiKeyInvalid",
          agentName: "ttsElevenlabsAgent",
        },
      });
    }
    // Re-throw other errors as-is
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readable = (track as any).audioStream ?? (track as any).stream ?? (track as any).data ?? track;

  if (!(readable instanceof ReadableStream)) {
    throw new Error("No Web ReadableStream found on track");
  }

  // Web ReadableStream → Node.js Readable
  const nodeStream = Readable.fromWeb(readable);

  // Generate filename and save
  const fileName = generateFileName();
  const filePath = path.join(getBgmDirectory(), fileName);
  const fileStream = fs.createWriteStream(filePath);

  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(fileStream);
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });

  // Create metadata
  const metadata: BgmMetadata = {
    id: randomUUID(),
    fileName,
    title,
    prompt,
    duration,
    createdAt: new Date().toISOString(),
  };

  // Update data.json
  const data = loadBgmData();
  data.items.unshift(metadata);
  saveBgmData(data);

  return metadata;
};

/**
 * Update BGM title
 */
export const bgmUpdateTitle = async (id: string, title: string): Promise<boolean> => {
  const data = loadBgmData();
  const item = data.items.find((i) => i.id === id);

  if (!item) {
    return false;
  }

  item.title = title;
  saveBgmData(data);

  return true;
};

/**
 * Delete BGM item
 */
export const bgmDelete = async (id: string): Promise<boolean> => {
  const data = loadBgmData();
  const itemIndex = data.items.findIndex((i) => i.id === id);

  if (itemIndex === -1) {
    return false;
  }

  const item = data.items[itemIndex];

  // Delete file
  const filePath = path.join(getBgmDirectory(), item.fileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Failed to delete BGM file:", error);
      // Continue to remove from data.json even if file deletion fails
    }
  }

  // Remove from data.json
  data.items.splice(itemIndex, 1);
  saveBgmData(data);

  return true;
};
