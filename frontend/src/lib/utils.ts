/**
 * lib/utils.ts
 * ------------
 * Shared utility functions used across components.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — required by every shadcn/ui component. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string into a readable format, e.g. "Jun 30, 2026". */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a date with time, e.g. "Jun 30, 2026, 3:45 PM". */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format bytes into a human-readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/** Get initials from a name for avatar fallbacks, e.g. "John Doe" → "JD". */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Map priority to a Tailwind color class. */
export function priorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-400";
    case "medium":
      return "text-amber-500 bg-amber-50 dark:bg-amber-950 dark:text-amber-400";
    case "low":
      return "text-green-500 bg-green-50 dark:bg-green-950 dark:text-green-400";
    default:
      return "text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400";
  }
}

/** Format seconds into MM:SS for the quiz timer. */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
