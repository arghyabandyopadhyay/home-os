import { ReactNode } from "react";

/**
 * FloatingToolbar renders a sticky toolbar for contextual action buttons.
 *
 * Accessibility note: All icon-only buttons passed as children MUST include
 * a descriptive `aria-label` attribute that conveys the action (e.g., "Bold",
 * "Delete selected", "Undo"). This ensures screen reader users can identify
 * each action without visible text.
 */

type FloatingToolbarProps = {
  children: ReactNode;
  position?: "bottom" | "top";
};

export function FloatingToolbar({
  children,
  position = "bottom",
}: FloatingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Actions"
      className={`sticky ${position === "top" ? "top-6" : "bottom-6"} z-30 mx-auto flex w-fit items-center gap-2 rounded-2xl border border-app bg-app-surface px-4 py-2 shadow-lg`}
    >
      {children}
    </div>
  );
}
