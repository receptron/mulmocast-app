import { initializeContext, type MulmoStudioContext } from "mulmocast";
import { getProjectPath, SCRIPT_FILE_NAME } from "../project_manager";
import path from "path";
import { WebContents } from "electron";

export const getContext = async (projectId: string, targetLang?: string): Promise<MulmoStudioContext | null> => {
  const projectPath = getProjectPath(projectId);

  const argv = {
    v: true,
    b: projectPath,
    o: path.join(projectPath, "output"),
    file: SCRIPT_FILE_NAME,
    l: targetLang,
  };

  return await initializeContext(argv);
};

// Filter and send only essential progress updates
export const sendProgressUpdateFiltered = (
  webContents: WebContents,
  projectId: string,
  type: string,
  data: unknown,
): void => {
  if (!webContents) return;

  // Send errors immediately
  if (type === "error" || type === "zod_error") {
    webContents.send("progress-update", {
      projectId,
      type,
      data,
    });
    return;
  }

  // Send only session start/end for mulmo
  if (type === "mulmo") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mulmoData = data as any;

    if (mulmoData?.kind === "session") {
      webContents.send("progress-update", {
        projectId,
        type,
        data,
      });
    }
    return;
  }

  if (type === "graphai") {
    return;
  }
};

export const mulmoCallbackGenerator = (projectId: string, webContents: WebContents) => {
  return (data: unknown) => {
    if (webContents) {
      sendProgressUpdateFiltered(webContents, projectId, "mulmo", data);
    }
  };
};
