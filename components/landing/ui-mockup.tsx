"use client"

import { motion, useReducedMotion } from "framer-motion"
import { STAGGER_CHILDREN } from "@/components/landing/animation-config"

/**
 * UIMockup — A pure CSS/div-based cinematic representation of the Home OS interface.
 * Renders layered floating panels with staggered entrance animations to convey
 * depth, spatial design, and the calm multi-module environment.
 *
 * No external images — all built with divs, borders, gradients, and shadows.
 * Validates: Requirements 3.5, 3.6
 */
export function UIMockup() {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className="relative w-full max-w-lg mx-auto aspect-[4/3] min-h-[280px]">
        <MockupPanels />
      </div>
    )
  }

  return (
    <motion.div
      className="relative w-full max-w-lg mx-auto aspect-[4/3] min-h-[280px]"
      variants={STAGGER_CHILDREN.container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <MockupPanels animated />
    </motion.div>
  )
}

function MockupPanels({ animated = false }: { animated?: boolean }) {
  const Wrapper = animated ? motion.div : "div"

  const layerProps = (delay: number) =>
    animated
      ? {
          variants: {
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, delay },
            },
          },
        }
      : {}

  return (
    <>
      {/* Background panel — Tasks overview */}
      <Wrapper
        className="absolute top-4 left-0 w-[65%] h-[70%] panel-app shadow-xl rounded-2xl overflow-hidden"
        {...layerProps(0)}
      >
        <div className="p-4 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-2.5 w-20 rounded bg-app-elevated" />
          <div className="space-y-2">
            <TaskRow completed />
            <TaskRow />
            <TaskRow />
          </div>
        </div>
      </Wrapper>

      {/* Middle panel — Notes editor */}
      <Wrapper
        className="absolute top-[15%] left-[25%] w-[55%] h-[65%] panel-app shadow-2xl rounded-2xl overflow-hidden z-10"
        {...layerProps(0.15)}
      >
        <div className="p-4 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-3 w-28 rounded bg-app-elevated" />
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-app-elevated opacity-60" />
            <div className="h-2 w-[85%] rounded bg-app-elevated opacity-60" />
            <div className="h-2 w-[70%] rounded bg-app-elevated opacity-60" />
            <div className="h-2 w-[90%] rounded bg-app-elevated opacity-60" />
          </div>
        </div>
      </Wrapper>

      {/* Foreground panel — Quick capture / command */}
      <Wrapper
        className="absolute bottom-4 right-0 w-[55%] h-[40%] panel-app shadow-2xl rounded-2xl overflow-hidden z-20"
        {...layerProps(0.3)}
      >
        <div className="p-4 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
            <div className="w-2.5 h-2.5 rounded-full bg-app-elevated border border-app" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-app-elevated border border-app">
            <SearchIcon />
            <div className="h-2 w-24 rounded bg-app-elevated" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-2 w-20 rounded bg-app-elevated opacity-50" />
            <div className="h-2 w-16 rounded bg-app-elevated opacity-50" />
          </div>
        </div>
      </Wrapper>
    </>
  )
}

function TaskRow({ completed = false }: { completed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3.5 h-3.5 rounded border border-app flex-shrink-0 ${
          completed ? "bg-app-elevated" : ""
        }`}
      >
        {completed && (
          <svg
            viewBox="0 0 14 14"
            className="w-full h-full text-app-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 7l3 3 5-5" />
          </svg>
        )}
      </div>
      <div
        className={`h-2 rounded bg-app-elevated ${
          completed ? "w-24 opacity-40 line-through" : "w-32 opacity-60"
        }`}
      />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 text-app-muted flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  )
}
