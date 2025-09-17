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

export const bufferToUrl = (buffer: Uint8Array<ArrayBuffer>, mimeType: string) => {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return url;
};

export const availableNewVersion = async () => {
  try {
    // TODO: change release branch
    const res = await fetch("https://raw.githubusercontent.com/receptron/mulmocast-app/refs/heads/main/package.json");

    const currentVersion = await window.electronAPI.getVersion();
    const onlineVersion = (await res.json()).version;

    // console.log({ currentVersion, onlineVersion });
    if (currentVersion !== onlineVersion) {
      return onlineVersion;
    }
    return null;
  } catch (__e) {
    return null;
  }
};
