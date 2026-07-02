"use client"

import { useRef, useCallback, useState, KeyboardEvent } from "react"
import type { Editor } from "@tiptap/react"
import {
  Heading,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
} from "lucide-react"

type FormattingToolbarProps = {
  editor: Editor | null
}

type ToolbarButton = {
  label: string
  icon: React.ReactNode
  isActive: () => boolean
  action: () => void
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const getHeadingLevel = useCallback((): number | null => {
    if (!editor) return null
    if (editor.isActive("heading", { level: 1 })) return 1
    if (editor.isActive("heading", { level: 2 })) return 2
    if (editor.isActive("heading", { level: 3 })) return 3
    return null
  }, [editor])

  const cycleHeading = useCallback(() => {
    if (!editor) return
    const current = getHeadingLevel()
    if (current === null) {
      editor.chain().focus().setHeading({ level: 1 }).run()
    } else if (current === 1) {
      editor.chain().focus().setHeading({ level: 2 }).run()
    } else if (current === 2) {
      editor.chain().focus().setHeading({ level: 3 }).run()
    } else {
      // H3 → paragraph: toggle off the heading
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    }
  }, [editor, getHeadingLevel])

  if (!editor) return null

  const buttons: ToolbarButton[] = [
    {
      label: "Heading",
      icon: <Heading className="h-4 w-4" />,
      isActive: () => editor.isActive("heading"),
      action: cycleHeading,
    },
    {
      label: "Bold",
      icon: <Bold className="h-4 w-4" />,
      isActive: () => editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: <Italic className="h-4 w-4" />,
      isActive: () => editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Bullet List",
      icon: <List className="h-4 w-4" />,
      isActive: () => editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered List",
      icon: <ListOrdered className="h-4 w-4" />,
      isActive: () => editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Blockquote",
      icon: <Quote className="h-4 w-4" />,
      isActive: () => editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code Block",
      icon: <Code className="h-4 w-4" />,
      isActive: () => editor.isActive("codeBlock"),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ]

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const btns = toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[data-toolbar-btn]'
    )
    if (!btns || btns.length === 0) return

    if (e.key === "ArrowRight") {
      e.preventDefault()
      const next = (focusedIndex + 1) % btns.length
      setFocusedIndex(next)
      btns[next].focus()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      const prev = (focusedIndex - 1 + btns.length) % btns.length
      setFocusedIndex(prev)
      btns[prev].focus()
    }
  }

  const handleButtonFocus = (index: number) => {
    setFocusedIndex(index)
  }

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      className="flex items-center gap-1 rounded-xl border border-app bg-app-surface px-2 py-1.5"
      onKeyDown={handleKeyDown}
    >
      {buttons.map((btn, index) => {
        const active = btn.isActive()
        return (
          <button
            key={btn.label}
            type="button"
            data-toolbar-btn
            aria-label={btn.label}
            aria-pressed={active}
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={btn.action}
            onFocus={() => handleButtonFocus(index)}
            className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
              active
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:bg-app-elevated hover:text-app"
            }`}
          >
            {btn.icon}
          </button>
        )
      })}
    </div>
  )
}
