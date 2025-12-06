import { getProjectPath } from "../project_manager";
import path from "path";
import fs from "fs";

export const mulmoAudioBgmUpload = async (projectId: string, filename: string, bufferArray: Uint8Array) => {
  const dirPath = "upload_audio_bgm";

  const projectPath = getProjectPath(projectId);
  const dir = path.resolve(projectPath, dirPath);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, Buffer.from(bufferArray));

  return path.join(dirPath, filename);
};

export const mulmoAudioBgmGet = async (projectId: string, bgmPath: string) => {
  const projectPath = getProjectPath(projectId);

  const cleanPath = bgmPath.replace(/^\.\//, "");
  const filePath = path.resolve(projectPath, cleanPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`BGM file not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  return buffer;
};

export const mulmoBeatAudioUpload = async (
  projectId: string,
  beatIndex: number,
  filename: string,
  bufferArray: Uint8Array,
) => {
  const dirPath = "upload_audio";

  const projectPath = getProjectPath(projectId);
  const dir = path.resolve(projectPath, dirPath);
  fs.mkdirSync(dir, { recursive: true });

  // Use beat index in filename to avoid conflicts
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const uniqueFilename = `beat_${beatIndex}_${baseName}${ext}`;
  const filePath = path.join(dir, uniqueFilename);
  fs.writeFileSync(filePath, Buffer.from(bufferArray));

  return path.join(dirPath, uniqueFilename);
};

export const mulmoBeatAudioGet = async (projectId: string, audioPath: string) => {
  const projectPath = getProjectPath(projectId);

  const cleanPath = audioPath.replace(/^\.\//, "").replace(/^\.\.\/(\.\.\/)?assets\/audio\//, "upload_audio/");
  const filePath = path.resolve(projectPath, cleanPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  return buffer;
};
