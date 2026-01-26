"use client";

import { useState } from "react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
}

interface RepoContextData {
  structure?: string;
  files?: { path: string; content: string }[];
}

interface RepoContextProps {
  repo: Repository;
  context: RepoContextData | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function RepoContext({ repo, context, loading, onRefresh }: RepoContextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-line bg-surface-muted/70">
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-surface-muted/80 dark:hover:bg-surface-strong/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <div>
            <span className="text-sm font-medium text-ink">{repo.full_name}</span>
            {loading ? (
              <span className="ml-2 text-xs text-ink-muted">Loading context...</span>
            ) : context ? (
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                {context.files?.length || 0} files loaded
              </span>
            ) : (
              <span className="ml-2 text-xs text-ink-muted">No context loaded</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="p-1.5 rounded-sm hover:bg-surface-strong/80 dark:hover:bg-surface-strong transition-colors"
            title="Refresh context"
          >
            <svg
              className={`w-4 h-4 text-ink-muted ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-ink-muted transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && context && (
        <div className="px-4 pb-4 space-y-4">
          {/* Structure */}
          {context.structure && (
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Repository Structure
              </h4>
              <pre className="text-xs text-ink-muted bg-surface border border-line rounded-sm p-3 overflow-x-auto max-h-48">
                {context.structure}
              </pre>
            </div>
          )}

          {/* Files */}
          {context.files && context.files.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Loaded Files ({context.files.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {context.files.map((file) => (
                  <span
                    key={file.path}
                    className="px-2 py-1 text-xs bg-surface border border-line rounded text-ink-muted"
                  >
                    {file.path}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
