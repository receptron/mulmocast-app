import { loadSettings } from "../settings_manager";
import { mulmoActionRunner } from "./handler_generator";
import { getProjectPath } from "../project_manager";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import AdmZip from "adm-zip";

const API_BASE_URL = "https://mulmocast-app-dev.web.app/api/1.0";

interface SignData {
  fileName: string;
  key: string;
  contentType: string;
  url: string;
}

interface PostResponse {
  uploadPath: string;
  cloudBasePath: string;
  signs: SignData[];
}

/**
 * R2にファイルをアップロードする
 */
async function uploadFileToR2(sign: SignData, mediaDir: string): Promise<boolean> {
  const filePath = path.join(mediaDir, sign.fileName);

  // ファイルが存在するか確認
  if (!fs.existsSync(filePath)) {
    console.error(`Failed to upload: ${sign.fileName} not found`);
    return false;
  }

  const fileBuffer = fs.readFileSync(filePath);

  try {
    // presigned URLにPUT
    const response = await fetch(sign.url, {
      method: "PUT",
      headers: {
        "Content-Type": sign.contentType,
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!response.ok) {
      console.error(`Failed to upload ${sign.fileName}: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error uploading ${sign.fileName}:`, error);
    return false;
  }
}

/**
 * zipファイルを展開してアップロードする
 */
async function uploadBundleToServer(
  zipFilePath: string,
  apiKey: string,
): Promise<{ success: boolean; uploadPath?: string }> {
  // tmpディレクトリに展開
  const tmpDir = os.tmpdir();
  const extractDir = fs.mkdtempSync(path.join(tmpDir, "mulmocast-upload-"));

  try {
    // zipファイルを展開
    const zip = new AdmZip(zipFilePath);
    // eslint-disable-next-line sonarjs/no-unsafe-unzip
    zip.extractAllTo(extractDir, true);

    // mulmo_view.jsonのパスを探す
    const jsonFilePath = path.join(extractDir, "mulmo_view.json");
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error("mulmo_view.json not found in zip file");
    }

    // JSONを読み込む
    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const viewer = JSON.parse(fileContent);

    // POSTリクエスト
    const response = await fetch(`${API_BASE_URL}/me/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ viewer }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }

    const data: PostResponse = await response.json();

    // R2にファイルをアップロード
    if (data.signs && data.signs.length > 0) {
      let failCount = 0;

      for (const sign of data.signs) {
        const success = await uploadFileToR2(sign, extractDir);
        if (!success) {
          failCount++;
        }
      }

      if (failCount > 0) {
        throw new Error(`Failed to upload ${failCount} out of ${data.signs.length} files`);
      }
    }

    // 展開したディレクトリを削除
    fs.rmSync(extractDir, { recursive: true, force: true });

    return {
      success: true,
      uploadPath: data.uploadPath,
    };
  } catch (error) {
    // エラー時も展開したディレクトリを削除
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    throw error;
  }
}

export const publishMulmoView = async (
  projectId: string,
  webContents?: { send: (channel: string, ...args: unknown[]) => void },
): Promise<{ success: boolean; message?: string; uploadPath?: string }> => {
  try {
    const settings = await loadSettings();
    const apiKey = process.env.VITE_MULMO_MEDIA_API_KEY || settings.APIKEY?.["VITE_MULMO_MEDIA_API_KEY"];

    if (!apiKey) {
      throw new Error("VITE_MULMO_MEDIA_API_KEY is not set", {
        cause: {
          action: "publish",
          type: "apiKeyMissing",
          agentName: "mulmoMediaAgent",
        },
      });
    }

    // Use mulmoActionRunner to run bundle action
    // Create a minimal webContents if not provided
    const dummyWebContents = webContents || {
      send: () => {
        // no-op
      },
    };

    const result = await mulmoActionRunner(projectId, "bundle", undefined, dummyWebContents as never);

    if (!result.result) {
      throw new Error("Failed to generate bundle");
    }

    // Find the generated zip file
    const projectPath = getProjectPath(projectId);
    const outputDir = path.join(projectPath, "output");

    // Check multiple possible zip file names
    const possibleZipNames = ["mulmoviewer.zip", "viewer.zip", "bundle.zip"];
    let zipFilePath: string | null = null;

    for (const zipName of possibleZipNames) {
      const testPath = path.join(outputDir, zipName);
      if (fs.existsSync(testPath)) {
        zipFilePath = testPath;
        break;
      }
    }

    // If not found in root, search in subdirectories
    if (!zipFilePath && fs.existsSync(outputDir)) {
      const findZipFile = (dir: string): string | null => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile() && entry.name.endsWith(".zip")) {
            return fullPath;
          }
          if (entry.isDirectory()) {
            const found = findZipFile(fullPath);
            if (found) return found;
          }
        }
        return null;
      };

      zipFilePath = findZipFile(outputDir);
    }

    if (!zipFilePath) {
      throw new Error("Bundle zip file not found");
    }

    // Upload to server
    const uploadResult = await uploadBundleToServer(zipFilePath, apiKey);

    return {
      success: true,
      message: "Published successfully",
      uploadPath: uploadResult.uploadPath,
    };
  } catch (error: unknown) {
    console.error("Failed to publish mulmo view:", error);
    throw error;
  }
};
