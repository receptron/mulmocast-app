import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString();
};

export const removeEmptyValues = <T>(obj: T): T | undefined => {
  if (obj === null || obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    const filtered = obj.map((item) => removeEmptyValues(item)).filter((item) => item !== undefined);
    return filtered.length > 0 ? (filtered as T) : undefined;
  }

  if (typeof obj === "object" && obj !== null) {
    const cleaned = Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, removeEmptyValues(value)])
        .filter(([, value]) => value !== undefined),
    );
    return Object.keys(cleaned).length > 0 ? (cleaned as T) : undefined;
  }

  if (obj === "" || obj === "undefined") return undefined;

  return obj;
};

export const mediaUri = (file: ArrayBuffer | string | null): string => {
  if (!file) {
    return "";
  }
  if (typeof file === "string") {
    return file;
  }
  return URL.createObjectURL(new Blob([file]));
};

export const bufferToUrl = (buffer: Uint8Array<ArrayBuffer>, mimeType?: string) => {
  const blob = new Blob([buffer], { type: mimeType ?? guessMimeType(buffer) });
  const url = URL.createObjectURL(blob);
  return url;
};

export function guessMimeType(buffer: Uint8Array): string | undefined {
  if (buffer.length < 4) return;

  const head = new Uint8Array(buffer.slice(0, 4));
  const hex = [...head].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("494433")) return "audio/mpeg"; // ID3
  if (hex.startsWith("52494646")) return "audio/wav"; // RIFF (WAV/AVI/etc.)

  return undefined;
}
