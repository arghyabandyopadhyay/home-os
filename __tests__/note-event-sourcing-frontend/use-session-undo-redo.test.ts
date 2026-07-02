import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// Mock the useRevisions hook directly to avoid TanStack Query + fake timer conflicts
vi.mock("@/hooks/queries/use-revisions", () => ({
  useRevisions: vi.fn(),
  revisionKeys: {
    all: (noteId: string) => ["revisions", noteId],
    detail: (noteId: string, revisionId: string) => ["revisions", noteId, revisionId],
  },
}))

// Mock the revisions API
vi.mock("@/lib/revisions/api", () => ({
  getRevisions: vi.fn(),
  getRevision: vi.fn(),
  createRevision: vi.fn(),
  restoreRevision: vi.fn(),
}))

import { useRevisions } from "@/hooks/queries/use-revisions"
import { getRevision } from "@/lib/revisions/api"
import { useSessionUndoRedo } from "@/hooks/use-session-undo-redo"
import type { Revision } from "@/types/revision"

const mockedUseRevisions = vi.mocked(useRevisions)
const mockedGetRevision = vi.mocked(getRevision)

function makeRevision(id: string, createdAt: string, content: string): Revision {
  return {
    id,
    noteId: "note-1",
    content,
    contentHash: `hash-${id}`,
    label: "auto-saved",
    authorId: "user-1",
    authorName: "Test User",
    authorAvatarUrl: null,
    createdAt,
  }
}

const revisions = [
  makeRevision("rev-3", "2024-01-15T14:30:00Z", "content v3"),
  makeRevision("rev-2", "2024-01-15T14:00:00Z", "content v2"),
  makeRevision("rev-1", "2024-01-15T13:30:00Z", "content v1"),
]

describe("useSessionUndoRedo", () => {
  beforeEach(() => {
    vi.useFakeTimers()

    // Mock useRevisions to return paginated data directly
    mockedUseRevisions.mockReturnValue({
      data: {
        pages: [{ revisions, total: 3, page: 1, pageSize: 20, hasMore: false }],
        pageParams: [1],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRevisions>)

    mockedGetRevision.mockImplementation(async (_noteId, revisionId) => {
      const rev = revisions.find((r) => r.id === revisionId)
      if (!rev) throw new Error("Not found")
      return rev
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("starts with canUndo true and canRedo false when revisions exist", () => {
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore: vi.fn(),
        enabled: true,
      })
    )

    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.transientLabel).toBeNull()
  })

  it("returns all disabled when enabled is false", () => {
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore: vi.fn(),
        enabled: false,
      })
    )

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it("returns canUndo false when no revisions are available", () => {
    mockedUseRevisions.mockReturnValue({
      data: {
        pages: [{ revisions: [], total: 0, page: 1, pageSize: 20, hasMore: false }],
        pageParams: [1],
      },
    } as unknown as ReturnType<typeof useRevisions>)

    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore: vi.fn(),
        enabled: true,
      })
    )

    expect(result.current.canUndo).toBe(false)
  })

  it("undo fetches previous revision and calls onContentRestore", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.undo()
    })

    expect(mockedGetRevision).toHaveBeenCalledWith("note-1", "rev-3")
    expect(onContentRestore).toHaveBeenCalledWith("content v3", "2024-01-15T14:30:00Z")
    expect(result.current.canRedo).toBe(true)
  })

  it("redo moves forward in revision history", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    // Undo twice
    await act(async () => {
      await result.current.undo()
    })
    await act(async () => {
      await result.current.undo()
    })

    expect(onContentRestore).toHaveBeenLastCalledWith("content v2", "2024-01-15T14:00:00Z")

    // Redo once — moves forward to rev-3
    await act(async () => {
      await result.current.redo()
    })

    expect(mockedGetRevision).toHaveBeenLastCalledWith("note-1", "rev-3")
    expect(onContentRestore).toHaveBeenLastCalledWith("content v3", "2024-01-15T14:30:00Z")
  })

  it("redo back to live content restores currentContent", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    // Undo once
    await act(async () => {
      await result.current.undo()
    })

    // Redo back to live
    await act(async () => {
      await result.current.redo()
    })

    expect(onContentRestore).toHaveBeenLastCalledWith("current content", expect.any(String))
    expect(result.current.canRedo).toBe(false)
  })

  it("onNewEdit resets pointer and discards redo stack", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    // Undo to create redo possibility
    await act(async () => {
      await result.current.undo()
    })

    expect(result.current.canRedo).toBe(true)

    // New edit should discard redo stack
    act(() => {
      result.current.onNewEdit()
    })

    expect(result.current.canRedo).toBe(false)
    expect(result.current.canUndo).toBe(true) // Still has revisions to undo to
  })

  it("shows transient label after undo and clears it after 2s", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.undo()
    })

    expect(result.current.transientLabel).toMatch(/^Reverted to/)

    // After 2 seconds, label should clear
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.transientLabel).toBeNull()
  })

  it("shows 'Back to current' label when redo returns to live content", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.undo()
    })

    await act(async () => {
      await result.current.redo()
    })

    expect(result.current.transientLabel).toBe("Back to current")

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.transientLabel).toBeNull()
  })

  it("does not create new revisions on undo/redo", async () => {
    const { createRevision } = await import("@/lib/revisions/api")
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.undo()
    })
    await act(async () => {
      await result.current.redo()
    })

    expect(createRevision).not.toHaveBeenCalled()
  })

  it("cannot undo past the last available revision", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    // Undo 3 times (all available revisions)
    await act(async () => {
      await result.current.undo()
    })
    await act(async () => {
      await result.current.undo()
    })
    await act(async () => {
      await result.current.undo()
    })

    expect(result.current.canUndo).toBe(false)

    // Another undo should be a no-op
    onContentRestore.mockClear()
    await act(async () => {
      await result.current.undo()
    })

    expect(onContentRestore).not.toHaveBeenCalled()
  })

  it("cannot redo when at live content (no undo has been done)", async () => {
    const onContentRestore = vi.fn()
    const { result } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.redo()
    })

    expect(onContentRestore).not.toHaveBeenCalled()
  })

  it("cleans up transient label timeout on unmount", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
    const onContentRestore = vi.fn()
    const { result, unmount } = renderHook(() =>
      useSessionUndoRedo({
        noteId: "note-1",
        currentContent: "current content",
        onContentRestore,
        enabled: true,
      })
    )

    await act(async () => {
      await result.current.undo()
    })

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
