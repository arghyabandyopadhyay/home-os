"use client"

import { Bell } from "lucide-react"

export function NotificationEmpty() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-16">
      <div className="flex flex-col items-center text-center">
        <Bell className="mb-4 h-12 w-12 text-app-muted" />
        <h2 className="text-xl font-semibold tracking-tight">All caught up</h2>
        <p className="mt-2 max-w-sm text-sm text-app-muted">
          No notifications yet
        </p>
      </div>
    </div>
  )
}
