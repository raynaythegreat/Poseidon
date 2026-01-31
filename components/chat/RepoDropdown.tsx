"use client";

import { useState, useRef, useEffect } from "react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch?: string;
}

interface RepoDropdownProps {
  selectedRepo: Repository | null;
  repos: Repository[];
  onSelect: (repo: Repository) => void;
  onCreateRepo: () => void;
  darkTheme?: boolean;
  compact?: boolean;
}

export default function RepoDropdown({
  selectedRepo,
  repos,
  onSelect,
  onCreateRepo,
  darkTheme: _darkTheme = true,
  compact = false,
}: RepoDropdownProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonBg =
    "bg-surface-muted/60 hover:bg-surface-muted/80 text-ink-muted hover:text-ink border border-line/60";

  const menuBg = "bg-surface/95 border-line/60 backdrop-blur-xl";
  const itemHover = "hover:bg-surface-muted/60";
  const itemText = "text-ink-muted hover:text-ink";
  const selectedBg = "bg-poseidon-teal-mid/15 text-ink ring-1 ring-poseidon-teal-light/25";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-lg ${buttonBg} transition-colors ${compact ? "text-xs" : "text-sm"}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        {!compact && (
          <span className="truncate max-w-[120px]">
            {selectedRepo ? selectedRepo.name : "Select Repo"}
          </span>
        )}
        <svg className={`w-4 h-4 transition-transform ${showMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute bottom-full left-0 mb-2 w-56 rounded-xl border shadow-xl z-[9999] max-h-[300px] overflow-y-auto ${menuBg}`}>
          <div className="p-2">
            {/* Create New Repository - Now at the top */}
            <button
              onClick={() => {
                onCreateRepo();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 text-ink-muted hover:text-ink hover:bg-surface-muted/60 mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Repository
            </button>

            {/* Divider */}
            <div className="border-t border-line/60 my-2" />

            {repos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => {
                  onSelect(repo);
                  setShowMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  selectedRepo?.id === repo.id
                    ? selectedBg
                    : `${itemText} ${itemHover}`
                }`}
              >
                <div className="font-medium truncate">{repo.name}</div>
                {repo.description && (
                  <div className="text-xs mt-0.5 text-ink-subtle truncate">
                    {repo.description}
                  </div>
                )}
              </button>
            ))}
            {repos.length === 0 && (
              <div className="px-3 py-4 text-sm text-center text-ink-subtle">
                No repositories yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
