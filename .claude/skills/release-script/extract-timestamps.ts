/**
 * Extract timestamps from a MulmoCast _studio.json file.
 *
 * Usage:
 *   npx tsx .claude/skills/release-script/extract-timestamps.ts <studio.json path>
 *
 * Output: index, M:SS timestamp, beat id, and raw startAt for each beat.
 */

interface ScriptBeat {
  id?: string;
}

interface StudioBeat {
  startAt?: number;
}

interface StudioJson {
  script?: {
    beats?: ScriptBeat[];
  };
  beats: StudioBeat[];
}

import { readFileSync } from "fs";
import { resolve } from "path";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx .claude/skills/release-script/extract-timestamps.ts <studio.json>");
  process.exit(1);
}

const data: StudioJson = JSON.parse(readFileSync(resolve(filePath), "utf-8"));

for (const [i, beat] of data.beats.entries()) {
  const sec = beat.startAt ?? 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ts = `${m}:${String(s).padStart(2, "0")}`;
  const id = data.script?.beats?.[i]?.id ?? "N/A";
  console.log(`${i}: ${ts} id=${id} startAt=${sec}`);
}
