import type { MorningBrief } from "@/types/index"

export const FALLBACK_BRIEF: MorningBrief = {
  date: new Date().toISOString(),
  calendar: [],
  priorities: ["Gateway not connected — check SSH tunnel"],
  overnightWork: [],
  unreadCount: 0,
  deadlines: [],
}

export const PLACEHOLDER_BRIEF: MorningBrief = {
  date: new Date().toISOString(),
  weather: "Configure Google Workspace (gog skill) for weather data",
  calendar: [],
  priorities: [
    "Set up Telegram bot",
    "Configure heartbeat",
    "Deploy workspace files",
  ],
  overnightWork: [],
  unreadCount: 0,
  deadlines: [],
}
