"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)

    return () =>
      document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search everything..." />

      <CommandList>
        <CommandItem>Dashboard</CommandItem>
        <CommandItem>Notes</CommandItem>
        <CommandItem>Tasks</CommandItem>
        <CommandItem>Library</CommandItem>
      </CommandList>
    </CommandDialog>
  )
}