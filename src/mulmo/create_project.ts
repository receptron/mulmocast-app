import { app } from "electron";
import path from "path";
import fs from "fs";

import { mkdir } from "mulmocast";

export const mulmoCreateProject = (projectId: string) => {
  const projectPath = path.resolve(app.getPath("userData"), "projects", projectId);

  const initData = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        speaker: "Host",
        text: "Welcome to Mulmocast Tech Insights.",
      },
    ],
  };

  mkdir(projectPath);
  fs.writeFileSync(path.resolve(projectPath, "mulmo.json"), JSON.stringify(initData));
};
