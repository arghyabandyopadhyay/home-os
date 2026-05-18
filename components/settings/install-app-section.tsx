"use client"

import { Download } from "lucide-react"
import { useInstallPrompt } from "@/hooks/use-install-prompt"

export function InstallAppSection() {
  const { canInstall, isStandalone, isPrompting, promptInstall, platform } =
    useInstallPrompt()

  // Hide entirely when running in standalone (installed) mode
  if (isStandalone) return null

  // Show manual iOS instructions when on iOS and no native prompt available
  const showIosInstructions = platform === "ios" && !canInstall

  return (
    <div className="card-app p-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-xl bg-blue-500/10 p-3">
          <Download className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-app">Install App</h2>
          <p className="text-sm text-app-muted">
            Add Home OS to your home screen for quick access.
          </p>
        </div>
      </div>

      {canInstall && (
        <button
          onClick={promptInstall}
          disabled={isPrompting}
          className="btn-primary-app w-full"
        >
          {isPrompting ? "Installing…" : "Install App"}
        </button>
      )}

      {showIosInstructions && (
        <div className="space-y-3">
          <p className="text-sm text-app-muted">
            To install on iOS, follow these steps in Safari:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-app">
            <li>
              Tap the <span className="font-semibold">Share</span> button in the
              browser toolbar
            </li>
            <li>
              Scroll down and tap{" "}
              <span className="font-semibold">Add to Home Screen</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
