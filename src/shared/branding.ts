export type Branding = {
  appName: string;
};

// Vite injects __APP_BRAND__ at build time via `define`.
// When running outside Vite (e.g. `npx tsx test/test_*.ts`), fall back to defaults.
export const BRAND: Branding = typeof __APP_BRAND__ !== "undefined" ? __APP_BRAND__ : { appName: "MulmoCast" };
export const BRAND_ID: string = typeof __APP_BRAND_ID__ !== "undefined" ? __APP_BRAND_ID__ : "default";
