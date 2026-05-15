"use client";

import { useEffect, useRef } from "react";

export function EpubReader({ url }: { url: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current || !url) return;

    let cancelled = false;
    let rendition: {
      destroy: () => void;
      display: () => void;
      themes?: {
        register: (
          name: string,
          rules: Record<string, Record<string, string>>,
        ) => void;
        select: (name: string) => void;
        fontSize: (size: string) => void;
      };
    } | null = null;

    import("epubjs")
      .then(({ default: ePub }) => {
        const book = ePub(url);

        rendition = book.renderTo(viewerRef.current!, {
          width: "100%",
          height: "100%",
        });

        const isDark = document.documentElement.classList.contains("dark");
        rendition.themes?.register("home-os", {
          body: {
            background: isDark ? "#09090b" : "#f8fafc",
            color: isDark ? "#fafafa" : "#18181b",
            "font-family": "ui-serif, Georgia, Cambria, serif",
            "line-height": "1.65",
          },
          a: {
            color: isDark ? "#7dd3fc" : "#0369a1",
          },
        });
        rendition.themes?.select("home-os");
        rendition.themes?.fontSize("105%");

        if (cancelled) {
          rendition.destroy();
          return;
        }

        rendition.display();
      })
      .catch((error) => {
        console.error("Failed to load epubjs:", error);
      });

    return () => {
      cancelled = true;
      rendition?.destroy();
    };
  }, [url]);

  return (
    <div className="h-screen w-full bg-app px-4 py-6 text-app md:px-10">
      <div
        ref={viewerRef}
        className="mx-auto h-full w-full max-w-4xl bg-app-surface shadow-sm"
      />
    </div>
  );
}
