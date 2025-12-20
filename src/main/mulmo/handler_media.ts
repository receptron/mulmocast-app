import { loadSettings } from "../settings_manager";
import { mulmoActionRunner } from "./handler_generator";

export const publishMulmoView = async (
  projectId: string,
  webContents?: { send: (channel: string, ...args: unknown[]) => void },
): Promise<{ success: boolean; message?: string }> => {
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

    return {
      success: true,
      message: "Published successfully",
    };
  } catch (error: unknown) {
    console.error("Failed to publish mulmo view:", error);
    throw error;
  }
};
