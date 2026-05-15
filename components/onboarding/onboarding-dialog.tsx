"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, FileText, LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/user-preferences-provider";

const steps = [
  {
    title: "Welcome to Home OS",
    body: "Your calm personal dashboard — one place for your mind, tasks, people, and media.",
    icon: LayoutDashboard,
  },
  {
    title: "Start your day on Today",
    body: "See what matters now: due tasks, books you're reading, pinned notes, and favorite contacts.",
    icon: CheckSquare,
  },
  {
    title: "Capture anything fast",
    body: "Use Quick capture on Today, or press ⌘K anywhere to search, navigate, or create.",
    icon: FileText,
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { prefs, loading, update } = usePreferences();

  useEffect(() => {
    if (loading || prefs.onboardingComplete) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loading, prefs.onboardingComplete]);

  async function finish(goTo?: string) {
    await update({ onboardingComplete: true });
    setOpen(false);
    if (goTo) router.push(goTo);
  }

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="border-app bg-app-surface text-app sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to Home OS</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
            <Icon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{current.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-app-muted">
              {current.body}
            </p>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                className="border-app"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
            )}
            <Button
              className="ml-auto bg-app-surface text-app hover:bg-app-elevated dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              onClick={() =>
                isLast
                  ? finish()
                  : setStep((s) => Math.min(steps.length - 1, s + 1))
              }
            >
              {isLast ? "Get started" : "Next"}
            </Button>
          </div>
          {isLast && (
            <div className="grid grid-cols-2 gap-2 border-t border-app pt-4">
              <Button
                variant="outline"
                className="border-app text-xs"
                onClick={() => finish("/notes")}
              >
                Create a note
              </Button>
              <Button
                variant="outline"
                className="border-app text-xs"
                onClick={() => finish("/tasks")}
              >
                Add a task
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
