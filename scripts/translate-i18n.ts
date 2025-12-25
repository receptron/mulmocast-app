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

interface TranslationTask {
  key: string;
  sourceValue: string;
  sourceLanguage: "en" | "ja";
  targetLanguage: "en" | "ja";
  fileType: "main" | "notify";
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

async function translateText(task: TranslationTask, model: GenerativeModel, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const sourceLang = task.sourceLanguage === "en" ? "English" : "Japanese";
  const targetLang = task.targetLanguage === "en" ? "English" : "Japanese";

  const prompt = `You are a professional translator for a software application UI.

Translate the following ${sourceLang} text to ${targetLang}:

"${task.sourceValue}"

Context: This is a UI translation key "${task.key}" in an Electron+Vue.js application called MulmoCast, which is a multimedia presentation creation tool.

Requirements:
- Provide ONLY the translated text, no explanations
- Keep the translation concise and natural for UI text
- Maintain any special formatting like line breaks
- If there are technical terms, keep them appropriate for the software domain
- For Japanese: Use appropriate formality level for application UI (です/ます form)`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const translation = response.text().trim();

    // Remove quotes if the model added them
    return translation.replace(/(?:^["'])|(?:["']$)/g, "");
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
        return translateText(task, model, retryCount + 1);
      } else {
        console.error(`  ❌ Max retries (${maxRetries}) exceeded for key "${task.key}"`);
        console.error(`  💡 Please wait a moment and run the script again, or check your API quota.`);
        throw error;
      }
    }

    // Handle other errors
    console.error(`  ⚠️  Translation failed for key "${task.key}":`, geminiError.message);
    throw error;
  }
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

async function generateTranslations() {
  console.log("🌍 Starting i18n translation generation...\n");

  // Initialize Gemini API client (only when actually running translations)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please set it with: export GEMINI_API_KEY=your_api_key");
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

  // Prepare translation tasks
  const tasks: TranslationTask[] = [];

  for (const missing of missingKeysMain) {
    if (missing.enValue && !missing.jaValue) {
      tasks.push({
        key: missing.key,
        sourceValue: missing.enValue,
        sourceLanguage: "en",
        targetLanguage: "ja",
        fileType: "main",
      });
    } else if (missing.jaValue && !missing.enValue) {
      tasks.push({
        key: missing.key,
        sourceValue: missing.jaValue,
        sourceLanguage: "ja",
        targetLanguage: "en",
        fileType: "main",
      });
    }
  }

  for (const missing of missingKeysNotify) {
    if (missing.enValue && !missing.jaValue) {
      tasks.push({
        key: missing.key,
        sourceValue: missing.enValue,
        sourceLanguage: "en",
        targetLanguage: "ja",
        fileType: "notify",
      });
    } else if (missing.jaValue && !missing.enValue) {
      tasks.push({
        key: missing.key,
        sourceValue: missing.jaValue,
        sourceLanguage: "ja",
        targetLanguage: "en",
        fileType: "notify",
      });
    }
  }

  // Group tasks by file type and target language
  const jaMainTasks = tasks.filter((t) => t.targetLanguage === "ja" && t.fileType === "main");
  const enMainTasks = tasks.filter((t) => t.targetLanguage === "en" && t.fileType === "main");
  const jaNotifyTasks = tasks.filter((t) => t.targetLanguage === "ja" && t.fileType === "notify");
  const enNotifyTasks = tasks.filter((t) => t.targetLanguage === "en" && t.fileType === "notify");

  // Translate and build objects
  const translations: Record<string, Record<string, unknown>> = {
    ja: { ...ja },
    en: { ...en },
    ja_notify: { ...ja_notify },
    en_notify: { ...en_notify },
  };

  const processTaskGroup = async (taskGroup: TranslationTask[], targetKey: string, label: string) => {
    if (taskGroup.length === 0) return;

    console.log(`\n📝 Translating ${taskGroup.length} key(s) for ${label}...`);

    for (let i = 0; i < taskGroup.length; i++) {
      const task = taskGroup[i];
      console.log(`  [${i + 1}/${taskGroup.length}] Translating: ${task.key}`);
      console.log(`    Source (${task.sourceLanguage}): ${task.sourceValue}`);

      const translated = await translateText(task, model);
      console.log(`    Target (${task.targetLanguage}): ${translated}`);

      const newObj = buildObjectFromKey(task.key, translated);
      translations[targetKey] = mergeDeep(translations[targetKey], newObj);

      // Add delay between requests to avoid rate limiting (except for the last item)
      if (i < taskGroup.length - 1) {
        const delay = 1000; // 1 second delay between translations
        console.log(`    ⏸️  Waiting ${delay / 1000}s before next translation...`);
        await sleep(delay);
      }
    }
  };

  await processTaskGroup(jaMainTasks, "ja", "ja.ts");
  await processTaskGroup(enMainTasks, "en", "en.ts");
  await processTaskGroup(jaNotifyTasks, "ja_notify", "ja_notify.ts");
  await processTaskGroup(enNotifyTasks, "en_notify", "en_notify.ts");

  // Write updated files
  console.log("\n💾 Writing updated translation files...");

  const i18nDir = path.join(process.cwd(), "src/renderer/i18n");

  if (jaMainTasks.length > 0) {
    const jaContent = `export default ${formatTypescriptObject(translations.ja)} as const;\n`;
    await fs.writeFile(path.join(i18nDir, "ja.ts"), jaContent, "utf-8");
    console.log("  ✅ Updated: ja.ts");
  }

  if (enMainTasks.length > 0) {
    const enContent = `export default ${formatTypescriptObject(translations.en)} as const;\n`;
    await fs.writeFile(path.join(i18nDir, "en.ts"), enContent, "utf-8");
    console.log("  ✅ Updated: en.ts");
  }

  if (jaNotifyTasks.length > 0) {
    const jaNotifyContent = `export const ja_notify = ${formatTypescriptObject(translations.ja_notify)} as const;\n`;
    await fs.writeFile(path.join(i18nDir, "ja_notify.ts"), jaNotifyContent, "utf-8");
    console.log("  ✅ Updated: ja_notify.ts");
  }

  if (enNotifyTasks.length > 0) {
    const enNotifyContent = `export const en_notify = ${formatTypescriptObject(translations.en_notify)} as const;\n`;
    await fs.writeFile(path.join(i18nDir, "en_notify.ts"), enNotifyContent, "utf-8");
    console.log("  ✅ Updated: en_notify.ts");
  }

  console.log("\n✨ Translation generation complete!");
}

// Export functions for testing
export { buildObjectFromKey, mergeDeep, formatTypescriptObject };

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
