"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { DURATION, EASING, reducedMotionVariants } from "@/lib/motion"
import type { Revision, RevisionGroup } from "@/types/revision"

import { RevisionItem } from "@/components/notes/revision-item"
import { RevisionGroupItem } from "@/components/notes/revision-group-item"

type RevisionListProps = {
  items: (Revision | RevisionGroup)[]
  selectedId: string | null
  compareMode: boolean
  selectedForCompare: string[]
  onSelect: (revisionId: string) => void
  onCompareSelect: (revisionId: string) => void
  onToggleGroup: (groupId: string) => void
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
}

/** Custom stagger container with 40ms stagger delay for revision list */
const revisionStaggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04, // 40ms stagger
    },
  },
}

/** Custom stagger item with 150ms duration for revision list */
const revisionStaggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.fast, // 150ms
      ease: EASING.entrance,
    },
  },
}

function isRevisionGroup(item: Revision | RevisionGroup): item is RevisionGroup {
  return "revisions" in item && Array.isArray((item as RevisionGroup).revisions)
}

export function RevisionList({
  items,
  selectedId,
  compareMode,
  selectedForCompare,
  onSelect,
  onCompareSelect,
  onToggleGroup,
  onLoadMore,
  hasMore,
  loading,
}: RevisionListProps) {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(-1)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Handle infinite scroll — trigger onLoadMore when within 100px of bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || !hasMore || loading) return

    const { scrollHeight, scrollTop, clientHeight } = container
    if (scrollHeight - scrollTop - clientHeight < 100) {
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const itemCount = items.length
      if (itemCount === 0) return

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault()
          const nextIndex = focusIndex < itemCount - 1 ? focusIndex + 1 : focusIndex
          setFocusIndex(nextIndex)
          itemRefs.current[nextIndex]?.focus()
          break
        }
        case "ArrowUp": {
          event.preventDefault()
          const prevIndex = focusIndex > 0 ? focusIndex - 1 : 0
          setFocusIndex(prevIndex)
          itemRefs.current[prevIndex]?.focus()
          break
        }
        case "Enter": {
          event.preventDefault()
          if (focusIndex >= 0 && focusIndex < itemCount) {
            const item = items[focusIndex]
            if (isRevisionGroup(item)) {
              onToggleGroup(item.id)
            } else {
              onSelect(item.id)
            }
          }
          break
        }
      }
    },
    [focusIndex, items, onSelect, onToggleGroup]
  )

  // Reset item refs array when items change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length)
  }, [items.length])

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Note revisions"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 overflow-y-auto outline-none"
    >
      <motion.div
        variants={reducedMotion ? reducedMotionVariants : revisionStaggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col"
      >
        {items.map((item, index) => {
          const itemId = isRevisionGroup(item) ? item.id : item.id
          const isSelected = selectedId === itemId
          const isFocused = focusIndex === index

          return (
            <motion.div
              key={itemId}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              variants={reducedMotion ? reducedMotionVariants : revisionStaggerItem}
              tabIndex={-1}
              data-index={index}
              aria-selected={isSelected}
              className={isFocused ? "ring-2 ring-inset ring-blue-500/50 rounded-xl" : ""}
            >
              {isRevisionGroup(item) ? (
                <RevisionGroupItem
                  group={item}
                  isSelected={isSelected}
                  compareMode={compareMode}
                  selectedForCompare={selectedForCompare}
                  onSelect={onSelect}
                  onCompareSelect={onCompareSelect}
                  onToggleGroup={() => onToggleGroup(item.id)}
                />
              ) : (
                <RevisionItem
                  revision={item}
                  isSelected={isSelected}
                  compareMode={compareMode}
                  isChecked={selectedForCompare.includes(item.id)}
                  onSelect={() => onSelect(item.id)}
                  onCompareCheck={() => onCompareSelect(item.id)}
                />
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-app border-t-transparent" />
        </div>
      )}
    </div>
  )
}
