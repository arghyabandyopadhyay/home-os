import { describe, it, expect, beforeEach } from "vitest"
import { useBulkUploadStore } from "@/hooks/use-bulk-upload-store"

function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(["x"], { type })
  Object.defineProperty(blob, "size", { value: size })
  Object.defineProperty(blob, "name", { value: name })
  return blob as unknown as File
}

describe("useBulkUploadStore", () => {
  beforeEach(() => {
    useBulkUploadStore.getState().reset()
  })

  describe("addFiles - max 10 file constraint", () => {
    it("rejects batch when more than 10 files are provided", () => {
      const files = Array.from({ length: 11 }, (_, i) =>
        createMockFile(`doc${i}.pdf`, 1024, "application/pdf")
      )

      const result = useBulkUploadStore.getState().addFiles(files)

      expect(result.accepted).toBe(false)
      expect(result.error).toBe("Maximum 10 files per upload batch")
      expect(useBulkUploadStore.getState().items).toHaveLength(0)
    })

    it("accepts batch of exactly 10 valid files", () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockFile(`doc${i}.pdf`, 1024, "application/pdf")
      )

      const result = useBulkUploadStore.getState().addFiles(files)

      expect(result.accepted).toBe(true)
      expect(useBulkUploadStore.getState().items).toHaveLength(10)
      expect(
        useBulkUploadStore.getState().items.every((item) => item.status === "queued")
      ).toBe(true)
    })

    it("accepts batch of fewer than 10 valid files", () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        createMockFile(`doc${i}.pdf`, 1024, "application/pdf")
      )

      const result = useBulkUploadStore.getState().addFiles(files)

      expect(result.accepted).toBe(true)
      expect(useBulkUploadStore.getState().items).toHaveLength(3)
    })
  })

  describe("addFiles - invalid files marked failed immediately", () => {
    it("marks file with wrong MIME type as failed", () => {
      const files = [createMockFile("image.png", 1024, "image/png")]

      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].status).toBe("failed")
      expect(items[0].error).toContain("Invalid file type")
    })

    it("marks file exceeding 50MB as failed", () => {
      const oversize = 51 * 1024 * 1024 // 51MB
      const files = [createMockFile("big.pdf", oversize, "application/pdf")]

      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].status).toBe("failed")
      expect(items[0].error).toContain("File too large")
    })

    it("marks file with empty MIME type as failed", () => {
      const files = [createMockFile("unknown.bin", 1024, "")]

      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].status).toBe("failed")
      expect(items[0].error).toContain("Invalid file type")
    })
  })

  describe("addFiles - mixed valid/invalid batch", () => {
    it("valid files get queued and invalid files get failed in same batch", () => {
      const files = [
        createMockFile("valid1.pdf", 1024, "application/pdf"),
        createMockFile("invalid.png", 1024, "image/png"),
        createMockFile("valid2.pdf", 2048, "application/pdf"),
        createMockFile("toobig.pdf", 51 * 1024 * 1024, "application/pdf"),
      ]

      const result = useBulkUploadStore.getState().addFiles(files)

      expect(result.accepted).toBe(true)

      const items = useBulkUploadStore.getState().items
      expect(items).toHaveLength(4)

      const queued = items.filter((i) => i.status === "queued")
      const failed = items.filter((i) => i.status === "failed")

      expect(queued).toHaveLength(2)
      expect(failed).toHaveLength(2)

      // Valid files should have no error
      queued.forEach((item) => {
        expect(item.error).toBeNull()
        expect(item.progress).toBe(0)
      })

      // Invalid files should have error messages
      failed.forEach((item) => {
        expect(item.error).not.toBeNull()
      })
    })
  })

  describe("setMinimized - state transitions", () => {
    it("sets isMinimized to true", () => {
      expect(useBulkUploadStore.getState().isMinimized).toBe(false)

      useBulkUploadStore.getState().setMinimized(true)

      expect(useBulkUploadStore.getState().isMinimized).toBe(true)
    })

    it("sets isMinimized back to false", () => {
      useBulkUploadStore.getState().setMinimized(true)
      useBulkUploadStore.getState().setMinimized(false)

      expect(useBulkUploadStore.getState().isMinimized).toBe(false)
    })
  })

  describe("clearCompleted", () => {
    it("removes items with status complete", () => {
      const files = [
        createMockFile("a.pdf", 1024, "application/pdf"),
        createMockFile("b.pdf", 1024, "application/pdf"),
      ]
      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      // Simulate one completing
      useBulkUploadStore.getState().updateItem(items[0].id, { status: "complete" })

      useBulkUploadStore.getState().clearCompleted()

      const remaining = useBulkUploadStore.getState().items
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(items[1].id)
    })
  })

  describe("reset", () => {
    it("clears all items and resets isMinimized", () => {
      const files = [createMockFile("a.pdf", 1024, "application/pdf")]
      useBulkUploadStore.getState().addFiles(files)
      useBulkUploadStore.getState().setMinimized(true)

      useBulkUploadStore.getState().reset()

      expect(useBulkUploadStore.getState().items).toHaveLength(0)
      expect(useBulkUploadStore.getState().isMinimized).toBe(false)
    })
  })

  describe("removeItem", () => {
    it("removes a specific item by id", () => {
      const files = [
        createMockFile("a.pdf", 1024, "application/pdf"),
        createMockFile("b.pdf", 1024, "application/pdf"),
        createMockFile("c.pdf", 1024, "application/pdf"),
      ]
      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      const targetId = items[1].id

      useBulkUploadStore.getState().removeItem(targetId)

      const remaining = useBulkUploadStore.getState().items
      expect(remaining).toHaveLength(2)
      expect(remaining.find((i) => i.id === targetId)).toBeUndefined()
    })
  })

  describe("updateItem", () => {
    it("updates specific item properties", () => {
      const files = [createMockFile("a.pdf", 1024, "application/pdf")]
      useBulkUploadStore.getState().addFiles(files)

      const itemId = useBulkUploadStore.getState().items[0].id

      useBulkUploadStore.getState().updateItem(itemId, {
        status: "uploading",
        progress: 50,
      })

      const updated = useBulkUploadStore.getState().items[0]
      expect(updated.status).toBe("uploading")
      expect(updated.progress).toBe(50)
      expect(updated.error).toBeNull()
    })

    it("does not affect other items", () => {
      const files = [
        createMockFile("a.pdf", 1024, "application/pdf"),
        createMockFile("b.pdf", 1024, "application/pdf"),
      ]
      useBulkUploadStore.getState().addFiles(files)

      const items = useBulkUploadStore.getState().items
      useBulkUploadStore.getState().updateItem(items[0].id, { status: "uploading" })

      const afterUpdate = useBulkUploadStore.getState().items
      expect(afterUpdate[1].status).toBe("queued")
    })
  })
})
