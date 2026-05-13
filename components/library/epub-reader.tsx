"use client";

import { useEffect, useRef } from "react";

export function EpubReader({ url }: { url: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current || !url) return;

    // Dynamically import epubjs to avoid SSR issues
    import("epubjs")
      .then(({ default: ePub }) => {
        const book = ePub(url);

        const rendition = book.renderTo(viewerRef.current!, {
          width: "100%",
          height: "100%",
        });

        rendition.display();

        return () => {
          rendition.destroy();
        };
      })
      .catch((error) => {
        console.error("Failed to load epubjs:", error);
      });
  }, [url]);

  return <div ref={viewerRef} className="h-screen w-full" />;
}
