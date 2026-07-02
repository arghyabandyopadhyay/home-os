"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Placeholder from "@tiptap/extension-placeholder"
import * as Y from "yjs"
import type { Awareness } from "y-protocols/awareness"
import { useEffect, useCallback } from "react"

export type TipTapEditorProps = {
  ydoc: Y.Doc
  awareness: Awareness
  userId: string
  color: string
  onUpdate: (content: string) => void
  editable?: boolean
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void
}

function renderCursor(user: Record<string, unknown>): HTMLElement {
  const color = String(user.color || "")
  const name = String(user.name || "Anonymous")

  const cursor = document.createElement("span")
  cursor.classList.add("collaboration-cursor__caret")
  cursor.setAttribute("style", `border-color: ${color}`)

  const label = document.createElement("div")
  label.classList.add("collaboration-cursor__label")
  label.setAttribute("style", `background-color: ${color}; color: #fff`)
  label.insertBefore(document.createTextNode(name), null)

  cursor.insertBefore(label, null)
  return cursor
}

export function TipTapEditor({
  ydoc,
  awareness,
  userId,
  color,
  onUpdate,
  editable = true,
  onEditorReady,
}: TipTapEditorProps) {
  const handleUpdate = useCallback(
    ({ editor: editorInstance }: { editor: { getJSON: () => unknown } }) => {
      const json = JSON.stringify(editorInstance.getJSON())
      onUpdate(json)
    },
    [onUpdate],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Collaboration.configure({
        document: ydoc,
        field: "default",
      }),
      CollaborationCursor.configure({
        provider: { awareness },
        user: {
          name: userId,
          color,
        },
        render: renderCursor,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    editable,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Note content",
        class: "outline-none min-h-[500px] font-mono text-lg leading-8",
      },
    },
    onUpdate: handleUpdate,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) {
    return null
  }

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  )
}
