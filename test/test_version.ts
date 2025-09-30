import test from "node:test";
import assert from "node:assert";
import { resolveTargetAndVersion } from "../src/shared/version";

// テストケース一覧
const cases = [
  // mainブランチは常にtest
  { branch: "main", packageVersion: "1.2.3", expected: { target: "test" } },

  // release/x.y.z かつ packageVersion一致 → prod
  { branch: "release/1.2.3", packageVersion: "1.2.3", expected: { target: "prod", version: "1.2.3" } },
  // release/x.y.z かつ packageVersion不一致 → unknown
  { branch: "release/1.2.3", packageVersion: "1.2.4", expected: { target: "unknown" } },

  // release/x.y.z-rc-n かつ packageVersion一致 → dev
  { branch: "release/1.2.3-rc-1", packageVersion: "1.2.3-rc-1", expected: { target: "dev", version: "1.2.3-rc-1" } },
  // release/x.y.z-rc-n かつ packageVersion不一致 → unknown
  { branch: "release/1.2.3-rc-1", packageVersion: "1.2.3-rc-2", expected: { target: "unknown" } },

  // release/x.y.z-rc1（ハイフンなし）→ unknown（仕様外）
  { branch: "release/1.2.3-rc1", packageVersion: "1.2.3-rc1", expected: { target: "unknown" } },

  // その他のブランチ → unknown
  { branch: "feature/foo", packageVersion: "1.2.3", expected: { target: "unknown" } },
  { branch: "hotfix/1.2.3", packageVersion: "1.2.3", expected: { target: "unknown" } },
];

test("resolveTargetAndVersion branch/version matrix", () => {
  for (const { branch, packageVersion, expected } of cases) {
    const result = resolveTargetAndVersion(branch, packageVersion);
    assert.deepStrictEqual(result, expected, `branch=${branch}, packageVersion=${packageVersion}`);
  }
});
