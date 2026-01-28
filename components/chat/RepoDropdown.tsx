"use client";

import { useState, useRef, useEffect } from "react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
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
  darkTheme = true,
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

  const buttonBg = darkTheme
    ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90"
    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300";

  const menuBg = darkTheme
    ? "bg-black border-white/[0.08]"
    : "bg-white dark:bg-black border-gray-200 dark:border-gray-800";

  const itemHover = darkTheme
    ? "hover:bg-white/[0.03]"
    : "hover:bg-gray-100 dark:hover:bg-gray-900";

  const itemText = darkTheme
    ? "text-white/70 hover:text-white/90"
    : "text-gray-700 dark:text-gray-300";

  const selectedBg = darkTheme
    ? "bg-white/10 text-white"
    : "bg-black dark:bg-white text-white dark:text-black";

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
        <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-xl z-50 max-h-[300px] overflow-y-auto ${menuBg}`}>
          <div className="p-2">
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
                  <div className={`text-xs mt-0.5 ${darkTheme ? "opacity-60" : "opacity-70"} truncate`}>
                    {repo.description}
                  </div>
                )}
              </button>
            ))}
            {repos.length === 0 && (
              <div className={`px-3 py-4 text-sm text-center ${darkTheme ? "text-white/40" : "text-gray-500 dark:text-gray-400"}`}>
                No repositories yet
              </div>
            )}
          </div>
          <div className={`border-t p-2 ${darkTheme ? "border-white/[0.08]" : "border-gray-200 dark:border-gray-800"}`}>
            <button
              onClick={() => {
                onCreateRepo();
                setShowMenu(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 ${
                darkTheme ? "text-white/50 hover:bg-white/[0.03]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
