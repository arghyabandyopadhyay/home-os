import * as Y from "yjs"
import type { OfflineUpdate } from "@/types/collaboration"

const DB_NAME = "home-os-collaboration"
const DB_VERSION = 1
const STORE_DOCUMENTS = "documents"
const STORE_PENDING = "pending-updates"
const MAX_PENDING_UPDATES = 1000

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        console.warn("[OfflineStore] IndexedDB not available")
        resolve(null)
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
          db.createObjectStore(STORE_DOCUMENTS, { keyPath: "noteId" })
        }

        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          const store = db.createObjectStore(STORE_PENDING, { keyPath: "id" })
          store.createIndex("noteId", "noteId", { unique: false })
          store.createIndex("timestamp", "timestamp", { unique: false })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.warn("[OfflineStore] Failed to open IndexedDB:", request.error)
        resolve(null)
      }
    } catch {
      console.warn("[OfflineStore] IndexedDB not available")
      resolve(null)
    }
  })
}

export class OfflineStore {
  private dbPromise: Promise<IDBDatabase | null>

  constructor() {
    this.dbPromise = openDatabase()
  }

  async saveDocumentState(noteId: string, state: Uint8Array): Promise<void> {
    const db = await this.dbPromise
    if (!db) return

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, "readwrite")
      const store = tx.objectStore(STORE_DOCUMENTS)
      store.put({ noteId, state, updatedAt: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async loadDocumentState(noteId: string): Promise<Uint8Array | null> {
    const db = await this.dbPromise
    if (!db) return null

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, "readonly")
      const store = tx.objectStore(STORE_DOCUMENTS)
      const request = store.get(noteId)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.state : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async queueUpdate(noteId: string, update: Uint8Array): Promise<void> {
    const db = await this.dbPromise
    if (!db) return

    const entry: OfflineUpdate = {
      id: crypto.randomUUID(),
      noteId,
      update,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, "readwrite")
      const store = tx.objectStore(STORE_PENDING)
      store.put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getPendingUpdates(noteId: string): Promise<OfflineUpdate[]> {
    const db = await this.dbPromise
    if (!db) return []

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, "readonly")
      const store = tx.objectStore(STORE_PENDING)
      const index = store.index("noteId")
      const request = index.getAll(noteId)
      request.onsuccess = () => {
        const results = request.result as OfflineUpdate[]
        results.sort((a, b) => a.timestamp - b.timestamp)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearPendingUpdates(noteId: string): Promise<void> {
    const db = await this.dbPromise
    if (!db) return

    const updates = await this.getPendingUpdates(noteId)

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, "readwrite")
      const store = tx.objectStore(STORE_PENDING)
      for (const update of updates) {
        store.delete(update.id)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async compactIfNeeded(noteId: string, doc: Y.Doc): Promise<void> {
    const updates = await this.getPendingUpdates(noteId)
    if (updates.length <= MAX_PENDING_UPDATES) return

    // Clear all pending updates and save a full state snapshot instead
    await this.clearPendingUpdates(noteId)
    const stateSnapshot = Y.encodeStateAsUpdate(doc)
    await this.saveDocumentState(noteId, stateSnapshot)
  }

  async deleteNote(noteId: string): Promise<void> {
    const db = await this.dbPromise
    if (!db) return

    // Delete document state
    const tx1 = db.transaction(STORE_DOCUMENTS, "readwrite")
    tx1.objectStore(STORE_DOCUMENTS).delete(noteId)
    await new Promise<void>((resolve) => { tx1.oncomplete = () => resolve() })

    // Delete pending updates
    await this.clearPendingUpdates(noteId)
  }
}
