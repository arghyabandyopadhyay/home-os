"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[272px] border-none bg-transparent p-0"
      >
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}