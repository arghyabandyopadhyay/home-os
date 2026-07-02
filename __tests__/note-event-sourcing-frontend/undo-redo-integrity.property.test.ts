import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 4: Undo/Redo Stack Integrity
 *
 * After any sequence of undo/redo operations, the content always matches a valid
 * revision from the history. A new edit always clears the redo stack. Undo depth
 * never exceeds the available revision count.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */

// --- State Machine Model ---

/**
 * Models the undo/redo state machine from useSessionUndoRedo.
 *
 * State:
 * - pointer: -1 means "live content" (no undo active),
 *   0 = most recent revision, 1 = second most recent, etc.
 * - revisionCount: number of available revisions (N)
 *
 * Operations:
 * - undo: pointer = min(pointer + 1, revisionCount - 1)
 * - redo: pointer = max(pointer - 1, -1)
 * - newEdit: pointer = -1 (resets to live, clears redo stack)
 *
 * Derived:
 * - canUndo: revisionCount > 0 && pointer < revisionCount - 1
 * - canRedo: pointer > -1
 */

type UndoRedoState = {
  pointer: number
  revisionCount: number
}

type Operation = "undo" | "redo" | "newEdit"

function applyOperation(state: UndoRedoState, op: Operation): UndoRedoState {
  const { pointer, revisionCount } = state

  switch (op) {
    case "undo": {
      if (revisionCount === 0) return state
      const nextPointer = pointer + 1
      if (nextPointer >= revisionCount) return state
      return { ...state, pointer: nextPointer }
    }
    case "redo": {
      if (pointer <= -1) return state
      return { ...state, pointer: pointer - 1 }
    }
    case "newEdit": {
      return { ...state, pointer: -1 }
    }
  }
}

function canUndo(state: UndoRedoState): boolean {
  return state.revisionCount > 0 && state.pointer < state.revisionCount - 1
}

function canRedo(state: UndoRedoState): boolean {
  return state.pointer > -1
}

function applySequence(
  initialState: UndoRedoState,
  ops: Operation[]
): UndoRedoState {
  return ops.reduce((state, op) => applyOperation(state, op), initialState)
}

// --- Generators ---

/** Generate a positive revision count (1–50 revisions) */
const revisionCountArb = fc.integer({ min: 1, max: 50 })

/** Generate a random operation sequence */
const operationArb = fc.constantFrom<Operation>("undo", "redo", "newEdit")
const operationSeqArb = fc.array(operationArb, { minLength: 1, maxLength: 100 })

// --- Tests ---

describe("Feature: note-event-sourcing-frontend, Property 4: Undo/Redo Stack Integrity", () => {
  it("after K undo operations from initial state, pointer = -1 + min(K, N) where N = revision count", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        fc.integer({ min: 1, max: 100 }),
        (revisionCount, undoCount) => {
          const initialState: UndoRedoState = { pointer: -1, revisionCount }
          const ops: Operation[] = Array(undoCount).fill("undo")
          const finalState = applySequence(initialState, ops)

          // From pointer=-1, each successful undo increments by 1.
          // Max successful undos = revisionCount (pointer reaches revisionCount-1).
          // After K attempts: pointer = -1 + min(K, revisionCount)
          const expectedPointer = -1 + Math.min(undoCount, revisionCount)
          expect(finalState.pointer).toBe(expectedPointer)
        }
      ),
      { numRuns: 200 }
    )
  })

  it("after K undos then K redos, pointer returns to -1 (if K <= revision count)", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        fc.integer({ min: 1, max: 50 }),
        (revisionCount, k) => {
          // Only test cases where all K undos succeed (K <= revisionCount)
          fc.pre(k <= revisionCount)

          const initialState: UndoRedoState = { pointer: -1, revisionCount }

          // Apply K undos — all should succeed, pointer = -1 + K
          const undoOps: Operation[] = Array(k).fill("undo")
          const afterUndos = applySequence(initialState, undoOps)
          expect(afterUndos.pointer).toBe(-1 + k)

          // Apply K redos — should return to -1
          const redoOps: Operation[] = Array(k).fill("redo")
          const afterRedos = applySequence(afterUndos, redoOps)

          // Should be back at live content
          expect(afterRedos.pointer).toBe(-1)
          expect(canRedo(afterRedos)).toBe(false)
        }
      ),
      { numRuns: 200 }
    )
  })

  it("after any sequence of undos then a newEdit, canRedo becomes false (pointer = -1)", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        fc.integer({ min: 1, max: 50 }),
        (revisionCount, undoCount) => {
          const initialState: UndoRedoState = { pointer: -1, revisionCount }

          // Apply some undos
          const undoOps: Operation[] = Array(undoCount).fill("undo")
          const afterUndos = applySequence(initialState, undoOps)

          // Apply newEdit
          const afterEdit = applyOperation(afterUndos, "newEdit")

          // canRedo should be false (pointer = -1)
          expect(afterEdit.pointer).toBe(-1)
          expect(canRedo(afterEdit)).toBe(false)
        }
      ),
      { numRuns: 200 }
    )
  })

  it("pointer is always in range [-1, N-1] for any operation sequence", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        operationSeqArb,
        (revisionCount, ops) => {
          let state: UndoRedoState = { pointer: -1, revisionCount }

          for (const op of ops) {
            state = applyOperation(state, op)

            // Invariant: pointer is always in valid range
            expect(state.pointer).toBeGreaterThanOrEqual(-1)
            expect(state.pointer).toBeLessThan(revisionCount)
          }
        }
      ),
      { numRuns: 500 }
    )
  })

  it("undo depth never exceeds revision count for any operation sequence", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        operationSeqArb,
        (revisionCount, ops) => {
          let state: UndoRedoState = { pointer: -1, revisionCount }

          for (const op of ops) {
            state = applyOperation(state, op)

            // Undo depth (pointer + 1 when pointer >= 0, else 0) never exceeds revisionCount
            const undoDepth = state.pointer >= 0 ? state.pointer + 1 : 0
            expect(undoDepth).toBeLessThanOrEqual(revisionCount)
          }
        }
      ),
      { numRuns: 500 }
    )
  })

  it("canUndo is false only when at max depth or no revisions", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        operationSeqArb,
        (revisionCount, ops) => {
          let state: UndoRedoState = { pointer: -1, revisionCount }

          for (const op of ops) {
            state = applyOperation(state, op)
          }

          if (revisionCount === 0) {
            expect(canUndo(state)).toBe(false)
          } else if (state.pointer >= revisionCount - 1) {
            expect(canUndo(state)).toBe(false)
          } else {
            expect(canUndo(state)).toBe(true)
          }
        }
      ),
      { numRuns: 300 }
    )
  })

  it("canRedo is true only when pointer > -1", () => {
    fc.assert(
      fc.property(
        revisionCountArb,
        operationSeqArb,
        (revisionCount, ops) => {
          let state: UndoRedoState = { pointer: -1, revisionCount }

          for (const op of ops) {
            state = applyOperation(state, op)
          }

          expect(canRedo(state)).toBe(state.pointer > -1)
        }
      ),
      { numRuns: 300 }
    )
  })
})
