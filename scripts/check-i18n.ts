import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";
import { en_notify } from "../src/renderer/i18n/en_nofity";
import { ja_notify } from "../src/renderer/i18n/ja_notify";
import { collectKeysWithValues, findMissingKeys, formatMissingKey } from "./check-i18n-core";

let hasErrors = false;

// Check main translation files
console.log("Checking: en.ts <-> ja.ts");
const enMap = collectKeysWithValues(en);
const jaMap = collectKeysWithValues(ja);
const missingKeysMain = findMissingKeys(enMap, jaMap);

if (missingKeysMain.length === 0) {
  console.log("  ✅ OK\n");
} else {
  console.log(`  ❌ Found ${missingKeysMain.length} missing key(s):`);
  missingKeysMain.forEach((missing) => {
    console.log("  " + formatMissingKey(missing).replace(/\n/g, "\n  "));
  });
  console.log();
  hasErrors = true;
}

// Check notify translation files
console.log("Checking: en_nofity.ts <-> ja_notify.ts");
const enNotifyMap = collectKeysWithValues(en_notify);
const jaNotifyMap = collectKeysWithValues(ja_notify);
const missingKeysNotify = findMissingKeys(enNotifyMap, jaNotifyMap);

if (missingKeysNotify.length === 0) {
  console.log("  ✅ OK\n");
} else {
  console.log(`  ❌ Found ${missingKeysNotify.length} missing key(s):`);
  missingKeysNotify.forEach((missing) => {
    console.log("  notify." + formatMissingKey(missing).replace(/\n/g, "\n  "));
  });
  console.log();
  hasErrors = true;
}

if (!hasErrors) {
  console.log("All i18n keys match between en and ja ✅");
  process.exit(0);
}

process.exit(1);
