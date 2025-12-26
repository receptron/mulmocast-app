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
  const translationService = new GeminiTranslationService(model);

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
    await translateAndUpdateFile(path.join(i18nDir, "ja.ts"), jaMainKeys, "en", "ja", translationService);
    console.log("  ✅ Updated: ja.ts");
  }

  if (enMainKeys.length > 0) {
    console.log(`\n📝 Processing en.ts (${enMainKeys.length} key(s) to translate from Japanese)...`);
    await translateAndUpdateFile(path.join(i18nDir, "en.ts"), enMainKeys, "ja", "en", translationService);
    console.log("  ✅ Updated: en.ts");
  }

  if (jaNotifyKeys.length > 0) {
    console.log(`\n📝 Processing ja_notify.ts (${jaNotifyKeys.length} key(s) to translate from English)...`);
    await translateAndUpdateFile(path.join(i18nDir, "ja_notify.ts"), jaNotifyKeys, "en", "ja", translationService);
    console.log("  ✅ Updated: ja_notify.ts");
  }

  if (enNotifyKeys.length > 0) {
    console.log(`\n📝 Processing en_notify.ts (${enNotifyKeys.length} key(s) to translate from Japanese)...`);
    await translateAndUpdateFile(path.join(i18nDir, "en_notify.ts"), enNotifyKeys, "ja", "en", translationService);
    console.log("  ✅ Updated: en_notify.ts");
  }

  console.log("\n✨ Translation generation complete!");
}

// Pure functions (unit testable)

/**
 * Validates translation keys for security and format
 * @throws Error if any key is invalid
 */
export function validateKeys(keys: string[]): void {
  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (const key of keys) {
    // Check for dangerous keys
    const segments = key.split(".");
    for (const segment of segments) {
      if (dangerousKeys.includes(segment)) {
        throw new Error(`Dangerous key detected: "${key}" contains forbidden segment "${segment}"`);
      }
      // Check for empty segments (consecutive dots or leading/trailing dots)
      if (segment === "") {
        throw new Error(
          `Invalid key format: "${key}" contains empty segment (consecutive dots or leading/trailing dot)`,
        );
      }
    }
  }
}

/**
 * Builds translation prompt (deterministic for testing)
 */
export function buildTranslationPrompt(
  originalContent: string,
  sourceKeys: Array<{ key: string; sourceValue: string }>,
  sourceLang: string,
  targetLang: string,
): string {
  const keysToTranslate = sourceKeys.map((k) => `  - ${k.key}: "${k.sourceValue}"`).join("\n");

  return `You are a TypeScript code editor and professional translator for a software application UI.

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
}

/**
 * Removes markdown code fences from LLM response
 */
export function cleanLLMResponse(response: string): string {
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```typescript\n/, "").replace(/\n```$/, "");
  cleaned = cleaned.replace(/^```\n/, "").replace(/\n```$/, "");
  return cleaned;
}

// Abstraction layer (mockable)

export interface TranslationService {
  translate(prompt: string): Promise<string>;
}

export class GeminiTranslationService implements TranslationService {
  constructor(private model: GenerativeModel) {}

  async translate(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}

// Retry policy (pure function)

export interface RetryOptions {
  maxRetries: number;
  onRetry?: (attempt: number, delay: number) => void;
  onMaxRetriesExceeded?: (filePath: string) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions, retryCount = 0): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const geminiError = error as GoogleGenerativeAIError;

    // Handle rate limit errors (429)
    if (geminiError.status === 429) {
      if (retryCount < options.maxRetries) {
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

        if (options.onRetry) {
          options.onRetry(retryCount + 1, retryDelay);
        }

        await sleep(retryDelay);
        return withRetry(fn, options, retryCount + 1);
      } else {
        if (options.onMaxRetriesExceeded) {
          options.onMaxRetriesExceeded("");
        }
        throw error;
      }
    }

    throw error;
  }
}

// Helper functions

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateAndUpdateFile(
  filePath: string,
  sourceKeys: Array<{ key: string; sourceValue: string }>,
  sourceLanguage: "en" | "ja",
  targetLanguage: "en" | "ja",
  translationService: TranslationService,
): Promise<void> {
  if (sourceKeys.length === 0) return;

  // Validate keys
  const keys = sourceKeys.map((k) => k.key);
  validateKeys(keys);

  const sourceLang = sourceLanguage === "en" ? "English" : "Japanese";
  const targetLang = targetLanguage === "en" ? "English" : "Japanese";

  // Read the original file
  const originalContent = await fs.readFile(filePath, "utf-8");

  // Build prompt
  const prompt = buildTranslationPrompt(originalContent, sourceKeys, sourceLang, targetLang);

  // Translate with retry
  const rawResponse = await withRetry(() => translationService.translate(prompt), {
    maxRetries: 3,
    onRetry: (attempt, delay) => {
      console.log(`  ⏳ Rate limit reached. Retrying in ${delay / 1000}s... (attempt ${attempt}/3)`);
    },
    onMaxRetriesExceeded: () => {
      console.error(`  ❌ Max retries (3) exceeded for file "${filePath}"`);
      console.error(`  💡 Please wait a moment and run the script again, or check your API quota.`);
    },
  });

  // Clean response
  const updatedContent = cleanLLMResponse(rawResponse);

  // Write back
  await fs.writeFile(filePath, updatedContent, "utf-8");
}

// Export functions for testing
export { translateAndUpdateFile };

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
