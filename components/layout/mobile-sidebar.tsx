"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { X } from "lucide-react"
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher"

export function MobileSidebar() {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <WorkspaceSwitcher compact />
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
          className="!w-[272px] border-none bg-transparent p-0"
          showCloseButton={false}
        >
          <Sidebar
            closeButton={
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </Button>
              </SheetClose>
            }
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}