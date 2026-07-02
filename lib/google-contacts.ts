import { createServerApiClient } from "@/lib/api-client/server"

// Re-export pure utility functions from the utils file
export { mapGoogleContact } from "@/lib/google-contacts-utils"
export type { GooglePerson } from "@/lib/google-contacts-utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectResponse = {
  url: string
}

type SyncResponse = {
  imported: number
  updated: number
}

// ─── API-backed functions ────────────────────────────────────────────────────

export async function connectGoogleContacts(): Promise<ConnectResponse | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<ConnectResponse>("/contacts/google/connect")
  } catch {
    return null
  }
}

export async function syncGoogleContacts(): Promise<SyncResponse | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<SyncResponse>("/contacts/google/sync")
  } catch {
    return null
  }
}
