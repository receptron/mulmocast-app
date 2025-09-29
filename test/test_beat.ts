import { beatTemplates } from "../src/shared/beat_data";
import { getBeatType } from "../src/renderer/lib/beat_util";

import test from "node:test";
import assert from "node:assert";

test("test mulmoScript empty error", async () => {
  beatTemplates.forEach((beatData) => {
    const beatType = getBeatType(beatData.beat);
    assert.equal(beatData.key, beatType);
  });
});
