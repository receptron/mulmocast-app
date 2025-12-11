import fs from "fs";
import path from "path";

import { VOICE_LISTS } from "../src/shared/constants";
import { provider2TTSAgent } from "mulmocast/browser";

// const provider = "gemini";
Object.keys(provider2TTSAgent).map(provider => {
  if (VOICE_LISTS[provider]) {
    const models = provider2TTSAgent[provider].models ?? ["none"];
    models.map(model => {
      const speakers = {};
      const beats = [];
      VOICE_LISTS[provider].map((data) => {
        const { id, key } = data;
        const name = key ?? id;
        speakers[id] = {
          provider,
          voiceId: id,
          // model
        };
        if (model !== "none") {
          speakers[id].model = model;
        }
        beats.push({
          id: id,
          speaker: id,
          text: `こんにちは, これは音声テストです。音声は ${name} です`,
          image: {
            type: "markdown",
            markdown: [`# Voice is ${name}`],
          },
        });
        console.log(id);
      });
      
      const data = {
        $mulmocast: {
          version: "1.0",
          credit: "closing",
        },
        speechParams: {
          speakers,
        },
        beats,
      };
      
      console.log(data);
      
      // Write to file
      const fileName = model === "none" ? `mulmoscripts/${provider}_voice.json` : `mulmoscripts/${provider}_${model}_voice.json`;
      const outputPath = path.resolve(fileName);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`\nWritten to: ${outputPath}`);
    });
  }
});
