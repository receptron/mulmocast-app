import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";
import { en_notify } from "../src/renderer/i18n/en_notify";
import { ja_notify } from "../src/renderer/i18n/ja_notify";
import { collectKeysWithValues, findMissingKeys } from "./check-i18n-core";

// Load .env file if it exists (for local development)
// Only load when not in test environment
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

interface GoogleGenerativeAIError extends Error {
  status?: number;
  errorDetails?: Array<{
    "@type": string;
    retryDelay?: string;
  }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildObjectFromKey(key: string, value: string): Record<string, unknown> {
  const parts = key.split(".");
  const result: Record<string, unknown> = {};

  // Validate key segments to prevent prototype pollution
  for (const part of parts) {
    if (!part || part === "__proto__" || part === "constructor" || part === "prototype") {
      throw new Error(`Invalid key segment: "${part}" in key "${key}"`);
    }
  }

  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target };

  for (const key in source) {
    // Only process own properties to prevent prototype pollution
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    // Additional security check for dangerous keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

function formatTypescriptObject(obj: Record<string, unknown>, indent = 0): string {
  const spaces = "  ".repeat(indent);
  const innerSpaces = "  ".repeat(indent + 1);

  const entries = Object.entries(obj).map(([key, value]) => {
    const safeKey = /^[a-zA-Z_]\w*$/.test(key) ? key : `"${key}"`;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return `${innerSpaces}${safeKey}: ${formatTypescriptObject(value as Record<string, unknown>, indent + 1)}`;
    } else if (typeof value === "string") {
      // Escape special characters in string values
      const escapedValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      return `${innerSpaces}${safeKey}: "${escapedValue}"`;
    } else {
      return `${innerSpaces}${safeKey}: ${JSON.stringify(value)}`;
    }
  });

  return `{\n${entries.join(",\n")}\n${spaces}}`;
}

async function translateAndUpdateMainFile(
  filePath: string,
  sourceKeys: Array<{ key: string; sourceValue: string }>,
  sourceLanguage: "en" | "ja",
  targetLanguage: "en" | "ja",
  model: GenerativeModel,
  retryCount = 0,
): Promise<void> {
  if (sourceKeys.length === 0) return;

  const maxRetries = 3;
  const sourceLang = sourceLanguage === "en" ? "English" : "Japanese";
  const targetLang = targetLanguage === "en" ? "English" : "Japanese";

  // Read the original file
  const originalContent = await fs.readFile(filePath, "utf-8");

  // Build the list of missing keys to translate
  const keysToTranslate = sourceKeys.map((k) => `  - ${k.key}: "${k.sourceValue}"`).join("\n");

  const prompt = `You are a TypeScript code editor and professional translator for a software application UI.

I need you to:
1. Translate missing keys from ${sourceLang} to ${targetLang}
2. Insert the translated keys at appropriate positions in the i18n file

ORIGINAL FILE CONTENT:
\`\`\`typescript
${originalContent}
\`\`\`

MISSING KEYS TO TRANSLATE (from ${sourceLang} to ${targetLang}):
${keysToTranslate}

Context: This is an Electron+Vue.js application called MulmoCast, which is a multimedia presentation creation tool.

TRANSLATION REQUIREMENTS:
- Provide ONLY the translated text for each key, no explanations
- Keep translations concise and natural for UI text
- Maintain any special formatting like line breaks
- If there are technical terms, keep them appropriate for the software domain
- For Japanese: Use appropriate formality level for application UI (です/ます form)

FILE EDITING REQUIREMENTS:
1. Add each translated key to the appropriate nested location in the object
2. PRESERVE ALL existing comments, empty lines, and formatting EXACTLY as they are
3. PRESERVE trailing commas on all entries
4. Match the existing indentation style (2 spaces)
5. Place new keys in logical positions near related keys if possible
6. DO NOT reorder any existing keys
7. DO NOT remove or modify any comments
8. DO NOT change any existing formatting
9. Return ONLY the complete updated file content, nothing else

Please provide the complete updated file content:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let updatedContent = response.text().trim();

    // Remove markdown code fences if the model added them
    updatedContent = updatedContent.replace(/^```typescript\n/, "").replace(/\n```$/, "");
    updatedContent = updatedContent.replace(/^```\n/, "").replace(/\n```$/, "");

    // Write back
    await fs.writeFile(filePath, updatedContent, "utf-8");
  } catch (error) {
    const geminiError = error as GoogleGenerativeAIError;

    // Handle rate limit errors (429)
    if (geminiError.status === 429) {
      if (retryCount < maxRetries) {
        // Extract retry delay from error details
        let retryDelay = 2000; // default 2 seconds
        if (geminiError.errorDetails) {
          const retryInfo = geminiError.errorDetails.find((d) => d["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) {
            const delayMatch = retryInfo.retryDelay.match(/(\d+(\.\d+)?)/);
            if (delayMatch) {
              retryDelay = Math.ceil(parseFloat(delayMatch[1]) * 1000);
            }
          }
        }

        console.log(
          `  ⏳ Rate limit reached. Retrying in ${retryDelay / 1000}s... (attempt ${retryCount + 1}/${maxRetries})`,
        );
        await sleep(retryDelay);
        return translateAndUpdateMainFile(filePath, sourceKeys, sourceLanguage, targetLanguage, model, retryCount + 1);
      } else {
        console.error(`  ❌ Max retries (${maxRetries}) exceeded for file "${filePath}"`);
        console.error(`  💡 Please wait a moment and run the script again, or check your API quota.`);
        throw error;
      }
    }

    // Handle other errors
    console.error(`  ⚠️  Failed to update file ${filePath}:`, geminiError.message);
    throw error;
  }
}

async function translateAndUpdateNotifyFile(
  filePath: string,
  sourceKeys: Array<{ key: string; sourceValue: string }>,
  sourceLanguage: "en" | "ja",
  targetLanguage: "en" | "ja",
  model: GenerativeModel,
  retryCount = 0,
): Promise<void> {
  if (sourceKeys.length === 0) return;

  const maxRetries = 3;
  const sourceLang = sourceLanguage === "en" ? "English" : "Japanese";
  const targetLang = targetLanguage === "en" ? "English" : "Japanese";

  // Read the original file
  const originalContent = await fs.readFile(filePath, "utf-8");

  // Build the list of missing keys to translate
  const keysToTranslate = sourceKeys.map((k) => `  - ${k.key}: "${k.sourceValue}"`).join("\n");

  const prompt = `You are a TypeScript code editor and professional translator for a software application UI.

I need you to:
1. Translate missing keys from ${sourceLang} to ${targetLang}
2. Insert the translated keys at appropriate positions in the i18n notification file

ORIGINAL FILE CONTENT:
\`\`\`typescript
${originalContent}
\`\`\`

MISSING KEYS TO TRANSLATE (from ${sourceLang} to ${targetLang}):
${keysToTranslate}

Context: This is an Electron+Vue.js application called MulmoCast, which is a multimedia presentation creation tool.

TRANSLATION REQUIREMENTS:
- Provide ONLY the translated text for each key, no explanations
- Keep translations concise and natural for UI text
- Maintain any special formatting like line breaks
- If there are technical terms, keep them appropriate for the software domain
- For Japanese: Use appropriate formality level for application UI (です/ます form)

FILE EDITING REQUIREMENTS:
1. Add each translated key to the appropriate nested location in the object
2. PRESERVE ALL existing comments, empty lines, and formatting EXACTLY as they are
3. PRESERVE trailing commas on all entries
4. Match the existing indentation style (2 spaces)
5. Place new keys in logical positions near related keys if possible
6. DO NOT reorder any existing keys
7. DO NOT remove or modify any comments
8. DO NOT change any existing formatting
9. Return ONLY the complete updated file content, nothing else

Please provide the complete updated file content:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let updatedContent = response.text().trim();

    // Remove markdown code fences if the model added them
    updatedContent = updatedContent.replace(/^```typescript\n/, "").replace(/\n```$/, "");
    updatedContent = updatedContent.replace(/^```\n/, "").replace(/\n```$/, "");

    // Write back
    await fs.writeFile(filePath, updatedContent, "utf-8");
  } catch (error) {
    const geminiError = error as GoogleGenerativeAIError;

    // Handle rate limit errors (429)
    if (geminiError.status === 429) {
      if (retryCount < maxRetries) {
        // Extract retry delay from error details
        let retryDelay = 2000; // default 2 seconds
        if (geminiError.errorDetails) {
          const retryInfo = geminiError.errorDetails.find((d) => d["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) {
            const delayMatch = retryInfo.retryDelay.match(/(\d+(\.\d+)?)/);
            if (delayMatch) {
              retryDelay = Math.ceil(parseFloat(delayMatch[1]) * 1000);
            }
          }
        }

        console.log(
          `  ⏳ Rate limit reached. Retrying in ${retryDelay / 1000}s... (attempt ${retryCount + 1}/${maxRetries})`,
        );
        await sleep(retryDelay);
        return translateAndUpdateNotifyFile(
          filePath,
          sourceKeys,
          sourceLanguage,
          targetLanguage,
          model,
          retryCount + 1,
        );
      } else {
        console.error(`  ❌ Max retries (${maxRetries}) exceeded for file "${filePath}"`);
        console.error(`  💡 Please wait a moment and run the script again, or check your API quota.`);
        throw error;
      }
    }

    // Handle other errors
    console.error(`  ⚠️  Failed to update file ${filePath}:`, geminiError.message);
    throw error;
  }
}

async function generateTranslations() {
  console.log("🌍 Starting i18n translation generation...\n");

  // Initialize Gemini API client (only when actually running translations)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please set it with: export GEMINI_API_KEY=your_api_key",
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Check main translation files
  console.log("Checking: en.ts <-> ja.ts");
  const enMap = collectKeysWithValues(en);
  const jaMap = collectKeysWithValues(ja);
  const missingKeysMain = findMissingKeys(enMap, jaMap);

  // Check notify translation files
  console.log("Checking: en_notify.ts <-> ja_notify.ts");
  const enNotifyMap = collectKeysWithValues(en_notify);
  const jaNotifyMap = collectKeysWithValues(ja_notify);
  const missingKeysNotify = findMissingKeys(enNotifyMap, jaNotifyMap);

  if (missingKeysMain.length === 0 && missingKeysNotify.length === 0) {
    console.log("\n✅ All translations are complete! No missing keys found.");
    return;
  }

  console.log(`\nFound ${missingKeysMain.length + missingKeysNotify.length} missing translation(s)\n`);

  // Prepare source keys grouped by file and target language
  const jaMainKeys: Array<{ key: string; sourceValue: string }> = [];
  const enMainKeys: Array<{ key: string; sourceValue: string }> = [];
  const jaNotifyKeys: Array<{ key: string; sourceValue: string }> = [];
  const enNotifyKeys: Array<{ key: string; sourceValue: string }> = [];

  for (const missing of missingKeysMain) {
    if (missing.enValue && !missing.jaValue) {
      jaMainKeys.push({ key: missing.key, sourceValue: missing.enValue });
    } else if (missing.jaValue && !missing.enValue) {
      enMainKeys.push({ key: missing.key, sourceValue: missing.jaValue });
    }
  }

  for (const missing of missingKeysNotify) {
    if (missing.enValue && !missing.jaValue) {
      jaNotifyKeys.push({ key: missing.key, sourceValue: missing.enValue });
    } else if (missing.jaValue && !missing.enValue) {
      enNotifyKeys.push({ key: missing.key, sourceValue: missing.jaValue });
    }
  }

  // Translate and update files in one step
  console.log("\n🔄 Translating and updating files...");

  const i18nDir = path.join(process.cwd(), "src/renderer/i18n");

  if (jaMainKeys.length > 0) {
    console.log(`\n📝 Processing ja.ts (${jaMainKeys.length} key(s) to translate from English)...`);
    await translateAndUpdateMainFile(path.join(i18nDir, "ja.ts"), jaMainKeys, "en", "ja", model);
    console.log("  ✅ Updated: ja.ts");
  }

  if (enMainKeys.length > 0) {
    console.log(`\n📝 Processing en.ts (${enMainKeys.length} key(s) to translate from Japanese)...`);
    await translateAndUpdateMainFile(path.join(i18nDir, "en.ts"), enMainKeys, "ja", "en", model);
    console.log("  ✅ Updated: en.ts");
  }

  if (jaNotifyKeys.length > 0) {
    console.log(`\n📝 Processing ja_notify.ts (${jaNotifyKeys.length} key(s) to translate from English)...`);
    await translateAndUpdateNotifyFile(path.join(i18nDir, "ja_notify.ts"), jaNotifyKeys, "en", "ja", model);
    console.log("  ✅ Updated: ja_notify.ts");
  }

  if (enNotifyKeys.length > 0) {
    console.log(`\n📝 Processing en_notify.ts (${enNotifyKeys.length} key(s) to translate from Japanese)...`);
    await translateAndUpdateNotifyFile(path.join(i18nDir, "en_notify.ts"), enNotifyKeys, "ja", "en", model);
    console.log("  ✅ Updated: en_notify.ts");
  }

  console.log("\n✨ Translation generation complete!");
}

// Export functions for testing
export {
  buildObjectFromKey,
  mergeDeep,
  formatTypescriptObject,
  translateAndUpdateMainFile,
  translateAndUpdateNotifyFile,
};

// Only run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTranslations().catch((error) => {
    // Handle errors from generateTranslations
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    } else {
      console.error("❌ Fatal error:", error);
    }
    process.exit(1);
  });
}
