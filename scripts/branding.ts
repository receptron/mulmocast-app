import fs from "node:fs";
import path from "node:path";

export type Branding = {
  appName: string;
  executableName?: string;
};

export type BrandingResolution = {
  requestedBrandId: string;
  brandId: string;
  branding: Branding;
  sourcePath: string;
};

const DEFAULT_BRAND_ID = "default";
const BRAND_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const BRANDING_DIR = path.resolve(__dirname, "../branding");
const defaultBrandingPath = path.join(BRANDING_DIR, `${DEFAULT_BRAND_ID}.json`);

const isBranding = (value: unknown): value is Branding => {
  return typeof value === "object" && value !== null && typeof (value as Branding).appName === "string";
};

const readBrandingFile = (filePath: string): Branding => {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  if (!isBranding(parsed)) {
    throw new Error(`Invalid branding file: ${filePath}`);
  }
  return parsed;
};

export const loadBranding = (requestedBrandId = process.env.BRAND?.trim() || DEFAULT_BRAND_ID): BrandingResolution => {
  if (!BRAND_ID_PATTERN.test(requestedBrandId)) {
    throw new Error(
      `[branding] Invalid BRAND value "${requestedBrandId}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
    );
  }

  const defaultBranding = readBrandingFile(defaultBrandingPath);
  const candidatePath = path.join(BRANDING_DIR, `${requestedBrandId}.json`);

  if (requestedBrandId !== DEFAULT_BRAND_ID && !fs.existsSync(candidatePath)) {
    console.warn(`[branding] branding/${requestedBrandId}.json not found, falling back to default branding`);
    return {
      requestedBrandId,
      brandId: DEFAULT_BRAND_ID,
      branding: defaultBranding,
      sourcePath: defaultBrandingPath,
    };
  }

  const sourcePath = requestedBrandId === DEFAULT_BRAND_ID ? defaultBrandingPath : candidatePath;
  return {
    requestedBrandId,
    brandId: requestedBrandId,
    branding: readBrandingFile(sourcePath),
    sourcePath,
  };
};

/** Filesystem-safe executable name: uses explicit executableName or derives from appName */
export const getExecutableName = (branding: Branding): string => {
  if (branding.executableName) return branding.executableName;
  // Remove non-ASCII and special characters, collapse spaces to hyphens
  return branding.appName
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export const createBrandDefines = (branding = loadBranding()) => {
  return {
    __APP_BRAND__: JSON.stringify(branding.branding),
    __APP_BRAND_ID__: JSON.stringify(branding.brandId),
  };
};
