import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

let mockReducedMotion = false

vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const MotionDiv = React.forwardRef(
    (
      {
        children,
        className,
        initial,
        whileInView,
        viewport,
        transition,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) =>
      React.createElement(
        "div",
        {
          ref,
          className,
          "data-testid": "motion-div",
          "data-initial": JSON.stringify(initial),
          "data-while-in-view": JSON.stringify(whileInView),
          "data-viewport": JSON.stringify(viewport),
          "data-transition": JSON.stringify(transition),
          ...rest,
        },
        children
      )
  )
  MotionDiv.displayName = "MotionDiv"
  return {
    motion: { div: MotionDiv },
    useReducedMotion: () => mockReducedMotion,
  }
})

describe("SectionReveal", () => {
  afterEach(() => {
    mockReducedMotion = false
    vi.resetModules()
  })

  it("renders children inside a motion.div", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal>
        <p>Hello World</p>
      </SectionReveal>
    )

    expect(screen.getByText("Hello World")).toBeDefined()
    expect(screen.getByTestId("motion-div")).toBeDefined()
  })

  it("applies className to the motion.div", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal className="my-custom-class">
        <p>Content</p>
      </SectionReveal>
    )

    expect(screen.getByTestId("motion-div").className).toContain(
      "my-custom-class"
    )
  })

  it("uses default animation values (opacity 0→1, y 30→0)", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal>
        <p>Content</p>
      </SectionReveal>
    )

    const motionDiv = screen.getByTestId("motion-div")
    const initial = JSON.parse(motionDiv.getAttribute("data-initial") || "{}")
    const whileInView = JSON.parse(
      motionDiv.getAttribute("data-while-in-view") || "{}"
    )

    expect(initial).toEqual({ opacity: 0, y: 30 })
    expect(whileInView).toEqual({ opacity: 1, y: 0 })
  })

  it("uses viewport config with once: true and amount: 0.2", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal>
        <p>Content</p>
      </SectionReveal>
    )

    const motionDiv = screen.getByTestId("motion-div")
    const viewport = JSON.parse(
      motionDiv.getAttribute("data-viewport") || "{}"
    )

    expect(viewport).toEqual({ once: true, amount: 0.2 })
  })

  it("uses default transition values (duration 0.6, delay 0, easeOut)", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal>
        <p>Content</p>
      </SectionReveal>
    )

    const motionDiv = screen.getByTestId("motion-div")
    const transition = JSON.parse(
      motionDiv.getAttribute("data-transition") || "{}"
    )

    expect(transition).toEqual({ duration: 0.6, delay: 0, ease: "easeOut" })
  })

  it("accepts custom delay, distance, and duration props", async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal delay={0.3} distance={50} duration={0.8}>
        <p>Content</p>
      </SectionReveal>
    )

    const motionDiv = screen.getByTestId("motion-div")
    const initial = JSON.parse(motionDiv.getAttribute("data-initial") || "{}")
    const transition = JSON.parse(
      motionDiv.getAttribute("data-transition") || "{}"
    )

    expect(initial).toEqual({ opacity: 0, y: 50 })
    expect(transition).toEqual({ duration: 0.8, delay: 0.3, ease: "easeOut" })
  })

  it('sets y to 0 when direction is "none"', async () => {
    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal direction="none">
        <p>Content</p>
      </SectionReveal>
    )

    const motionDiv = screen.getByTestId("motion-div")
    const initial = JSON.parse(motionDiv.getAttribute("data-initial") || "{}")

    expect(initial).toEqual({ opacity: 0, y: 0 })
  })

  it("renders children without motion.div when reduced motion is preferred", async () => {
    mockReducedMotion = true

    const { SectionReveal } = await import(
      "@/components/landing/section-reveal"
    )
    render(
      <SectionReveal className="wrapper">
        <p>Accessible Content</p>
      </SectionReveal>
    )

    expect(screen.getByText("Accessible Content")).toBeDefined()
    expect(screen.queryByTestId("motion-div")).toBeNull()
    // Should render a plain div with the className
    const wrapper = screen.getByText("Accessible Content").parentElement
    expect(wrapper?.className).toContain("wrapper")
  })
})
