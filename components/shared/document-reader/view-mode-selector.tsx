"use client"

import { File, ScrollText, Columns2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { type ViewMode } from "@/components/shared/document-reader/types"

type ViewModeSelectorProps = {
  currentMode: ViewMode
  onModeChange: (mode: ViewMode) => void
}

const modes: { value: ViewMode; label: string; shortLabel: string; icon: typeof File }[] = [
  { value: "single-page", label: "Single page mode", shortLabel: "Single page", icon: File },
  { value: "single-scroll", label: "Continuous scroll mode", shortLabel: "Scroll", icon: ScrollText },
  { value: "two-page-scroll", label: "Two page scroll mode", shortLabel: "Two page", icon: Columns2 },
]

export function ViewModeSelector({
  currentMode,
  onModeChange,
}: ViewModeSelectorProps) {
  const currentModeConfig = modes.find((m) => m.value === currentMode) ?? modes[0]
  const CurrentIcon = currentModeConfig.icon

  return (
    <>
      {/* Desktop segmented control — hidden below 768px */}
      <div
        className="hidden md:inline-flex items-center rounded-lg border border-app"
        role="group"
        aria-label="View mode"
      >
        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = mode.value === currentMode

          return (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              aria-label={
                isSelected
                  ? `${mode.label}, selected`
                  : mode.label
              }
              aria-pressed={isSelected}
              title={mode.label}
              className={`
                relative flex h-11 w-11 items-center justify-center
                transition-colors duration-150
                first:rounded-l-lg last:rounded-r-lg
                ${
                  isSelected
                    ? "bg-app-elevated text-app border-b-2 border-b-current"
                    : "text-app-muted hover:bg-app-elevated hover:text-app"
                }
              `}
            >
              <Icon size={18} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {/* Mobile dropdown — visible below 768px */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-app text-app hover:bg-app-elevated"
              aria-label={`View mode: ${currentModeConfig.label}`}
            >
              <CurrentIcon size={18} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {modes.map((mode) => {
              const Icon = mode.icon
              const isSelected = mode.value === currentMode

              return (
                <DropdownMenuItem
                  key={mode.value}
                  onClick={() => onModeChange(mode.value)}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{mode.shortLabel}</span>
                  {isSelected && (
                    <span className="ml-auto text-xs text-app-muted">✓</span>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
