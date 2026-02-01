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
}

export default function RepoDropdown({
  selectedRepo,
  repos,
  onSelect,
  onCreateRepo,
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

  const menuBg = "bg-surface/95 border-line/60 backdrop-blur-xl shadow-2xl";
  const itemHover = "hover:bg-surface-muted/60";
  const itemText = "text-ink-muted hover:text-ink";
  const selectedBg = "bg-accent-500/10 text-accent-500 border border-accent-500/20";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted/60 hover:bg-surface-muted/80 text-ink-muted hover:text-ink border border-line/60 transition-colors text-sm min-w-[180px] max-w-[280px]"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="truncate flex-1 text-left font-medium">
          {selectedRepo ? selectedRepo.name : "Select Repo"}
        </span>
        <svg className={`w-4 h-4 transition-transform shrink-0 ${showMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute bottom-full left-0 mb-2 w-full min-w-[280px] rounded-xl border shadow-2xl z-[9999] max-h-[350px] overflow-y-auto ${menuBg}`}>
          <div className="p-1">
            {/* Create New Repository - Now at the top */}
            <button
              onClick={() => {
                onCreateRepo();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 text-ink-muted hover:text-ink hover:bg-surface-muted/60 mb-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Create New Repository</span>
            </button>

            {/* Divider */}
            <div className="border-t border-line/60 my-1" />

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
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="font-medium truncate flex-1">{repo.name}</span>
                </div>
              </button>
            ))}
            {repos.length === 0 && (
              <div className="px-3 py-4 text-sm text-center text-ink-muted">
                No repositories yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
