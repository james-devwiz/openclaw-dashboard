import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();

  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    const hrs = Math.floor(absDiff / 3600000);
    const days = Math.floor(absDiff / 86400000);
    if (mins < 1) return "now";
    if (mins < 60) return `in ${mins}m`;
    if (hrs < 24) return `in ${hrs}h`;
    if (days < 7) return `in ${days}d`;
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Australia/Brisbane",
  });
}

export type StalenessLevel = "fresh" | "aging" | "stale"

export function getStaleness(lastModified: Date | string): { level: StalenessLevel; days: number } {
  const d = typeof lastModified === "string" ? new Date(lastModified) : lastModified;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days >= 60) return { level: "stale", days };
  if (days >= 30) return { level: "aging", days };
  return { level: "fresh", days };
}
