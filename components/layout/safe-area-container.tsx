"use client"

import { type ReactNode } from "react"

type SafeAreaEdge = "top" | "bottom" | "left" | "right"

type SafeAreaContainerProps = {
  edges?: SafeAreaEdge[]
  as?: React.ElementType
  className?: string
  children?: ReactNode
}

function buildSafeAreaStyle(
  edges: SafeAreaEdge[] | undefined
): React.CSSProperties {
  // undefined → all four insets
  const resolvedEdges: SafeAreaEdge[] =
    edges === undefined ? ["top", "bottom", "left", "right"] : edges

  const style: React.CSSProperties = {}

  for (const edge of resolvedEdges) {
    switch (edge) {
      case "top":
        style.paddingTop = "env(safe-area-inset-top)"
        break
      case "bottom":
        style.paddingBottom = "env(safe-area-inset-bottom)"
        break
      case "left":
        style.paddingLeft = "env(safe-area-inset-left)"
        break
      case "right":
        style.paddingRight = "env(safe-area-inset-right)"
        break
    }
  }

  return style
}

export function SafeAreaContainer({
  edges,
  as: Component = "div",
  className,
  children,
}: SafeAreaContainerProps) {
  const style = buildSafeAreaStyle(edges)

  return (
    <Component style={style} className={className}>
      {children}
    </Component>
  )
}

export type { SafeAreaEdge, SafeAreaContainerProps }
