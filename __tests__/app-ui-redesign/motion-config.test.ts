import { describe, it, expect } from "vitest"
import {
  DURATION,
  EASING,
  MOTION_CONSTRAINTS,
  transitionEntrance,
  transitionEntranceFast,
  transitionEntranceSlow,
  transitionExit,
  transitionHover,
  fadeReveal,
  fadeOnly,
  staggerItem,
  hoverCard,
  hoverButton,
  overlayVariants,
  modalContentVariants,
  pageTransition,
  reducedMotionVariants,
} from "@/lib/motion"

/**
 * Unit tests for the motion system configuration.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.6, 17.2
 */

describe("lib/motion - Motion system configuration", () => {
  describe("Duration constants", () => {
    it("fast duration is 150ms (0.15s)", () => {
      expect(DURATION.fast).toBe(0.15)
    })

    it("normal duration is 200ms (0.2s)", () => {
      expect(DURATION.normal).toBe(0.2)
    })

    it("slow duration is 300ms (0.3s)", () => {
      expect(DURATION.slow).toBe(0.3)
    })

    it("all durations are within 150-300ms bounds", () => {
      const durationMs = Object.values(DURATION).map((d) => d * 1000)
      for (const ms of durationMs) {
        expect(ms).toBeGreaterThanOrEqual(150)
        expect(ms).toBeLessThanOrEqual(300)
      }
    })
  })

  describe("Easing constants", () => {
    it("entrance easing is ease-out cubic-bezier", () => {
      // ease-out: starts fast, ends slow
      expect(EASING.entrance).toEqual([0, 0, 0.2, 1])
    })

    it("exit easing is ease-in cubic-bezier", () => {
      // ease-in: starts slow, ends fast
      expect(EASING.exit).toEqual([0.4, 0, 1, 1])
    })

    it("easing arrays do not contain spring or bounce keywords", () => {
      const easingStr = JSON.stringify(EASING)
      expect(easingStr.toLowerCase()).not.toContain("spring")
      expect(easingStr.toLowerCase()).not.toContain("bounce")
    })
  })

  describe("Transition presets", () => {
    it("entrance transition uses ease-out easing", () => {
      expect(transitionEntrance.ease).toEqual(EASING.entrance)
    })

    it("entrance fast transition is 150ms", () => {
      expect(transitionEntranceFast.duration).toBe(DURATION.fast)
    })

    it("entrance slow transition is 300ms", () => {
      expect(transitionEntranceSlow.duration).toBe(DURATION.slow)
    })

    it("exit transition uses ease-in easing", () => {
      expect(transitionExit.ease).toEqual(EASING.exit)
    })

    it("hover transition is 150ms with ease-out", () => {
      expect(transitionHover.duration).toBe(DURATION.fast)
      expect(transitionHover.ease).toEqual(EASING.entrance)
    })
  })

  describe("Fade reveal variants", () => {
    it("hidden state has opacity 0", () => {
      expect(fadeReveal.hidden).toHaveProperty("opacity", 0)
    })

    it("visible state has opacity 1", () => {
      const visible = fadeReveal.visible as { opacity: number }
      expect(visible.opacity).toBe(1)
    })

    it("y displacement does not exceed 30px", () => {
      const hidden = fadeReveal.hidden as { y: number }
      expect(Math.abs(hidden.y)).toBeLessThanOrEqual(30)
    })

    it("visible state has y = 0", () => {
      const visible = fadeReveal.visible as { y: number }
      expect(visible.y).toBe(0)
    })

    it("transition duration is within 150-300ms", () => {
      const visible = fadeReveal.visible as {
        transition: { duration: number }
      }
      const ms = visible.transition.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(150)
      expect(ms).toBeLessThanOrEqual(300)
    })
  })

  describe("Fade-only variants", () => {
    it("hidden state has opacity 0 and no y transform", () => {
      expect(fadeOnly.hidden).toEqual({ opacity: 0 })
    })

    it("visible state has opacity 1", () => {
      const visible = fadeOnly.visible as { opacity: number }
      expect(visible.opacity).toBe(1)
    })
  })

  describe("Stagger item variants", () => {
    it("item y displacement does not exceed 30px", () => {
      const hidden = staggerItem.hidden as { y: number }
      expect(Math.abs(hidden.y)).toBeLessThanOrEqual(30)
    })

    it("item visible state has opacity 1 and y 0", () => {
      const visible = staggerItem.visible as { opacity: number; y: number }
      expect(visible.opacity).toBe(1)
      expect(visible.y).toBe(0)
    })
  })

  describe("Hover animations", () => {
    it("card hover scale is within 1.02-1.05 range", () => {
      const scale = hoverCard.whileHover.scale
      expect(scale).toBeGreaterThanOrEqual(1.02)
      expect(scale).toBeLessThanOrEqual(1.05)
    })

    it("card hover opacity shift is ≤ 0.1", () => {
      const initialOpacity = hoverCard.initial.opacity as number
      const hoverOpacity = hoverCard.whileHover.opacity as number
      const shift = Math.abs(hoverOpacity - initialOpacity)
      expect(shift).toBeLessThanOrEqual(0.1)
    })

    it("button hover scale is within 1.02-1.05 range", () => {
      const scale = hoverButton.whileHover.scale
      expect(scale).toBeGreaterThanOrEqual(1.02)
      expect(scale).toBeLessThanOrEqual(1.05)
    })

    it("hover transition duration is within 150-200ms", () => {
      const ms = (transitionHover.duration as number) * 1000
      expect(ms).toBeGreaterThanOrEqual(150)
      expect(ms).toBeLessThanOrEqual(200)
    })
  })

  describe("Overlay variants", () => {
    it("hidden state has opacity 0", () => {
      expect(overlayVariants.hidden).toHaveProperty("opacity", 0)
    })

    it("visible state has opacity 1", () => {
      const visible = overlayVariants.visible as { opacity: number }
      expect(visible.opacity).toBe(1)
    })

    it("entrance duration is within 100-200ms", () => {
      const visible = overlayVariants.visible as {
        transition: { duration: number }
      }
      const ms = visible.transition.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(100)
      expect(ms).toBeLessThanOrEqual(200)
    })

    it("exit duration is within 100-200ms", () => {
      const exit = overlayVariants.exit as {
        transition: { duration: number }
      }
      const ms = exit.transition.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(100)
      expect(ms).toBeLessThanOrEqual(200)
    })
  })

  describe("Modal content variants", () => {
    it("hidden state has opacity 0 and scale < 1", () => {
      const hidden = modalContentVariants.hidden as {
        opacity: number
        scale: number
      }
      expect(hidden.opacity).toBe(0)
      expect(hidden.scale).toBeLessThan(1)
      expect(hidden.scale).toBeGreaterThanOrEqual(0.95)
    })

    it("visible state has opacity 1 and scale 1", () => {
      const visible = modalContentVariants.visible as {
        opacity: number
        scale: number
      }
      expect(visible.opacity).toBe(1)
      expect(visible.scale).toBe(1)
    })

    it("entrance uses ease-out easing", () => {
      const visible = modalContentVariants.visible as {
        transition: { ease: readonly number[] }
      }
      expect(visible.transition.ease).toEqual(EASING.entrance)
    })

    it("exit uses ease-in easing", () => {
      const exit = modalContentVariants.exit as {
        transition: { ease: readonly number[] }
      }
      expect(exit.transition.ease).toEqual(EASING.exit)
    })
  })

  describe("Page transition variants", () => {
    it("initial state has opacity 0", () => {
      expect(pageTransition.initial).toHaveProperty("opacity", 0)
    })

    it("animate state has opacity 1", () => {
      const animate = pageTransition.animate as { opacity: number }
      expect(animate.opacity).toBe(1)
    })

    it("animate duration is within 150-300ms", () => {
      const animate = pageTransition.animate as {
        transition: { duration: number }
      }
      const ms = animate.transition.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(150)
      expect(ms).toBeLessThanOrEqual(300)
    })

    it("exit uses ease-in easing", () => {
      const exit = pageTransition.exit as {
        transition: { ease: readonly number[] }
      }
      expect(exit.transition.ease).toEqual(EASING.exit)
    })
  })

  describe("Reduced motion variants", () => {
    it("all states show elements in final visible state", () => {
      expect(reducedMotionVariants.hidden).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
      expect(reducedMotionVariants.visible).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
      expect(reducedMotionVariants.exit).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
    })
  })

  describe("Motion constraints export", () => {
    it("fade reveal duration bounds are 150-300ms", () => {
      expect(MOTION_CONSTRAINTS.duration.fadeReveal.min).toBe(150)
      expect(MOTION_CONSTRAINTS.duration.fadeReveal.max).toBe(300)
    })

    it("hover duration bounds are 150-200ms", () => {
      expect(MOTION_CONSTRAINTS.duration.hover.min).toBe(150)
      expect(MOTION_CONSTRAINTS.duration.hover.max).toBe(200)
    })

    it("overlay duration bounds are 100-200ms", () => {
      expect(MOTION_CONSTRAINTS.duration.overlay.min).toBe(100)
      expect(MOTION_CONSTRAINTS.duration.overlay.max).toBe(200)
    })

    it("hover scale bounds are 1.02-1.05", () => {
      expect(MOTION_CONSTRAINTS.hoverScale.min).toBe(1.02)
      expect(MOTION_CONSTRAINTS.hoverScale.max).toBe(1.05)
    })

    it("hover opacity shift max is 0.1", () => {
      expect(MOTION_CONSTRAINTS.hoverOpacityShift.max).toBe(0.1)
    })

    it("displacement max is 30px", () => {
      expect(MOTION_CONSTRAINTS.displacement.max).toBe(30)
    })

    it("rotation max is 10 degrees", () => {
      expect(MOTION_CONSTRAINTS.rotation.max).toBe(10)
    })

    it("backdrop blur overlay range is 4-12px", () => {
      expect(MOTION_CONSTRAINTS.backdropBlur.overlay.min).toBe(4)
      expect(MOTION_CONSTRAINTS.backdropBlur.overlay.max).toBe(12)
    })

    it("banned easings include spring and bounce", () => {
      expect(MOTION_CONSTRAINTS.bannedEasings).toContain("spring")
      expect(MOTION_CONSTRAINTS.bannedEasings).toContain("bounce")
    })

    it("animatable properties are only transform and opacity", () => {
      expect(MOTION_CONSTRAINTS.animatableProperties).toEqual([
        "transform",
        "opacity",
      ])
    })
  })

  describe("No layout-triggering properties animated", () => {
    const layoutProperties = [
      "width",
      "height",
      "top",
      "left",
      "margin",
      "padding",
    ]

    const allVariants = [
      { name: "fadeReveal", variants: fadeReveal },
      { name: "fadeOnly", variants: fadeOnly },
      { name: "staggerItem", variants: staggerItem },
      { name: "overlayVariants", variants: overlayVariants },
      { name: "modalContentVariants", variants: modalContentVariants },
      { name: "pageTransition", variants: pageTransition },
    ]

    for (const { name, variants } of allVariants) {
      it(`${name} does not animate layout-triggering properties`, () => {
        for (const state of Object.values(variants)) {
          if (typeof state === "object" && state !== null) {
            const keys = Object.keys(state)
            for (const prop of layoutProperties) {
              expect(keys).not.toContain(prop)
            }
          }
        }
      })
    }
  })
})
