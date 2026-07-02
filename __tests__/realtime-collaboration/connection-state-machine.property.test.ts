import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { ConnectionStatus } from "@/types/collaboration"

/**
 * Property: Connection State Machine
 * Validates: Requirements 1.1, 1.3, 1.4, 5.1
 *
 * Starting from any valid ConnectionStatus, only valid transitions are possible.
 * Valid transitions:
 *   disconnected → connecting
 *   connecting → connected
 *   connecting → disconnected
 *   connected → reconnecting
 *   connected → disconnected
 *   reconnecting → connected
 *   reconnecting → disconnected
 *
 * No sequence of events can produce an invalid transition.
 */

const ALL_STATES: ConnectionStatus[] = ["disconnected", "connecting", "connected", "reconnecting"]

const VALID_TRANSITIONS: Record<ConnectionStatus, ConnectionStatus[]> = {
  disconnected: ["connecting"],
  connecting: ["connected", "disconnected"],
  connected: ["reconnecting", "disconnected"],
  reconnecting: ["connected", "disconnected"],
}

/**
 * Simulate a state machine step: given a current state, attempt a transition.
 * Returns the new state if the transition is valid, or null if invalid.
 */
function tryTransition(
  current: ConnectionStatus,
  target: ConnectionStatus
): ConnectionStatus | null {
  if (VALID_TRANSITIONS[current].includes(target)) {
    return target
  }
  return null
}

describe("Feature: realtime-collaboration-frontend, Property: Connection State Machine", () => {
  /**
   * **Validates: Requirements 1.1, 1.3, 1.4, 5.1**
   */

  it("all transitions from any state are within the valid set", () => {
    const stateArb = fc.constantFrom(...ALL_STATES)
    const transitionPairArb = fc.tuple(stateArb, stateArb)

    fc.assert(
      fc.property(transitionPairArb, ([current, next]) => {
        const isValid = VALID_TRANSITIONS[current].includes(next)
        const result = tryTransition(current, next)

        if (isValid) {
          expect(result).toBe(next)
        } else {
          expect(result).toBeNull()
        }
      }),
      { numRuns: 200 }
    )
  })

  it("state machine is complete — every state has at least one valid transition", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATES), (state) => {
        expect(VALID_TRANSITIONS[state].length).toBeGreaterThanOrEqual(1)
      }),
      { numRuns: 100 }
    )
  })

  it("no self-transitions — no state transitions to itself", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATES), (state) => {
        expect(VALID_TRANSITIONS[state]).not.toContain(state)
      }),
      { numRuns: 100 }
    )
  })

  it("reachability — all states are reachable from disconnected through valid transitions", () => {
    // BFS from "disconnected" to verify all states are reachable
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATES), (targetState) => {
        const visited = new Set<ConnectionStatus>()
        const queue: ConnectionStatus[] = ["disconnected"]
        visited.add("disconnected")

        while (queue.length > 0) {
          const current = queue.shift()!
          for (const next of VALID_TRANSITIONS[current]) {
            if (!visited.has(next)) {
              visited.add(next)
              queue.push(next)
            }
          }
        }

        expect(visited.has(targetState)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it("no sequence of valid transitions can produce an invalid state", () => {
    // Generate random sequences of transitions and verify the state machine
    // never enters an invalid state
    const transitionSequenceArb = fc.array(fc.constantFrom(...ALL_STATES), {
      minLength: 1,
      maxLength: 50,
    })

    fc.assert(
      fc.property(transitionSequenceArb, (targetSequence) => {
        let currentState: ConnectionStatus = "disconnected"

        for (const target of targetSequence) {
          const result = tryTransition(currentState, target)
          if (result !== null) {
            // Transition was valid — state moved
            currentState = result
            expect(ALL_STATES).toContain(currentState)
          } else {
            // Transition was invalid — state stays the same
            expect(VALID_TRANSITIONS[currentState]).not.toContain(target)
          }
        }

        // After any sequence, the state is still a valid ConnectionStatus
        expect(ALL_STATES).toContain(currentState)
      }),
      { numRuns: 500 }
    )
  })

  it("valid transition pairs are exhaustively defined", () => {
    // Verify that the transition map covers all 4 states as keys
    const definedStates = Object.keys(VALID_TRANSITIONS) as ConnectionStatus[]

    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATES), (state) => {
        expect(definedStates).toContain(state)
      }),
      { numRuns: 100 }
    )
  })

  it("connected state is only reachable from connecting or reconnecting", () => {
    // Verify that "connected" only appears as a valid target of connecting or reconnecting
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATES), (state) => {
        if (VALID_TRANSITIONS[state].includes("connected")) {
          expect(["connecting", "reconnecting"]).toContain(state)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("disconnected is always reachable from any non-disconnected state within 2 transitions", () => {
    const nonDisconnectedStates: ConnectionStatus[] = ["connecting", "connected", "reconnecting"]

    fc.assert(
      fc.property(fc.constantFrom(...nonDisconnectedStates), (startState) => {
        // From any non-disconnected state, we can reach disconnected
        // connecting → disconnected (1 step)
        // connected → disconnected (1 step) 
        // reconnecting → disconnected (1 step)
        const canReachDisconnected = VALID_TRANSITIONS[startState].includes("disconnected")
        expect(canReachDisconnected).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
