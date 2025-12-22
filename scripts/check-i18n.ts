import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";
import { en_notify } from "../src/renderer/i18n/en_nofity";
import { ja_notify } from "../src/renderer/i18n/ja_notify";
import { collectKeysWithValues, findMissingKeys, formatMissingKey } from "./check-i18n-core";

// Check main translation files
const enMap = collectKeysWithValues(en);
const jaMap = collectKeysWithValues(ja);

const missingKeysMain = findMissingKeys(enMap, jaMap);

// Check notify translation files
const enNotifyMap = collectKeysWithValues(en_notify);
const jaNotifyMap = collectKeysWithValues(ja_notify);

const missingKeysNotify = findMissingKeys(enNotifyMap, jaNotifyMap);

// Combine all missing keys
const allMissingKeys = [
  ...missingKeysMain,
  ...missingKeysNotify.map((missing) => ({
    ...missing,
    key: `notify.${missing.key}`,
  })),
];

if (allMissingKeys.length === 0) {
  console.log("i18n keys match between en and ja ✅");
  process.exit(0);
}

console.log("Missing translation keys found:");
allMissingKeys.forEach((missing) => {
  console.log(formatMissingKey(missing));
});

process.exit(1);
