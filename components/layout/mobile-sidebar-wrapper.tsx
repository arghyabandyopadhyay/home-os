"use client"

import { useMobileSidebar } from "@/hooks/use-mobile-sidebar"
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer"

export function MobileSidebarWrapper() {
  const isOpen = useMobileSidebar((s) => s.isOpen)
  const close = useMobileSidebar((s) => s.close)

  return <MobileSidebarDrawer open={isOpen} onClose={close} />
}
