import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanCardId(rawId: string) {
  const safeDecoded = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  return safeDecoded.replace(/["']/g, "").replace(/\s+/g, "").trim();
}
