"use client";

import { useState, useEffect } from "react";

interface StackBlitzPreviewProps {
  repo: string; // format: owner/name
  branch?: string;
  title?: string;
}

export default function StackBlitzPreview({ repo, branch = "main", title = "Live Preview" }: StackBlitzPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [repo, branch]);

  const stackblitzUrl = `https://stackblitz.com/github/${repo}?file=index.html&embed=1&theme=dark`;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <a
          href={stackblitzUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
        >
          Open in StackBlitz
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-surface-muted/30 rounded-lg">
          <div className="text-center">
            <svg className="animate-spin h-6 w-6 text-ink-muted mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-ink-muted">Loading preview...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <iframe
          src={stackblitzUrl}
          className="flex-1 w-full rounded-lg border border-line bg-white"
          style={{ minHeight: "400px" }}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError("Failed to load preview");
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
