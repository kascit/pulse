import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTagList(value?: string) {
  return value?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? []
}

export function safeJSONParse<T = unknown>(value: string | undefined | null): T | null {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}
