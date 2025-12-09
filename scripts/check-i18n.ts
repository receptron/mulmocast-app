import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";
import { collectKeysWithValues, findMissingKeys, formatMissingKey } from "./check-i18n-core";

const enMap = collectKeysWithValues(en);
const jaMap = collectKeysWithValues(ja);

const missingKeys = findMissingKeys(enMap, jaMap);

if (missingKeys.length === 0) {
  console.log("i18n keys match between en and ja ✅");
  process.exit(0);
}

missingKeys.forEach((missing) => {
  console.log(formatMissingKey(missing));
});

process.exit(1);
