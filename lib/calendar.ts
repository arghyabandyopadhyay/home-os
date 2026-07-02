import { createServerApiClient } from "@/lib/api-client/server"
import type { CalendarEvent } from "@/types/calendar"

// ─── Server data access ───────────────────────────────────────────────────────

export async function getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
  try {
    const api = await createServerApiClient()
    return await api.get<CalendarEvent[]>("/calendar/events", { params: { year, month } })
  } catch {
    return []
  }
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  try {
    const api = await createServerApiClient()
    return await api.get<CalendarEvent[]>("/calendar/events/today")
  } catch {
    return []
  }
}

export async function getGoogleCalendarStatus(): Promise<boolean> {
  try {
    const api = await createServerApiClient()
    const result = await api.get<{ connected: boolean }>("/calendar/connection")
    return result.connected
  } catch {
    return false
  }
}
