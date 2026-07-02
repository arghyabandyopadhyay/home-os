import { createServerApiClient } from "@/lib/api-client/server"

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectResponse = {
  url: string
}

type DisconnectResponse = {
  success: boolean
}

type SyncResponse = {
  synced: number
}

// ─── Pure utility functions ──────────────────────────────────────────────────

export function getTodayBounds() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

export function getSyncBounds(monthsAhead: number = 3): { timeMin: string; timeMax: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1 + monthsAhead, 0, 23, 59, 59)

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  }
}

// ─── API-backed functions ────────────────────────────────────────────────────

export async function connectGoogleCalendar(): Promise<ConnectResponse | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<ConnectResponse>("/calendar/connect")
  } catch {
    return null
  }
}

export async function disconnectGoogleCalendar(): Promise<DisconnectResponse | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<DisconnectResponse>("/calendar/disconnect")
  } catch {
    return null
  }
}

export async function syncGoogleCalendar(): Promise<SyncResponse | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<SyncResponse>("/calendar/sync")
  } catch {
    return null
  }
}

export async function hasGoogleCalendarConnection(): Promise<boolean> {
  try {
    const api = await createServerApiClient()
    const result = await api.get<{ connected: boolean }>("/calendar/connection")
    return result.connected
  } catch {
    return false
  }
}
