"use client";

import { useEffect, useRef, useState } from "react";

interface PdfReaderProps {
  url: string;
}

export function PdfReader({ url }: PdfReaderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current || !url) return;

    // Create an iframe to display the PDF
    const iframe = iframeRef.current;
    iframe.src = url;

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setError("Failed to load PDF");
      setLoading(false);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-app text-app">
        <div className="text-center">
          <p className="text-xl mb-4">Error loading PDF</p>
          <p className="text-app-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-app text-app">
      {loading && (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-sky-500"></div>
            <p className="text-app-muted">Loading PDF...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        className="h-full w-full bg-app-surface"
        title="PDF Viewer"
      />
    </div>
  );
}
